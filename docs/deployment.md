# Deployment

The production build produces a single self-contained artifact: `apps/server/dist`. It contains the server bundled with all its dependencies and the browser bundle, and runs on Node.js without `node_modules`.

## Building

```sh
pnpm install
pnpm build
```

`pnpm build` builds all packages in dependency order (see [Vite setup](vite.md#production-builds)). The result:

```
apps/server/dist/
├── index.js         the server, with all its dependencies
├── index.js.map     its source map
└── client/          the browser bundle, served as static files
    ├── assets/
    └── favicon.svg
```

## Running

```sh
pnpm start
```

`pnpm start` runs `node --enable-source-maps dist/index.js` in `apps/server`. The artifact doesn't depend on its location: the server finds the browser bundle relative to its own file (`import.meta.dirname`), so `apps/server/dist` can be copied anywhere and started with `node --enable-source-maps index.js`.

## Configuration

The configuration is read from environment variables by `packages/utils/src/config.ts`:

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `production` in the production server, `development` otherwise | `development`, `production` or `test` |
| `PORT` | `3000` | HTTP port the server listens on |
| `APP_NAME` | the root package name | application name |
| `API_DOCS` | `true` | serves the OpenAPI document at `/docs.json` and Swagger UI at `/docs` |

### `NODE_ENV`

`config.ts` defaults `NODE_ENV` to `development` when it isn't set, which suits the dev server. The production server must run in production mode, because React picks its build (development or production) from `NODE_ENV` at runtime; the bundle contains both.

The server entry therefore imports `apps/server/src/production.ts` before anything else; it sets `NODE_ENV` to `production` unless the environment sets it explicitly. The import must stay first, so that it runs before any other module reads the variable. The import order lint rules don't reorder imports without bindings, so they leave it in place.

## The production server

`apps/server/src/index.ts` creates a Hono application which:

1. serves the files of `dist/client` with `serveStatic` from `@hono/node-server`;
2. passes all other requests to the API (`@app/api`), mounted with `app.route('/', api)`.

Static files are served before the API's middleware, so they get neither compression nor the security headers. Hashed assets could also get long-lived cache headers. See [Roadmap](roadmap.md).

## The self-contained bundle

`ssr.noExternal: true` in `apps/server/vite.config.ts` bundles every dependency into `index.js`.

**Benefits:**

- No `node_modules` and no dependency installation in the deployment.
- Faster startup: there's no module resolution through `node_modules`, and far fewer files are read.
- Runtime performance is the same as unbundled code.

**What's inside:** about 2.1 MB (430 kB compressed), including both builds of React (development and production) and the root `package.json`, which `config.ts` imports for the application name and version.

**Limitations.** Some packages don't survive bundling:

- packages with native addons (`.node` files), such as `bcrypt`, `sharp` or `better-sqlite3`;
- packages that read their own files at runtime (templates, `.wasm` files, data files), such as database engines;
- packages that load modules with computed paths (`require(name)`).

Such a package has to be excluded from bundling (`ssr.external` in `apps/server/vite.config.ts`) and installed next to the bundle. None of the current dependencies needs that.

**Source maps.** Stack traces are mapped with `--enable-source-maps`. The server's own code maps to its TypeScript sources; code from other packages maps to their build outputs (for example `packages/api/dist/index.js`), because Rolldown doesn't chain the source maps of the packages. The build outputs aren't minified, so the traces stay readable.

## Docker

The artifact makes for a small image: a Node.js base image and the contents of `apps/server/dist`. A sketch of a multi-stage build (not tested yet):

```dockerfile
FROM node:26-slim AS build
RUN corepack enable
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

FROM node:26-slim
WORKDIR /app
COPY --from=build /app/apps/server/dist ./
EXPOSE 3000
CMD ["node", "--enable-source-maps", "index.js"]
```

Without bundling, the image would need the production `node_modules` as well (for example with `pnpm deploy --prod`), which is bigger and slower to build.

## Cloudflare Workers (future)

The packages are prepared for a serverless target, but deploying there requires its own entry point. Things to consider:

- **A separate app package.** `@app/api` and `@app/ui` contain no runtime-specific code. A Workers target would get its own package (for example `apps/worker`) with its own entry point and Vite configuration, consuming the same packages as `@app/server`.
- **Bundling is mandatory.** A Worker is uploaded as a bundle; there's no `node_modules` at runtime.
- **Entry point.** A Worker exports a `fetch` handler; the Hono application can be exported directly. `@hono/node-server`, `serveStatic` and `production.ts` don't apply.
- **Static files.** The browser bundle (`@app/ui`'s `dist/client`) would be deployed as Workers Static Assets instead of being copied next to the server.
- **React.** The Node.js build of `react-dom/server` relies on Node.js streams; a Worker needs React's edge build, which Vite picks through the `workerd`/`worker` resolution conditions. Cloudflare's Vite plugin (`@cloudflare/vite-plugin`) configures that and runs the Worker in the Workers runtime during development.
- **Configuration.** Workers receive configuration as bindings rather than environment variables. `config.ts` reads `process.env` when it's loaded; whether the `nodejs_compat` flag populates it in time needs to be verified.
- **Size limits.** A Worker may have 3 MB (free plan) or 10 MB (paid plans) after compression. The current bundle is well below that, and a Worker build wouldn't include React's development build.
