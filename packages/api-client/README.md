# @nawadi/api-client

TypeScript client for the Nationaal Watersportdiploma vendor API.

The package is generated from `apps/docs/api/import-session.openapi.yaml` with
`@hey-api/openapi-ts`. It intentionally contains only the public Nawadi API
contract and small transport conveniences such as base URL, API key, request ID,
and custom `fetch` injection.

Vendor-specific mapping, retry policy, sync state, and operator workflows belong
in the integrating system.

## Publishing checklist

- Confirm the `@nawadi` npm scope is owned by the Nationaal Watersportdiploma
  maintainers.
- Decide the public client license before the first publish. The package
  currently inherits the repository license.
- Run `pnpm --filter @nawadi/api-client build` before publishing. The npm
  artifact contains `dist/`; build output is not committed.
