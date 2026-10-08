# @app/schema

Request and response schemas of the API, shared by the server and the UI.

The schemas are defined with [Zod](https://zod.dev), extended by [`@hono/zod-openapi`](https://github.com/honojs/middleware/tree/main/packages/zod-openapi). A single definition validates requests, types the handlers' responses, describes the endpoint in the OpenAPI document, and types the props of the views rendering the response.

## Contents

```
src/
├── requests/    <topic>.requests.ts   request schemas, grouped by topic
└── responses/   <topic>.responses.ts  response schemas, grouped by topic
```

Each file exports a default object with named schemas, for example:

```ts
const statusResponses = {

  getStatus: z.object({
    uptime: z.number().describe('Server uptime in milliseconds'),
  }).openapi({
    example: {
      uptime: 38549267,
    },
  }),
}

export default statusResponses
```

## Public interface

| Export | Source |
|---|---|
| `@app/schema/requests/<topic>` | `src/requests/<topic>.requests.ts` |
| `@app/schema/responses/<topic>` | `src/responses/<topic>.responses.ts` |

## Usage

- **`@app/api`** uses the schemas in route definitions (`request`, `responses[status].schema`).
- **`@app/ui`** imports them only as types, to type the props of views: `view<typeof statusResponses.getStatus>(…)`. The schemas themselves don't end up in the browser bundle.

Schemas must stay free of server-only code, since their types are shared with the browser code.

## Build

`rimraf dist && tsc -p tsconfig.build.json` compiles `src/` into `dist/`, with type declarations.

## See also

- [Server-side rendering and hydration](../../docs/rendering.md#assigning-views-to-routes) — how schemas, views and routes fit together
