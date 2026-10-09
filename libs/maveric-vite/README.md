# @maveric/vite

The [Vite](https://vite.dev) plugin of [Maveric](../maveric/README.md). It generates the client manifest that connects views to their client-side code, builds the browser bundle, and provides hot reloading for server-rendered, hydrated pages: React Fast Refresh for views, and in-place refreshes after server-side changes.

> **Status:** early development (0.0.x). The API may change.

## Installation

```sh
pnpm add -D @maveric/vite vite @vitejs/plugin-react
```

`vite` (8) and `@maveric/client` are peer dependencies. `@vitejs/plugin-react` provides Fast Refresh. The package isn't published yet; within the monorepo, it's a workspace dependency (`"@maveric/vite": "workspace:*"`).

## Quick start

```ts
// vite.config.ts
import devServer from '@hono/vite-dev-server'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { maveric } from '@maveric/vite'


export default defineConfig({
  plugins: [
    devServer({ entry: './src/app.ts', injectClientScript: false }),
    react(),
    maveric({ views: 'src/view/**/*.tsx' }),
  ],
})
```

Pass the manifest to the rendering middleware of [`@maveric/server`](../maveric-server/README.md):

```ts
import manifest from 'virtual:maveric/manifest'

app.use(rendering({ manifest }))
```

For TypeScript, reference the declaration of the virtual module, for example in an `env.d.ts`:

```ts
/// <reference types="@maveric/vite/manifest" />
```

## API

### `maveric(options)`

| Option | Type | Description |
|---|---|---|
| `views` | `string \| string[]` | glob pattern(s) of the view modules, relative to the Vite root |

### `virtual:maveric/manifest`

The client manifest (`ClientManifest` from `@maveric/client`): for every view component its client-side entry, plus the entry of the browser runtime and HTML to inject into pages, and during development a function rendering the stylesheets of a view. Its type is declared by `@maveric/vite/manifest`.

## What the plugin does

### In development

- **Generates the manifest** with the source URLs of the views and the runtime, and regenerates it when view files are added or removed (not exercised yet).
- **Collects the scripts Vite and its plugins inject into pages** (the Vite client, the React Refresh setup) by running `transformIndexHtml()` on an empty document, and passes them to the rendering middleware through the manifest.
- **Renders the stylesheets a view imports into the page**, so that it's styled before its scripts run. They're `<style data-vite-dev-id>` elements, which Vite's client adopts and keeps up to date instead of injecting its own copies. The stylesheets are loaded with the module runner of the `ssr` environment; if it can't run modules, pages are rendered without them, and the plugin logs a warning.
- **Sets a display name on every view** (the file name), so that React Fast Refresh recognizes views as components. Views must be exported as default, as a variable.
- **Refreshes pages after server-side changes.** When a module used only on the server changes, tabs with a hydrated view re-render it with fresh props, without reloading; other tabs reload.
- **Lets the dependency optimizer discover the views' dependencies** before the first page load.

### In builds

- **Builds all environments** with `vite build`, the `client` environment first.
- **Builds the browser bundle**: the runtime and every view become entries of the `client` environment.
- **Targets the project's browsers:** with a [browserslist](https://github.com/browserslist/browserslist) configuration (a `browserslist` field in `package.json`, `.browserslistrc`, found from the Vite root upwards), the plugin sets the `build.target` of the `client` environment to the oldest version of each browser it lists, unless the configuration sets a target itself. Browsers Vite can't target, such as Samsung Internet, are left out; Chrome and Firefox for Android count as their desktop versions. Without a configuration, Vite's default applies.
- **Generates the manifest for the server build** from the client build, with hashed URLs, preload lists and stylesheets. Vite's own manifest, which maps source files to built files, is removed from the browser bundle.

The server build is configured by the application. In a single-package application, the `ssr` environment bundles the server entry, including the manifest. In a monorepo, the package containing the views can build its server-side modules as a library in the `ssr` environment and export the manifest from it.

## Requirements

- Vite 8
- React 19 with `@vitejs/plugin-react` (for Fast Refresh)
- A server-side rendering setup running the application in the dev server, such as `@hono/vite-dev-server` with `injectClientScript: false` (the rendering middleware injects the scripts). Make sure the dev server serves the source modules requested by the browser itself: `@hono/vite-dev-server` passes every URL not matching its `exclude` patterns to the application, so add a pattern for your source directories (for example `/^\/src\//`).

## Notes

- The plugin is loaded by Node.js when Vite reads its configuration, so in a monorepo it's used from its build output.
- Files matching `views` must be views: one view per module, exported as default.

See the [roadmap](../../docs/roadmap.md) of the project.
