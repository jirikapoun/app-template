# @app/server

The Node.js entry point of the application, and its deployable production build. It serves the application from `@app/api` together with the browser bundle from `@app/ui`.

During development, this package isn't used: the dev server runs `@app/api` directly (see [Vite setup](../../docs/vite.md#development-server)).

## Contents

```
src/
├── index.ts         the server: static files, the API, the HTTP listener
└── production.ts    defaults NODE_ENV to production; imported first
vite.config.ts       production bundle
```

## The server

`src/index.ts`:

1. imports `./production.js` first, so that `NODE_ENV` is `production` unless set explicitly, before any other module reads it;
2. creates a Hono application that serves the files of the browser bundle (`client/` next to the bundle) and passes all other requests to `@app/api`;
3. listens on the configured port (`PORT`, default `3000`) with `@hono/node-server`.

## Build

`tsc -p tsconfig.build.json && vite build`:

1. `tsc` type-checks the package (its build configuration sets `noEmit`);
2. Vite bundles `src/index.ts` with **all** its dependencies into `dist/index.js`, with a source map;
3. the browser bundle of `@app/ui` is copied to `dist/client`.

```
dist/
├── index.js        the server, with all its dependencies
├── index.js.map
└── client/         the browser bundle, served as static files
```

The result is self-contained: it runs without `node_modules`, from any location.

## Running

```sh
pnpm start                                    # from the project root
node --enable-source-maps dist/index.js       # from this package, or anywhere with the copied dist
```

## Notes

- **Bundling limitations.** Packages with native addons, or packages reading their own files at runtime, can't be bundled; they would have to be excluded from bundling and installed next to the bundle.
- **Static files** are served before the API's middleware, without compression or security headers.
- **One app per target.** This package is the Node.js target. Another runtime, such as Cloudflare Workers, would get its own app package using the same `@app/api` and `@app/ui`.

## See also

- [Deployment](../../docs/deployment.md)
- [Vite setup](../../docs/vite.md#appserver)
