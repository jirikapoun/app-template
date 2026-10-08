# @app/api

The API layer of the application: a [Hono](https://hono.dev) application with typed routes, OpenAPI documentation and server-side rendered pages. It doesn't depend on a particular runtime; deployable entry points (such as `@app/server`) import it and run it.

## Contents

```
src/
├── index.ts         the application: middleware, controllers, documentation, error handling
└── controller/      controllers, one per topic (status.controller.ts, …)
```

## Public interface

| Export | Source |
|---|---|
| `@app/api` (default export) | `src/index.ts`: the Hono application (`OpenAPIHono`) |

## The application

`src/index.ts` sets up, in this order:

1. **Middleware:** compression, security headers, and the rendering middleware from `@maveric/server`, configured with the client manifest from `@app/ui`:

   ```ts
   import manifest from '@app/ui/manifest'

   new OpenAPIHono()
     .use(compress())
     .use(secureHeaders())
     .use(rendering({ manifest }))
   ```

2. **Controllers**, mounted on their paths (`/status`, …).
3. **API documentation**, when `API_DOCS` is enabled: the OpenAPI document at `/docs.json` and Swagger UI at `/docs`.
4. **Error handling:** errors are logged and answered with a plain `500 Internal Server Error`.

## Controllers

A controller is a `Controller` from `@maveric/server` with endpoints defined by `route()`. Each endpoint declares its request and response schemas (from `@app/schema`) and, optionally, a view per status (from `@app/ui`). The handler responds with `ctx.render(data, status)`:

```ts
const statusController = new Controller()

  .endpoint(route({
    method: 'get',
    path: '',
    responses: {
      200: {
        schema: statusResponses.getStatus,
        view: StatusView,
      },
    },
  }), async ctx =>
    ctx.render({
      uptime: Date.now() - startTime,
    }, 200))
```

The same URL answers with JSON or, for browsers asking for HTML, with the rendered view. `ctx.render()` requires the status: the rendering middleware chooses the view by it.

## Build

`rimraf dist && tsc -p tsconfig.build.json` compiles `src/` into `dist/`, with type declarations.

## See also

- [Architecture](../../docs/architecture.md#request-lifecycle) — how a request flows through the application
- [Server-side rendering and hydration](../../docs/rendering.md)
