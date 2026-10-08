# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A full-stack TypeScript application template built on Maveric, an MVC-inspired framework developed in `libs/` of the same repository. Routes define a Zod schema, a handler and optionally a React view; the same URL answers JSON or a server-rendered page hydrated in the browser. Stack: Hono + `@hono/zod-openapi`, React 19, Vite 8 (Rolldown, Oxc), TypeScript 7 (+6 for ESLint), pnpm workspaces, Turborepo, Node.js 26, Windows development machine.

The documentation is extensive; read the relevant file before changing an area:

- [docs/architecture.md](docs/architecture.md) — packages, request lifecycle, development vs. production contexts, key decisions
- [docs/typescript.md](docs/typescript.md) — tsconfig layout, ambient types, TypeScript 6/7
- [docs/workspace-packages.md](docs/workspace-packages.md) — package conventions, the `source` export condition, adding a package
- [docs/vite.md](docs/vite.md) — dev server, per-package production builds
- [docs/rendering.md](docs/rendering.md) — views, rendering middleware, client manifest, runtime
- [docs/hot-reload.md](docs/hot-reload.md) — Fast Refresh, props refresh
- [docs/deployment.md](docs/deployment.md), [docs/tooling.md](docs/tooling.md), [docs/roadmap.md](docs/roadmap.md), [docs/documentation.md](docs/documentation.md)

## Commands

```sh
pnpm dev                 # builds @maveric/vite, then the dev server at http://localhost:5173
pnpm build               # turbo build: every package, in dependency order (add --force to bypass the cache)
pnpm start               # production server at http://localhost:3000 (from apps/server/dist)
pnpm lint                # ESLint, whole project
pnpm typecheck           # whole project as one program, TypeScript 6
pnpm docs:check          # relative links and anchors in all Markdown files
pnpm --filter <package> build                          # one package
pnpm --filter @app/ui exec tsc -p ../../tsconfig.json  # whole project, TypeScript 7
```

There are no tests yet. Useful URLs in dev: `/status` (page, or JSON with `Accept: application/json`), `/docs` (Swagger UI).

## Architecture essentials

- `libs/` = framework (`@maveric/client`, `@maveric/server`, `@maveric/vite`, app-agnostic); `packages/` = app layers (`@app/schema`, `@app/utils`, `@app/ui`, `@app/api`); `apps/` = deployable entry points (`@app/server`).
- **Two contexts.** Development: one TypeScript program (root `tsconfig.json`) and one dev server (root `vite.config.ts`), workspace packages resolved to sources through the `source` export condition. Production: every package builds itself (`tsc`, or Vite for `@app/ui` and `@app/server`) from its sources and its dependencies' `dist`. Cross-package imports only through `exports`.
- **Rendering:** controller → `ctx.render(data, status)` → rendering middleware → JSON, or the route's view rendered as the whole document + injected payload/runtime → browser hydrates `document`. The client manifest (`virtual:maveric/manifest`, re-exported as `@app/ui/manifest`) maps view components to client files.
- **Hot reloading:** browser modules → Fast Refresh; server-only modules → props refresh in tabs with a hydrated view (full reload elsewhere), implemented in `@maveric/vite` and the runtime.

## Rules that are easy to break

- **No package-level `tsconfig.json`**, no TypeScript `paths`. Package settings go into `<package>/tsconfig.build.json` (extends `../../tsconfig.build.json`, uses `${configDir}`); development settings into the root `tsconfig.json`.
- **Every export has `source` (first) and `import` conditions**, and every imported workspace package is a declared dependency.
- **Build scripts clean `dist` first** (`rimraf dist && …`); `rimraf` and other shared tools come from the root package.
- **The root Vite config is development-only**; `vite build` at the root fails on purpose. Never set `ssr.noExternal` in the dev server.
- **`@maveric/vite` is loaded from its build** when Vite reads its config: after changing it, rebuild it (or restart `pnpm dev`).
- **Views:** component as the first argument of `view()`, the only export, `export default <Name>`; browser-safe imports; deterministic first render; render the whole document via `App`.
- **`ctx.render()` requires the status**; the view is chosen by it.
- **`@hono/vite-dev-server` intercepts URLs** not matching its `exclude` patterns; source URLs must stay excluded.
- **TypeScript 6 crashes** on path mappings with several extension-specific fallbacks.

## Code conventions

