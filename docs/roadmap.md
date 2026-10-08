# Roadmap and known limitations

## Planned

- **API client.** A typed client generated from the route definitions and schemas, usable from views.
- **Polling the server status.** `StatusView` should periodically fetch the uptime from the server, to show whether the server is still up. It already follows new props (see [Hot reloading](hot-reload.md#effects-and-fast-refresh)); it needs the API client.
- **Dynamic navigation.** Navigation in the layout, rendered in every view. Since every page URL also serves its data as JSON, client-side navigation can fetch the props of the next page and render its view without a full page load.
- **Cloudflare Workers.** A second deployment target next to the Node.js server; see [Deployment](deployment.md#cloudflare-workers-future).
- **Standalone Maveric.** Moving `libs/` into its own repository, with an overarching `maveric` package bundling the framework packages for simpler projects. Its documentation is prepared in [`libs/maveric/README.md`](../libs/maveric/README.md).
- **Verified documentation.** Following the READMEs and documents step by step, and checking that the resulting code compiles and works.
- **Zero-warning baseline, enforced by git hooks.** Fix the known ESLint warnings (see [Tooling](tooling.md#eslint)) and keep the count at zero with `eslint --max-warnings 0` in a pre-commit hook, together with `commitlint` checking the commit messages in a `commit-msg` hook.

## Known limitations

### Rendering

- One view per response, rendered synchronously with `renderToString`: no streaming, no async components.
- The view is chosen by the status passed to `ctx.render()`; a status set only by `ctx.status()` isn't taken into account.
- When a route has no view, or none for the status, the middleware responds with JSON without any warning (see the `TODO`s in `libs/maveric-server/src/rendering.ts`).
- Stylesheets imported by views are part of the client manifest in production, but this hasn't been exercised yet. During development, Vite applies them only once the JavaScript runs.
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
