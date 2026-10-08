# @maveric/server

The server-side part of [Maveric](../maveric/README.md): typed controllers whose routes define their schemas and views in one place, and a rendering middleware that answers each request with JSON or a server-rendered, hydrated HTML page.

Built on [Hono](https://hono.dev) and [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi): every route is also described in the OpenAPI document.

> **Status:** early development (0.0.x). The API may change.

## Installation

```sh
pnpm add @maveric/server @maveric/client hono react react-dom
```

`hono` (4), `react` and `react-dom` (19) are peer dependencies. The package isn't published yet; within the monorepo, it's a workspace dependency (`"@maveric/server": "workspace:*"`).

## Quick start

```ts
import { OpenAPIHono, z } from '@hono/zod-openapi'
import { Controller, rendering, route } from '@maveric/server'
import manifest from 'virtual:maveric/manifest'

import StatusView from './StatusView.js'


const getStatus = z.object({ uptime: z.number() })

const statusController = new Controller()
  .endpoint(route({
    method: 'get',
    path: '',
    responses: {
      200: { schema: getStatus, view: StatusView },
    },
  }), async ctx => ctx.render({ uptime: performance.now() }, 200))

const app = new OpenAPIHono()
  .use(rendering({ manifest }))
  .route('/status', statusController)

export default app
```

- `GET /status` with `Accept: application/json` answers `{"uptime": …}`.
- `GET /status` from a browser (`Accept: text/html`) answers the rendered `StatusView`, which hydrates in the browser.

The client manifest comes from [`@maveric/vite`](../maveric-vite/README.md).

## API

### `Controller`

A Hono application (it extends `OpenAPIHono`) with an additional method for defining endpoints. Mount controllers like any Hono application: `app.route('/path', controller)`.

#### `controller.endpoint(route, handler, hook?)`

Registers an endpoint and returns the controller, so endpoints can be chained.

- `route` — the route definition, created with `route()`.
- `handler` — the Hono handler. Its return type is checked against the declared responses: each status must return data matching its schema, statuses without a schema return an empty body.
- `hook` — optional validation hook, as in `@hono/zod-openapi`.

For every response with a `schema` or a `view`, the endpoint describes the content in the OpenAPI document (`application/json`, and `text/html` for views) and attaches the views to the handler, where the rendering middleware finds them.

### `route(config)`

Creates a route definition. It accepts the route configuration of `@hono/zod-openapi` (`method`, `path`, `request`, `middleware`, …), except that a response is defined by:

| Property | Description |
|---|---|
| `schema` | Zod schema of the JSON body |
| `view` | a view from `@maveric/client` rendering the response as HTML; its props are typed by `schema` |
| others | OpenAPI response fields such as `description` or `summary` |

Path parameters use the OpenAPI syntax (`/users/{id}`).

### `rendering({ manifest })`

A Hono middleware that sets the renderer for `ctx.render()`.

- `manifest` — the client manifest (`ClientManifest` from `@maveric/client`), usually `virtual:maveric/manifest`.

#### `ctx.render(data, status, headers?)`

Responds with `data`:

1. As **JSON**, unless the request prefers HTML (`Accept`).
2. As **HTML** otherwise: the route's view for `status` is rendered with `data` as its props, and the page gets the hydration payload, the browser runtime and preload links from the manifest. Routes without a view for the status answer JSON.

`status` is required, because the view is chosen by it. The props are passed through `JSON.stringify` and `JSON.parse` first, so the server renders exactly what the browser receives.

## How it works

- Views are rendered with `renderToString` and must render the whole document. The client code is injected at the end of `<head>` and `<body>`, outside the tree rendered by React, which React 19 ignores during hydration.
- The middleware finds the views on the handler of the matched route, also when the application is mounted into another one.
- A view missing from the manifest is rendered without hydration, with a warning in the log.

## Compatibility

- Hono 4, `@hono/zod-openapi` 1
- React 19
- Node.js; other runtimes Hono runs on (such as Cloudflare Workers) need the matching server build of React (`react-dom/server.edge`), which bundlers pick through resolution conditions

## Limitations

- One view per response; synchronous rendering (no streaming).
- A status set only by `ctx.status()` isn't used to choose the view.
- HTML responses aren't described in detail in the OpenAPI document yet.

See the [roadmap](../../docs/roadmap.md) of the project.