- ES modules, `module: NodeNext`: relative imports end with `.js` (also for `.ts`/`.tsx` sources); type-only imports use `import type` (`verbatimModuleSyntax`).
- Comments are sparse, lowercase, and explain why. Match the surrounding code.
- Lint expectations: no `console` (scripts write to `process.stdout`/`process.stderr`), regexes with the `u` flag and named capture groups, two blank lines after imports, default exports named after the file (`libs/` use named exports), import groups as `import/order` and `import-x/order` demand (follow their messages; side-effect imports such as `import './production.js'` stay first).
- The known ESLint warnings are counted in [docs/tooling.md](docs/tooling.md#eslint); don't add new ones, and update the count there when it changes.
- Edit `package.json` files with a Node script (`JSON.parse`/`JSON.stringify(…, null, 2)`) or the edit tools, never with text replacement in PowerShell.

## Collaboration workflow

The user values this process; follow it.

1. **Intent.** The user describes the goal in detail.
2. **Investigation.** Reproduce problems, read the actual sources of libraries, verify claims with small experiments, prototype when useful. Prototypes run in the working tree and are always reverted; keep a patch in `%TEMP%` (`git diff --cached --binary --output=<file>`).
3. **Discussion.** Present findings with evidence, options with a recommendation, and **numbered decisions** the user can answer briefly. Technical defaults are mine to propose; architecture and product preferences are the user's. Then agree on a step-by-step plan.
4. **Implementation, one step at a time.** Implement → verify (see below) → report (what changed, verification, things worth knowing, open questions) → **pause for the user's review** → commit. Don't start the next step before the user agrees.
5. **Wrap-up.** Documentation update as the last step of the plan (see below), final summary, follow-ups into `docs/roadmap.md`.

Also:

- **Commits:** one per step; a short, lowercase summary in the imperative mood (*enable Fast Refresh, refresh view props on server-side changes*). Refactors and fixes found along the way get their own commits. The user sometimes commits adjustments themselves: build on them, and squash only when asked, keeping their message (`git commit -C <commit>`).
- **Honesty:** correct earlier claims explicitly when they turn out wrong; mark untested things as untested; report failures with their output.
- **Ideas the user mentions in passing** go into `docs/roadmap.md`.
- **Confirm first:** deleting user files, installing global tools, anything leaving the repository.
- **Give short progress updates** during long stretches of work.

## Documentation maintenance

Follow [docs/documentation.md](docs/documentation.md). In short: when a change is finished (multi-commit change: as its last step; single commit: in the same commit), search `docs/` and all READMEs for everything removed, changed or added; remove or align what's affected; extend existing topics for new functionality, but **agree with the user before creating a new topic or restructuring**; check the roadmap, the README tables and drifting counts; run `pnpm docs:check`.

**This file is part of the check.** Nothing updates it automatically (`/init` only when run explicitly), and its details drift easily: the commands, the rules that are easy to break, the verification procedure and the environment pitfalls. Keep facts documented elsewhere as links rather than copies, so that `pnpm docs:check` notices when they move.

## Verifying changes

For a step touching code, as applicable:

1. `pnpm typecheck` (and the TypeScript 7 variant), `pnpm lint` (no new warnings).
2. `pnpm exec turbo build --force` for a clean build.
3. Dev mode in a real browser: hydration, Fast Refresh, props refresh (procedure below).
4. Production: copy `apps/server/dist` outside the repository, run it there (`$env:PORT = '3199'`), check it in the browser.
5. Clean up: stop background tasks and leftover processes, delete temporary files, verify `git status` shows only intended changes.

**Browser checks** use the `chrome-devtools` CLI (installed globally, Google Chrome available):

```sh
chrome-devtools start --isolated --no-usage-statistics --no-performance-crux
chrome-devtools new_page "http://localhost:5173/status"
chrome-devtools list_pages                                   # page ids
chrome-devtools evaluate_script "() => …" --pageId <id>
chrome-devtools list_console_messages <id>                   # required arguments are positional
chrome-devtools list_network_requests <id>
chrome-devtools navigate_page <id> --url "…"
chrome-devtools stop
```

- Hydrated: `Object.keys(document).some(key => key.startsWith('__reactContainer'))`.
- No reload: set `window.__marker = true` before a change, check it afterwards.
- Fast Refresh: edit a view's text (read the bytes first, restore them byte for byte afterwards); text changes, marker and counter survive.
- Props refresh: rewrite [the status controller](packages/api/src/controller/status.controller.ts) with identical bytes; the uptime resets to a few seconds without a reload.
- The user may have the page open in their own browser with the Dark Reader extension: hydration warnings about `data-darkreader-*` in the dev server log come from that tab.

## Environment pitfalls (Windows, PowerShell 5.1)

- **Leftover Vite processes:** stopping a background `pnpm dev` can leave Vite running on port 5173, so the next server starts on 5174. After stopping, kill `node` processes whose command line matches `*app-template*vite.js*` and check `Get-NetTCPConnection -LocalPort 5173`.
- **No `&&` in PowerShell 5.1:** use `;` or `if ($?) { … }`. In `package.json` scripts, `&&` works (they run in `cmd`).
- **`Invoke-WebRequest` ignores a custom `Accept` header:** use `node --input-type=module -e "…fetch(…)…"`.
- **`Out-File` and `Set-Content` write a BOM and CRLF:** use the Write tool, `[IO.File]::WriteAllText` with UTF-8 without BOM, or `git diff --output=…` for patches.
- **`Remove-Item` with wildcards** in paths can be blocked by the sandbox: resolve each path and use `-LiteralPath`.
- **pnpm writes the command echo to stderr,** which PowerShell shows as `NativeCommandError` even on success: check `$LASTEXITCODE`. `Select-Object -First` on a node pipeline can produce exit code 255 (closed pipe), which is harmless.
- **Nested arrays unroll** in PowerShell (`@(@('a', 'b'))` is a flat array); prefer Node scripts for structured edits.

## Tooling notes

- The root `typescript` is TypeScript 6 (binary `tsc6`), required by typescript-eslint; packages use TypeScript 7 (`tsc`).
- The WebStorm MCP tools don't report TypeScript errors: WebStorm uses its bundled TypeScript-Go service, whose diagnostics aren't part of the inspection results. Use `pnpm typecheck`; `get_symbol_info` does work for checking where a symbol resolves.
- Diagrams in documentation are Mermaid with `-->|label|` edge labels; emojis only sparingly, in the Maveric project README.
