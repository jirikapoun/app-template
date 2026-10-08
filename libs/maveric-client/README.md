# @maveric/client

The client-side part of [Maveric](../maveric/README.md): the `view()` helper for defining views, the browser runtime that hydrates them, and the contracts shared by the server, the browser and the build.

> **Status:** early development (0.0.x). The API may change.

## Installation

```sh
pnpm add @maveric/client react react-dom
```

`react` and `react-dom` (19) are peer dependencies. The package isn't published yet; within the monorepo, it's a workspace dependency (`"@maveric/client": "workspace:*"`).

## Quick start

Define a view for a response schema; its props are typed by the schema:

```tsx
import { view } from '@maveric/client'

import type statusResponses from './status.responses.js'


const StatusView = view<typeof statusResponses.getStatus>(({ uptime }) => (
  <html lang="en">
    <head>
      <title>Status</title>
    </head>
    <body>
      <strong>Uptime:</strong> {uptime} milliseconds
    </body>
  </html>
))

export default StatusView
```

Assign the view to a route with [`@maveric/server`](../maveric-server/README.md), and let [`@maveric/vite`](../maveric-vite/README.md) generate the client manifest. The browser runtime is loaded by the rendering middleware automatically.

## API

### `view<PropsSchema>(component)`

Turns a React component into a view, with props typed by a Zod schema.

```ts
function view<PropsSchema extends ZodType>(component: SyncComponent<z.infer<PropsSchema>>): View<z.infer<PropsSchema>>
```

- `PropsSchema` — the response schema whose data the view renders; usually `typeof someSchema`.
- `component` — the component rendering the view. It must be synchronous (views are rendered with `renderToString`), so async components aren't accepted.
- Returns the component itself, typed as `View`.

Rules for views:

- **Render the whole document**, including `<html>`, `<head>` and `<body>` (usually through a shared layout component). The browser hydrates the whole document.
- **Pass the component as the first argument**, and export the view as the module's only export, as a variable (`export default StatusView`). React Fast Refresh relies on both.
- **Keep the first render deterministic** and the imports browser-safe: views are rendered on the server and again in the browser.

### `View<Props>`

The type of a view: a synchronous component with an optional `displayName`. The Vite plugin sets `displayName` to the name of the view's file.

### `@maveric/client/runtime`

The browser entry point. It reads the hydration payload from the page, imports the view module and hydrates the document (`hydrateRoot(document, …)`). In development, it also handles refreshes after server-side changes.

The runtime isn't imported by application code: the Vite plugin adds it to the browser bundle, and the rendering middleware loads it into every page with a view.

### Contracts

Types and constants shared by `@maveric/server`, `@maveric/vite` and the runtime:

| Export | Kind | Description |
|---|---|---|
| `ClientManifest` | type | client-side code of the views: `{ runtime, views, head, body }` |
| `ClientEntry` | type | one client-side entry: `{ url, preload, css }` |
| `Payload` | type | data passed from the server to the runtime: `{ view, props }` |
| `PAYLOAD_ELEMENT_ID` | constant | id of the `<script type="application/json">` element holding the payload (`__maveric`) |
| `HMR_EVENTS` | constant | names of the custom HMR events exchanged with the dev server (`hydrated`, `serverUpdate`) |

## How it works

1. The server renders the view and injects the payload (`{ view: <URL of the view module>, props }`) and the runtime's module script into the page.
2. The runtime reads the payload, imports the view module and hydrates the document with the same props.
3. In development, it tells the dev server it has hydrated a view, and re-renders the view with fresh props when server-side code changes.

## Compatibility

- React 19
- Browsers supporting ES modules and top-level `await`
- The development features require Vite 8 (`import.meta.hot`)

## Limitations

- One view per page; views render synchronously.

See the [roadmap](../../docs/roadmap.md) of the project.
