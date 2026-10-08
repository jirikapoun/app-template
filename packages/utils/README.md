# @app/utils

Server-side utilities shared by the application packages. Currently, it provides the application configuration.

## Contents

```
src/
└── config.ts    configuration read from environment variables
```

## Public interface

| Export | Source |
|---|---|
| `@app/utils/<module>` | `src/<module>.ts` |

## Configuration

`@app/utils/config` validates `process.env` with a Zod schema when it's first imported, and exports the resulting configuration:

| Property | Variable | Default | Description |
|---|---|---|---|
| `nodeEnv` | `NODE_ENV` | `development` | `development`, `production` or `test` |
| `port` | `PORT` | `3000` | HTTP port the server listens on |
| `appName` | `APP_NAME` | root package `name` | application name |
| `appVersion` | — | root package `version` | application version |
| `apiDocs` | `API_DOCS` | `true` | serves the OpenAPI document and Swagger UI |

This table is maintained by hand for now; it should later be generated from the schema (see [Roadmap](../../docs/roadmap.md#planned)), and the structure of the configuration is still open to change.

- `NODE_ENV` defaults to `development` when unset, which suits the dev server. The production server sets it to `production` before this module is loaded (see [Deployment](../../docs/deployment.md#node_env)).
- Boolean variables accept `true`, `false`, `1`, `0`, or an empty value (the default).
- The application name and version come from the root `package.json`, which the module imports as JSON; the production server bundle therefore contains it.

## Notes

- The package uses Node.js APIs (`process.env`), so it must only be imported by server-side code, never by views.

## Build

`rimraf dist && tsc -p tsconfig.build.json` compiles `src/` into `dist/`, with type declarations. The build configuration declares the `node` ambient types.
