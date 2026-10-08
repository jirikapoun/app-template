# Tooling

## Scripts

| Script | What it does |
|---|---|
| `pnpm dev` | builds `@maveric/vite`, then starts the dev server at `http://localhost:5173` |
| `pnpm build` | builds all packages for production (`turbo build`) |
| `pnpm start` | starts the production server at `http://localhost:3000` |
| `pnpm lint` | runs ESLint on the whole project |
| `pnpm typecheck` | type-checks the whole project as one program (TypeScript 6) |

Every package has its own `build` script, which Turborepo runs; see [Workspace packages](workspace-packages.md#package-conventions).

## ESLint

The configuration is in `eslint.config.mjs` (flat config). It combines the shared configurations of `@strv/eslint-config-node` and `@strv/eslint-config-typescript` with additional plugins (`eslint-plugin-import-x`, `eslint-plugin-consistent-default-export-name`, `eslint-plugin-modules-newline`) and local rules from `eslint-local-rules.cjs`.

- **Typed linting.** TypeScript files are linted with type information through typescript-eslint's project service, which finds the root `tsconfig.json`. Files outside its `include` patterns can't be linted with types (see [TypeScript configuration](typescript.md#tsconfigjson--the-development-context)).
- **TypeScript 6.** typescript-eslint uses the JavaScript API of the TypeScript compiler, which the native TypeScript 7 doesn't have. That's why the root package's `typescript` dependency is TypeScript 6 (see [TypeScript configuration](typescript.md#typescript-versions)).
- **Patched dependencies.** Some of the shared configurations and plugins are patched to work with the current versions of ESLint and its plugins; the patches are in `patches/`, registered in `pnpm-workspace.yaml`.
- **Unused disable comments** are reported (`reportUnusedDisableDirectives`), so an `eslint-disable` comment must stay justified.
- **Import order.** Two rules check the order of imports (`import/order` and `import-x/order`); where they seem to disagree about workspace packages, follow their messages. Imports without bindings (`import './production.js'`) are never reordered.
- **Warnings.** The target is zero warnings, to be enforced by git hooks (see [Roadmap](roadmap.md#planned)). Until then, the project has 12 known warnings, most of them `TODO` comments and `console` calls in code that will change; keep this number up to date, and fix new warnings rather than adding to the list.

## Formatting and line endings

- **`.editorconfig`**: UTF-8, LF line endings, 2-space indentation, a final newline and no trailing whitespace, except in Markdown and patch files, where trailing whitespace is significant.
- **`.gitattributes`** (`* text=auto eol=lf`): files have LF line endings in the repository and in working copies, regardless of the local `core.autocrlf` setting. ESLint enforces LF line endings too.

## Editor

- **WebStorm** is set to its bundled TypeScript-Go 7 language service, which uses the root `tsconfig.json`. Thanks to the `source` condition, navigating to a workspace import opens its source file.
- **Diagnostics of the TypeScript-Go service aren't part of WebStorm's inspection results.** Tools that read those results (for example, assistants connected through the IDE's MCP server) don't see TypeScript errors. Use `pnpm typecheck` to check the project.

## Git

- **Commit messages** are a short, lowercase summary in the imperative mood, for example *enable Fast Refresh, refresh view props on server-side changes*.
- **One logical change per commit.** Refactoring and fixes found along the way get their own commits.
