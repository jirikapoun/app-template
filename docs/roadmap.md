# Roadmap and known limitations

## Planned

- **API client.** A typed client generated from the route definitions and schemas, usable from views.
- **Polling the server status.** `StatusView` should periodically fetch the uptime from the server, to show whether the server is still up. It already follows new props (see [Hot reloading](hot-reload.md#effects-and-fast-refresh)); it needs the API client.
- **Dynamic navigation.** Navigation in the layout, rendered in every view. Since every page URL also serves its data as JSON, client-side navigation can fetch the props of the next page and render its view without a full page load.
- **Cloudflare Workers.** A second deployment target next to the Node.js server; see [Deployment](deployment.md#cloudflare-workers-future).
- **Standalone Maveric.** Moving `libs/` into its own repository, with an overarching `maveric` package bundling the framework packages for simpler projects. Its documentation is prepared in [`libs/maveric/README.md`](../libs/maveric/README.md).
- **Verified documentation.** Following the READMEs and documents step by step, and checking that the resulting code compiles and works.
- **Zero-warning baseline, enforced by `lint-staged`.** Fix the known ESLint warnings (see [Tooling](tooling.md#eslint)) and keep the count at zero by linting staged files with `eslint --max-warnings 0` in a pre-commit hook. The same hook can run `pnpm docs:check` when Markdown files are staged.
- **Commit message checks with `commitlint`.** Enforce the commit message conventions (see [Tooling](tooling.md#git)) in a `commit-msg` hook.
- **Generated configuration documentation.** Generate the configuration tables in the READMEs (such as the one in [`@app/utils`](../packages/utils/README.md#configuration)) from the Zod schemas defining the configuration, with [`@jackdbd/zod-to-doc`](https://www.npmjs.com/package/@jackdbd/zod-to-doc).
- **Configuration structure.** Decide between a single configuration object for the whole application (as now, in `@app/utils`) and per-package configurations, where each package defines and validates its own configuration and `@app/utils` only provides the scaffolding for creating them. Both have benefits and drawbacks, so the decision needs deeper consideration.
- **Minified responses.** Minifying the rendered pages, including the stylesheets inlined into them, could make them smaller. It needs prototyping and benchmarking first: responses already pass through the `compress()` middleware (`packages/api/src/index.ts`), so minifying them as well may save little, and its overhead on every request could make pages load slower in the end.
- **A fork of PrimeReact 10.** Keeping PrimeReact 10, the last open-source version, alive under a new name, with the patch rendering the component styles on the server as its foundation. Worth it if PrimeReact 10 stops being maintained, or the patch grows too large; its [limits](primereact.md#limits) are the starting points.
- **A theme generator.** A PrimeReact theme generated from Lara at build time, with its hardcoded colors replaced by variables: any accent color, or a few presets, and a dark mode switched at runtime (see [Styling](styling.md#theme)). The accent colors of the precompiled Lara themes differ in 30 values, each mapping to exactly one value of another accent, so they can become variables mechanically. The dark themes differ in about 1,570 declarations without such a mapping, so the dark mode needs its own declarations, applied by a selector or a media query. The result is verifiable: filling the variables in must reproduce Lara's files. The generator could become a library of its own.
- **Linting of the UI package.** A better linting setup for `@app/ui`, for example a Tailwind plugin for ESLint (unknown and conflicting classes), `eslint-plugin-compat` (browser APIs, checked against the browserslist targets) and Stylelint for stylesheets. Work on the ESLint configuration has started as a local work in progress (a WebStorm shelf, `.idea/shelf/eslint/shelved.patch`, outside version control).
- **Polyfills.** Once the code needs JavaScript APIs the targeted browsers lack, it needs polyfills. `@vitejs/plugin-legacy` injects them through `index.html`, so server-rendered pages would have to get them through the client manifest (see [Styling](styling.md#browser-support)).
- **Smaller fonts.** Lara ships Inter as variable fonts of 345 kB (regular) and 381 kB (italic, loaded only when used). Subsetting them, or using system fonts, would make the first page load faster.
- **Views in the OpenAPI document.** HTML responses aren't described in the OpenAPI document yet (`Controller.endpoint()` adds an empty `text/html` content entry for routes with views). The idea is for `view()` to accept metadata, such as a description of the view, which `Controller.endpoint()` would pass into the OpenAPI document.

## Known limitations

### Rendering

- One view per response, rendered synchronously with `renderToString`: no streaming, no async components.
- The view is chosen by the status passed to `ctx.render()`; a status set only by `ctx.status()` isn't taken into account.
- When a route has no view, or none for the status, the middleware responds with JSON without any warning (see the `TODO`s in `libs/maveric-server/src/rendering.ts`).
- During development, the stylesheets of dynamically imported modules are rendered into the page too, because the module graph doesn't distinguish static and dynamic imports (not tested yet).
- Regenerating the client manifest when a view file is added or removed is implemented, but hasn't been exercised yet.
- Browser extensions that add attributes to `<html>` or `<body>` cause hydration warnings in development; this is by design (see [Server-side rendering and hydration](rendering.md#hydration-consistency)).

### Build and deployment

- Static files are served before the API's middleware: no compression, no security headers, and no long-lived cache headers for hashed assets.
- The server's source map maps code of other packages to their build outputs, not their sources.
- The server bundle contains React's development build and the root `package.json`.
- The constants of `@maveric/client` end up in a tiny shared chunk of the browser bundle, named after its directory (`dist-[hash].js`), which costs an extra (preloaded) request.
- Copying the browser bundle into the server's output is an inline plugin in `apps/server/vite.config.ts`; with a second deployment target, it could move into `@maveric/vite`.

### Development

- The dev server loads `@maveric/vite` from its build, so changes to the plugin require a restart. Node.js's type stripping could load it from source in the future.
- The editor sees the ambient types of all environments (see [TypeScript configuration](typescript.md#ambient-types-are-declared-at-the-root)).
- TypeScript 6 is kept next to TypeScript 7 until typescript-eslint supports the native compiler.
- Adopting the stylesheets rendered into a page, Vite's client rewrites their content, so the fonts they reference are requested again; in Chrome 154 and later, `font-display: optional` fonts may stay in the fallback font ([Vite issue #23696](https://github.com/vitejs/vite/issues/23696)). The fix was merged after Vite 8.3.3; update Vite once it's released.

### Styling

- The theme's mode and accent color are chosen at build time, from Lara's two modes and eight accent colors (see [Styling](styling.md#theme)).
- The theme is part of the application's stylesheet, so any change of the application's styles invalidates its cache too (about 180 kB minified).
- Browser support was checked for the stylesheet as of October 2026; features without fallbacks, such as transparent theme colors (`bg-primary/50`), would need another check (see [Styling](styling.md#limits)).
- During development, Tailwind keeps classes that are no longer used in the stylesheet until the dev server restarts.

### PrimeReact

- Styles that components create per instance (breakpoints, responsive options, DataTable's `stack` layout and column resizing) still appear only after hydration, because they're keyed by ids generated in the browser. Covering them requires matching ids on the server and in the browser, a separate change in each component. The other limits of the patch are described in [PrimeReact](primereact.md#limits).
