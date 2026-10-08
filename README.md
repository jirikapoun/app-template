# App template

A template for full-stack TypeScript applications built on [Maveric](libs/maveric/README.md): a typed JSON API with OpenAPI documentation, whose responses can also be rendered as server-side rendered, hydrated React pages.

The repository is also the home and reference project of the Maveric framework, in `libs/`.

## Technology stack

- [Hono](https://hono.dev) with [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) and [Zod](https://zod.dev) — the API, its schemas and the OpenAPI document
- [React 19](https://react.dev) — views, rendered on the server and hydrated in the browser
- [Vite 8](https://vite.dev) with [Rolldown](https://rolldown.rs) — development server and production builds
- [TypeScript](https://www.typescriptlang.org) 7 (and 6 for ESLint)
- [pnpm](https://pnpm.io) workspaces and [Turborepo](https://turborepo.com)

## Quick start

Requirements: Node.js 26 and pnpm (the version is pinned in `package.json`; with Corepack enabled, it's picked automatically).

```sh
pnpm install
pnpm dev
```

Open [http://localhost:5173/status](http://localhost:5173/status) in a browser for the rendered page, or request the same URL as JSON:

```sh
curl http://localhost:5173/status
```

The API documentation is at [http://localhost:5173/docs](http://localhost:5173/docs).

For production:

```sh
pnpm build
pnpm start    # http://localhost:3000
```

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | starts the development server at `http://localhost:5173` |
| `pnpm build` | builds all packages for production |
| `pnpm start` | starts the production server at `http://localhost:3000` |
| `pnpm lint` | runs ESLint on the whole project |
| `pnpm typecheck` | type-checks the whole project |

## Repository structure

```
apps/
└── server/          @app/server       Node.js entry point, deployable production bundle
packages/
├── api/             @app/api          Hono application: controllers, middleware, API documentation
├── schema/          @app/schema       request and response schemas, shared by server and UI
├── ui/              @app/ui           views and layout, browser bundle
└── utils/           @app/utils        server-side utilities, configuration
libs/
├── maveric/                           documentation of the Maveric framework
├── maveric-client/  @maveric/client   view() helper, browser runtime
├── maveric-server/  @maveric/server   controllers, rendering middleware
└── maveric-vite/    @maveric/vite     Vite plugin
docs/                                  technical documentation
```

Every package has its own README: [`@app/server`](apps/server/README.md), [`@app/api`](packages/api/README.md), [`@app/schema`](packages/schema/README.md), [`@app/ui`](packages/ui/README.md), [`@app/utils`](packages/utils/README.md), [`@maveric/client`](libs/maveric-client/README.md), [`@maveric/server`](libs/maveric-server/README.md), [`@maveric/vite`](libs/maveric-vite/README.md).

## Architecture in brief

- **`libs/`** contains the framework, `packages/` the layers of the application, and `apps/` the deployable entry points.
- **A request is answered with JSON or a page.** A controller returns data; the rendering middleware answers with JSON, or renders the route's view with the data and the browser hydrates it.
- **Development and production differ deliberately.** During development, the whole project is one program, resolved from sources, with one dev server. For production, every package is built on its own, from its sources and the build outputs of its dependencies.

See [Architecture](docs/architecture.md) for details.

## Documentation

| Document | Topic |
|---|---|
| [Architecture](docs/architecture.md) | packages, request lifecycle, development and production contexts, key decisions |
| [TypeScript configuration](docs/typescript.md) | configuration files, ambient types, TypeScript versions |
| [Workspace packages](docs/workspace-packages.md) | package conventions, the `source` export condition, pnpm, Turborepo, adding a package |
| [Vite setup](docs/vite.md) | development server, production builds |
| [Server-side rendering and hydration](docs/rendering.md) | views, rendering middleware, client manifest, browser runtime |
| [Hot reloading](docs/hot-reload.md) | Fast Refresh, refreshing pages after server-side changes |
| [Deployment](docs/deployment.md) | production artifact, configuration, Docker, Cloudflare Workers |
| [Tooling](docs/tooling.md) | scripts, ESLint, formatting, editor, Git conventions |
| [Roadmap](docs/roadmap.md) | planned features, known limitations |

## Conventions

- Files use LF line endings and the formatting defined in `.editorconfig`.
- ESLint checks the whole project, with type information; aim for zero warnings.
- Commit messages are a short, lowercase summary in the imperative mood.

See [Tooling](docs/tooling.md).
