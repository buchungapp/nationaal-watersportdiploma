# Jachtzeilen 2601 import

This import creates nine active curricula from the reviewed Jachtzeilen CSV:

| Program | Competencies | Modules | Gear types |
| --- | ---: | ---: | ---: |
| Binnenwater 4 | 78 | 14 | 11 |
| Binnenwater A | 81 | 14 | 11 |
| Binnenwater B | 81 | 14 | 11 |
| Ruim Binnenwater A | 88 | 15 | 11 |
| Ruim Binnenwater B | 88 | 15 | 11 |
| Waddenzee en Zeeuwse Stromen A | 92 | 17 | 11 |
| Waddenzee en Zeeuwse Stromen B | 92 | 17 | 11 |
| Zee A | 91 | 16 | 11 |
| Zee B | 91 | 16 | 11 |

All curricula use revision `2601` and start at `2026-01-01T00:00:00Z`.
The reviewed CSV SHA-256 is
`52a399b2dd2766efe251cb841e373eb083daa1ff1c0b1d594793b8a1dda064c6`.

## Content rules

- `V` is required and `O` is optional.
- Blank V/O values are optional.
- `Windoriëntatie` is an explicit exception and is required in all nine
  curricula despite its blank V/O cell.
- `O/V` is required for Binnenwater and Ruim Binnenwater and optional for
  Waddenzee en Zeeuwse Stromen and Zee.
- Empty requirement cells omit the competency; empty modules are omitted.
- The combined lagerwal row is linked to both existing aankomen and afvaren
  competencies.
- Existing modules, competencies, and the exact 11 gear types from the
  corresponding `2501` curricula are reused.
- RR&P is created as `reisvoorbereiding-routering-en-planning`, titled
  `Reisvoorbereiding, Routering en Planning (RR&P)`, directly after
  `Reglementen`.
- The two approved shared competency-title corrections are compare-and-set.
- Requirement normalization is allowlist-only. Changed source links are stored
  in the import manifest with complete before/after text; unchanged links are
  represented by a count and hash.

## Production-like local verification

Export the sanitized catalog snapshot through the read-only production service:

```sh
pnpm --filter @nawadi/scripts jachtzeilen:catalog-snapshot -- \
  export \
  --service=nawadi_prod_ro \
  --file=.jachtzeilen-catalog-snapshot.json
```

Load it into an isolated local PostgreSQL database:

```sh
pnpm --filter @nawadi/scripts jachtzeilen:catalog-snapshot -- \
  load \
  --file=.jachtzeilen-catalog-snapshot.json \
  --pg-uri=postgresql://postgres:postgres@127.0.0.1:54322/nawadi_jachtzeilen_import_test \
  --execute
```

Run the full lifecycle test:

```sh
pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- \
  verify-local \
  --file=/absolute/path/to/jachtzeilen.csv \
  --pg-uri=postgresql://postgres:postgres@127.0.0.1:54322/nawadi_jachtzeilen_import_test \
  --execute
```

This verifies the initial import, exact counts and activation date, an
idempotent rerun, fail-closed behavior, manifest generation, rollback, and
re-import. It writes an attestation containing the tested catalog hash.

## Production execution

First run a read-only plan against the intended database. Production execution
requires the exact catalog hash from the local attestation:

```sh
pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- \
  import \
  --file=/absolute/path/to/jachtzeilen.csv \
  --pg-uri="$PGURI" \
  --expected-catalog-hash=SHA256_FROM_LOCAL_ATTESTATION \
  --execute
```

The import runs in one serializable transaction and fails closed on unexpected
programs, curricula, links, requirements, requiredness, titles, source hash, or
catalog hash.

Rollback is allowed for active imported curricula only while no students or
certificates are linked:

```sh
pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- \
  rollback \
  --manifest=/absolute/path/to/import-manifest.json \
  --pg-uri="$PGURI" \
  --execute
```
