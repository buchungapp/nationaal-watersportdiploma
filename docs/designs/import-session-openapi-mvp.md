# Import Session OpenAPI MVP

## Status

Accepted for the N0/N1 integration MVP.

## Context

Buchung needs a contract for handing full cohort snapshots to Nationaal
Watersportdiploma/Nawadi. The legacy public API server has been removed; the
MVP import-session contract now lives as a narrow OpenAPI artifact in
`apps/docs/api/import-session.openapi.yaml` and is served by an Effect HTTP
router/web handler mounted through thin Next route adapters in
`apps/web/src/app/api`.

The import-session workflow is a durable vendor snapshot workflow. Receiving a
snapshot must preserve source rows and validation state for later preview and
commit steps. It must not directly create persons, actors, or cohort
allocations.

Incomplete rows still belong in review. Missing first name, last name, date of
birth, birth city, or birth country should become row-level validation messages,
with blocking problems represented as `severity: error`, instead of rejecting
the whole snapshot. `firstName` and `lastName` remain required for later
materialization/commit, but not for ingestion.

## Decision

Build the N0/N1 contract on the post-478 web API surface:

- `PUT /api/location/{location-key}/cohort/{cohort-key}/import-session/{external-session-key}`
  creates or replaces a full vendor snapshot idempotently.
- `GET /api/location/{location-key}/import-session/{external-session-key}`
  retrieves import-session status by vendor key within a location.
- `GET /api/location/{location-key}/cohort/{cohort-key}/import-session`
  lists cohort import sessions for workflow visibility.

The contract includes workflow-oriented scope metadata through
`x-required-scopes` because the current generator models bearer/api-key
authentication but not OAuth scopes. Runtime enforcement should bind the vendor
and location before import-session behavior is implemented.

The external session key is stable within a location/source/cohort identity, but
can have multiple immutable generations after terminal commit/cancel events.
`GET` is location-scoped for this reason, while `PUT` and list endpoints include
a cohort key to bind the snapshot to the intended cohort workflow.

`PUT` semantics are:

- reusing the same external session key while the session is `received` or
  `reviewing` is an idempotent full replacement of the stored snapshot;
- reusing the same key after the latest generation is `committed` or
  `cancelled` creates a new import-session generation and leaves the terminal
  generation immutable;
- accepting a newer external session key for the same cohort supersedes older
  open sessions.

Public models intentionally do not expose internal import-session ids or
generation numbers in the MVP. List responses include every generation as a
separate session row. Retrieve-by-external-key returns the latest generation
when all matching generations belong to a single cohort; if the key is reused
across multiple cohorts in the same location/source, the API treats it as
ambiguous/conflicting.

An empty `rows` array is valid because a full snapshot can state that the cohort
currently has no registrations.

## Consequences

Handlers stay thin around durable core semantics and use Effect HTTP as the
runtime foundation: `import_session`, `import_session_row`,
`import_session_preview`, and
`import_session_row_commit`, with public statuses `received`, `reviewing`,
`committed`, `superseded`, and `cancelled`. Data-quality validation is modeled
on rows, not as a terminal session status.

The MVP keeps the hand-authored OpenAPI document as the hey-api contract input.
Generating that contract from Effect HttpApi remains a follow-up migration once
contract tests can prove parity with this OpenAPI surface.
