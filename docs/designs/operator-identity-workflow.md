# Operator Identity Workflow

Status: DRAFT (post `/plan-eng-review` + outside-voice)
Owner: Maurits (Buchung)
Date: 2026-04-29
Related: PR #461 (merge-engine foundation)

## Problem

Operators (location admins) routinely create duplicate person records during the bulk
CSV import for a new cohort. The canonical failure: Adam trained in 2025, has 4
certificates. Operator imports the 2026 cohort CSV. Adam's row differs from his
existing record by one character (date format, missing `lastNamePrefix`, email
present this year vs absent last year). `Person.getOrCreate` falls back to its
exact-match criteria, fails to match, and inserts a fresh Person row. Adam's 2025
certificates stay orphaned on the old Person. The operator never sees that any of
this happened.

Today the only repair path is "email Buchung." Buchung becomes the bottleneck. The
duplicate-merge engine (PR #461) is the foundation, but it's gated to system admins
only and lives off-platform from the operator workflow.

## Goal

Give operators a safe identity workflow inside their location, so they can:

1. **Prevent** new duplicates at the moment they're created (CSV bulk import + the
   operator's other create surfaces).
2. **Repair** existing duplicates without escalating to a sysadmin.

## Non-goals

- Cross-location merging by operators. Per GDPR, operators see only persons with an
  active `personLocationLink` to their location. Cross-location identity remains a
  data-subject-initiated flow (the person emails NWD, sysadmin merges under controller
  authority).
- Auto-merging at any score threshold. Every link decision is an explicit operator
  click.
- Fixing typos in existing person data via the import flow. Operators edit existing
  persons directly. On "use existing", **existing data wins, no overwrites.**
- Self-registration dedup (parent/student account creation). Different governance.
  Out of scope for v1.
- **`pg_trgm` adoption** is deferred to a follow-up PR (see TODOS.md). Trigram
  similarity threshold tuning against real Dutch-name data (Jan, Piet, Bas all
  share trigrams) is a precondition we don't want to block this PR on. v1 keeps
  the existing `LEFT(x, 3)` prefix-match scoring from PR #461's detection script.

## Authorization & GDPR boundary

```
  Match query is gated to:
    person_location_link.location_id = $operator_location
    AND person_location_link.status = 'linked'
    AND person.deleted_at IS NULL
```

A person with a `revoked` or `removed` link to the operator's location is
**invisible** to the match. The UI must not hint that a hidden match exists.
The escape valve: the data subject themselves contacts NWD; sysadmin merges under
controller authority via the existing `/secretariaat/gebruikers` flow.

**GDPR boundary check is server-side and tested.** When `commitBulkImportAction`
processes a `use_existing:personId` decision, it MUST re-verify the personId
belongs to the linked-active set for the operator's location. Operators don't get
to address persons they can't see, even via crafted payloads.

### Revoked-link policy (P1-E)

`Person.linkToLocation(personId, locationId)` THROWS when the existing link's
status is `revoked`. The revoke was an active operator decision (or a
data-subject withdrawal of consent); silently flipping it back during a CSV
paste would be a GDPR consent regression. If a `create_new` row hits exact-match
on a person whose link to this location is revoked, the commit aborts with a
specific error: "Deze persoon was eerder verwijderd. Neem contact op met NWD om
opnieuw toe te voegen." Operator must escalate, sysadmin handles re-link with
proper consent record.

`removed` (operator removed the link) is treated identically — re-linking
requires sysadmin involvement.

### Inline-hint exfiltration mitigation (P0-B)

The single-create dedup hint runs on every name+DOB keystroke. To prevent
threshold-probing attacks (operator types many DOB combinations to discover
person identities they didn't onboard), the inline-hint endpoint is rate-limited
to **10 calls per operator per minute**, per Vercel rate-limit middleware.

**Accepted residual risk:** an authorized operator can already see all
linked-active persons in their location via `/locatie/[id]/personen` —
showing match candidates as they type doesn't reveal data they can't already
page through. The threshold-probe attack is real but cosmetically improves a
small marginal disclosure. Document it; don't over-engineer.

## Architecture

### What we reuse from PR #461

- `packages/scripts/src/utils/duplicate-person-detection.ts` — the SQL becomes a
  consumer of newly-extracted scoring expressions. Scripts continue to work; they
  call the same scoring fragments. Pair-finder and candidate-scorer share
  thresholds, weights, and reason strings (NOT query shape — see below).
- `packages/core/src/models/user/person.ts` `mergePersons` — already handles the
  hard cases (overlapping `student_curriculum`, cohort allocation collisions,
  `student_completed_competency` conflicts). Operator-facing merge calls the same
  command.
- `apps/web/.../secretariaat/gebruikers/_components/merge-persons-dialog.tsx` —
  ~692 lines of merge dialog. Lift to a shared component, parameterize the auth
  check (sysadmin vs operator-of-location), keep the UX.
- **`createPersonForLocation` in `lib/nwd.ts`** — kept unchanged. The
  `commit_bulk_import.create_new` branch calls it as-is. No decomposition,
  no regression risk for existing callers (single-create dialog, programmatic
  flows). See "What we deliberately don't refactor" below.

### What's new

#### 1. Reusable scoring fragments (Drizzle composition)

```
  packages/core/src/models/user/_internal/duplicate-scoring.ts

    scoreFirstName(a: SQL, b: SQL): SQL<number>
    scoreLastName(a: SQL, b: SQL): SQL<number>
    scoreBirthDate(a: SQL, b: SQL): SQL<number>
    scoreBirthCity(a: SQL, b: SQL): SQL<number>
    sameUserBoost(userIdA: SQL, userIdB: SQL): SQL<number>
    totalScore({...inputs}): SQL<number>
    matchReasons({...inputs}): SQL<string[]>

    SCORE_THRESHOLDS = { weak: 100, strong: 150, perfect: 200 }  // exported
```

**Honest scope (P1-G):** what's actually shared between pair-finder and
candidate-scorer is the scoring math, threshold constants, and reason-string
formatting. **Query shapes differ:** pair-finder is an N×N self-join with
`p1.id < p2.id`; candidate-scorer is M (pasted) × N (existing). Both call
`totalScore(...)` with their respective column references. Both pre-normalize
columns in CTEs (using the existing `LOWER(REGEXP_REPLACE(...))` strategy).

Drizzle 0.45.1 patterns used: `sql` template tag, `sql.join()` for composing
reason arrays, `db.$with()` for CTEs without a session, selection mixing
`{ score: sql<number>\`${totalScore(...)}\` }` alongside columns.

#### 2. Server-side: scoped duplicate detection

```
  packages/core/src/models/user/person.ts

    findCandidateMatchesInLocation({
      locationId: string,
      candidates: Array<{
        rowIndex: number,
        firstName, lastName, lastNamePrefix, dateOfBirth, birthCity, email
      }>,
      targetCohortId?: string,
    }): Promise<{
      matchesByRow: Map<rowIndex, CandidateMatch[]>,
      crossRowGroups: CrossRowGroup[],   // see §"N-way conflicts"
    }>

    type CandidateMatch = {
      personId: string,
      score: number,
      reasons: string[],
      // display fields (computed in same SQL via LEFT JOIN aggregates, no N+1)
      firstName, lastName, lastNamePrefix, dateOfBirth, birthCity,
      certificateCount: number,
      lastCohortLabel: string | null,
      lastDiplomaIssuedAt: string | null,
      isAlreadyInTargetCohort: boolean,
    }

    type CrossRowGroup = {
      rowIndices: number[],   // 2 or more rows in one connected component
      sharedCandidatePersonIds: string[],   // empty for paste-only groups
    }
```

Scoping joined on `personLocationLink.status='linked'` for the operator's
location. Aggregates (cert count, last cohort label, last diploma date) computed
in the same query via `LEFT JOIN` over `certificate` and `cohort_allocation` —
one round trip, no N+1.

**Cross-row group detection runs server-side** as part of
`findCandidateMatchesInLocation` and uses TWO edge sources:

1. **Existing-match edges:** rows that strong-match (≥150) the same existing
   person in the operator's location are connected.
2. **Paste-vs-paste edges:** rows that strong-match each other (regardless of
   any existing match) are connected. This catches the case where a brand-new
   Adam was pasted three times — without paste-vs-paste detection each row
   would default to "create new" and produce three duplicate Person records.
   Exactly the bug this whole flow is supposed to prevent.

The two edge sets are merged via union-find: rows form one connected group if
they share *any* strong-match path, existing or paste-only. Empty
`sharedCandidatePersonIds` signals a paste-only group — the UI defaults to
"create one new person, link all rows to it."

#### 3. New person primitives (additions, not refactors — P0-C)

We add small primitives in `packages/core/src/models/user/person.ts` for the
**use_existing** path only. The existing `createPersonForLocation` is unchanged.

```
  Person.linkToLocation(personId, locationId)
    - Verifies personId is in operator's GDPR scope (active or no existing link)
    - If no existing link: insert with status='linked'
    - If linked-active: no-op (idempotent for the happy case)
    - If revoked or removed: THROW (P1-E policy)

  Person.ensureActor(personId, locationId, roles)
    - Upsert per existing semantics, scoped to this person+location+role
```

**Why no refactor:** the outside-voice review flagged that decomposing
`createPersonForLocation` into primitives in the same PR as introducing a new
caller is a regression-risk multiplier. The single-create dialog, programmatic
person creation, and any other existing caller continue to use the function
as-is. The `commit_bulk_import` orchestrator calls `createPersonForLocation`
directly for `create_new` rows; for `use_existing` rows it calls the new
primitives. Slight code duplication is the explicit cost we accept for risk
isolation.

#### 4. New server actions

```
  apps/web/src/app/_actions/person/preview-bulk-import-action.ts

    previewBulkImportAction(input: {
      locationId: string,
      targetCohortId?: string,
      csvData, indexToColumnSelection,
    }): Promise<PreviewModel>
    // Side effect: persists a `bulk_import_preview` row (see §5)
    // Otherwise idempotent.

    type PreviewModel = {
      previewToken: string,        // PK of bulk_import_preview row
      rows: Array<{
        rowIndex: number,
        kind: 'parsed' | 'parse_error',
        pasted?: ParsedPersonInput,
        error?: string,
        candidates: CandidateMatch[],
        suggestedDecision: RowDecision,
      }>,
      crossRowGroups: CrossRowGroup[],
      attempt: 1 | 2 | 3,
    }

  apps/web/src/app/_actions/person/commit-bulk-import-action.ts

    commitBulkImportAction(input: {
      previewToken: string,
      decisions: Record<rowIndex, RowDecision>,
    }): Promise<CommitResult>

    type RowDecision =
      | { kind: 'create_new' }
      | { kind: 'use_existing', personId: string }
      | { kind: 'skip', reason: 'cohort_conflict' | 'cross_row_conflict'
                              | 'parse_error' | 'operator' }

    type CommitResult =
      | { kind: 'committed', createdPersonIds: string[], linkedPersonIds: string[] }
      | { kind: 'preview_invalidated', updatedPreview: PreviewModel,
          attempt: 2 | 3 }
      | { kind: 'preview_invalidated_max',
          message: 'Roster veranderde te vaak — plak opnieuw' }
```

`commitBulkImportAction` flow:

```
  1. Load bulk_import_preview row by token. If expired or not found → throw.
  2. Verify operator owns the locationId on the preview row.
  3. Parse decisions. Verify each use_existing personId is in operator's
     linked-active GDPR scope (defense-in-depth — the preview already
     filtered, but reverify).
  4. Open transaction.
  5. Re-run detection (race guard). Compare against the snapshot stored on
     the preview row.
  6. If new matches surfaced:
       attempt < 3 → write attempt+1 to the row, ABORT, return updated preview
       attempt = 3 → ABORT, return preview_invalidated_max
  7. For each row decision:
       create_new   → createPersonForLocation(...)  [unchanged path]
       use_existing → linkToLocation + ensureActor + cohort allocation
                      [throws on revoked, see §"Revoked-link policy"]
       skip         → no-op
  8. Insert ONE audit row per merge/link/create operation (same transaction).
  9. Mark bulk_import_preview row as committed.
 10. Commit.
```

**Audit row write is in the same transaction.** A bug + missing audit =
unfixable mystery — failure mode flagged in eng review.

#### 5. New table: `bulk_import_preview` (P0-A — race-guard storage)

```
  packages/db/src/schema/audit.ts  (same file as personMergeAudit)

  export const bulkImportPreview = pgTable('bulk_import_preview', {
    token: uuid('token').primaryKey().default(sql`extensions.uuid_generate_v4()`),
    locationId: uuid('location_id').notNull(),
    createdByPersonId: uuid('created_by_person_id').notNull(),
    targetCohortId: uuid('target_cohort_id'),
    detectionSnapshot: jsonb('detection_snapshot').notNull(),
    // shape: { rowIndex: { matchPersonIds: string[], topScore: number }[] }
    rowsParsed: jsonb('rows_parsed').notNull(),
    attempt: integer('attempt').notNull().default(1),
    status: pgEnum('bulk_import_preview_status',
      ['active', 'committed', 'invalidated_max'])('status').notNull().default('active'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // expiresAt = createdAt + 1 hour
    committedAt: timestamp('committed_at', { withTimezone: true }),
  })

  // Index for cleanup
  index('bulk_import_preview_expires_at_idx').on(bulkImportPreview.expiresAt)
    .where(sql`status = 'active'`)
```

**Cleanup:** a Vercel cron job (or the existing scheduler if there is one)
runs every 15 minutes and deletes rows where `expiresAt < now()` AND
`status = 'active'`. `committed` rows are kept for audit (cross-reference with
`person_merge_audit.source='bulk_import_preview'`).

**Privacy:** `detectionSnapshot` and `rowsParsed` contain pasted personal data.
Set up a 30-day retention for `committed` rows too (separate cron) — long
enough for forensics, short enough for GDPR data-minimization.

#### 6. Audit table (`personMergeAudit`)

```
  packages/db/src/schema/audit.ts

  export const personMergeAuditDecisionKind = pgEnum(
    'person_merge_audit_decision_kind',
    ['create_new', 'use_existing', 'merge', 'skip']
  )

  export const personMergeAuditSource = pgEnum(
    'person_merge_audit_source',
    ['bulk_import_preview', 'personen_page', 'cohort_view',
     'single_create_dialog', 'sysadmin']
  )

  export const personMergeAudit = pgTable('person_merge_audit', {
    id: uuid('id').primaryKey().default(sql`extensions.uuid_generate_v4()`),
    performedByPersonId: uuid('performed_by_person_id').notNull(),
    locationId: uuid('location_id').notNull(),
    sourcePersonId: uuid('source_person_id'),  // null for create_new + use_existing
    targetPersonId: uuid('target_person_id').notNull(),
    decisionKind: personMergeAuditDecisionKind('decision_kind').notNull(),
    presentedCandidatePersonIds: uuid('presented_candidate_person_ids').array(),
    // P2-J: captures rejected candidates so we can answer
    // "was the operator warned?" six months later
    score: integer('score'),
    reasons: text('reasons').array(),
    source: personMergeAuditSource('source').notNull(),
    bulkImportPreviewToken: uuid('bulk_import_preview_token'),  // FK when source=bulk
    performedAt: timestamp('performed_at', { withTimezone: true }).defaultNow().notNull(),
  })
```

`presentedCandidatePersonIds` and `decisionKind` together answer: was the
operator presented with candidates X, Y, Z and chose `create_new`? Six months
later when X turns out to be a duplicate of the new person, the audit row
proves the operator saw the warning.

#### 7. UI: bulk import preview step (Issue 7 — composition + perf rules)

Component split:

```
  apps/web/.../personen/_components/import-preview/
    BulkImportPreviewProvider.tsx     — provider; owns decisions, derived state,
                                         race-guard token, attempt counter.
    BulkImportPreviewContext.ts       — React 19 Context for the provider value.
    primitives.tsx                    — compound parts: RowFrame, RowPasted,
                                         RowCandidate, RowDecisionRadios,
                                         CanonicalSubmitButton, StatusBadge.
                                         Each consumes context via use().

    rows/                             — explicit variants per row status (5)
      NoMatchRow.tsx                  — score <100, will create new
      SingleMatchRow.tsx              — one candidate. Takes score, renders
                                         per-band copy (weak/strong/perfect)
                                         from a const map. Replaces the prior
                                         3-component split (P2-K).
      MultiMatchRow.tsx               — ≥2 candidates above threshold
      AlreadyInCohortRow.tsx          — match exists, allocation exists
      ParseErrorRow.tsx               — row failed CSV validation

    cross-row-conflicts/              — N-way conflicts (P1-F)
      CrossRowConflictsBanner.tsx     — shown above row list when groups exist
      CrossRowConflictResolver.tsx    — modal listing all rows in the group
                                         + the shared candidate. Operator
                                         picks: "all same person — keep N,
                                         skip others" or "different people —
                                         create new for the rest."

    HistorySidePanel.tsx              — Suspense boundary for "view full history"
    StatusLegend.tsx                  — static, hoisted module-level
    PreviewStep.tsx                   — orchestrator: maps preview model rows
                                         to the right variant component
```

### Composition rules applied (`composition-patterns`)

- **`patterns-explicit-variants`:** Each row state is its own component
  (`NoMatchRow`, `MultiMatchRow`, `CrossRowConflictResolver`, ...). The
  three single-match score bands are NOT separate components (over-engineered
  per outside-voice P2-K), they're score-driven copy inside one component.
- **`architecture-avoid-boolean-props`:** No row component takes
  `isMultiMatch`, `isConflict`, etc. The variant choice IS the component name.
- **`architecture-compound-components`:** `RowFrame`, `RowPasted`,
  `RowCandidate`, `RowDecisionRadios` are primitives that read shared state
  from `BulkImportPreviewContext`. Each variant composes the primitives it
  needs. Reused by the personen-page repair view and cohort-view banner —
  not speculative.
- **`state-lift-state`:** Decisions, race-guard token, derived "can submit"
  boolean live in `BulkImportPreviewProvider`. The submit button (in
  `DialogActions`, sibling of the row list) consumes the same context.
  No prop-drilling, no useEffect-syncing.
- **`state-decouple-implementation`:** Row primitives do not know HOW
  decisions are stored. Provider can swap `useState<Map>` → reducer →
  external store later without touching UI.
- **`react19-no-forwardref`:** Project is on React 19.2.4. All context reads
  use `use(BulkImportPreviewContext)`, not `useContext`. No `forwardRef` —
  refs are plain props.
- **`patterns-children-over-render-props`:** No `renderCandidate` callbacks.
  Variants iterate candidates directly with `{candidates.map(c =>
  <RowCandidate candidate={c} />)}`.

### Performance rules applied (`react-best-practices`)

- **`server-serialization`:** PreviewModel is slim — only fields the UI
  renders. No full Person rows, no nested certificate arrays.
- **`rerender-memo`:** Each row variant is wrapped in `React.memo`. The
  provider exposes a stable `useRowDecision(rowIndex)` hook returning only
  one row's slice — rows don't re-render when other rows' decisions change.
- **`rerender-defer-reads`:** "Can submit?" is a derived selector in the
  provider. The submit button reads only the boolean.
- **`bundle-dynamic-imports`:** `BulkImportPreviewProvider` and the lifted
  merge dialog are `next/dynamic({ ssr: false })` (modal-on-click).
- **`rendering-hoist-jsx`:** `StatusLegend` is module-level static.
- **`async-suspense-boundaries`:** `HistorySidePanel` wraps the server-fetched
  certificates+cohorts query in `<Suspense fallback={<Skeleton />}>`.
- **`bundle-barrel-imports`:** All imports use direct file paths, no barrel.

### Provider interface

```ts
type BulkImportPreviewContextValue = {
  state: {
    rows: PreviewRow[]
    decisions: ReadonlyMap<number, RowDecision>
    crossRowGroups: CrossRowGroup[]
    previewToken: string
    attempt: 1 | 2 | 3
  }
  actions: {
    setDecision: (rowIndex: number, decision: RowDecision) => void
    resolveCrossRowGroup: (group: CrossRowGroup, resolution: GroupResolution) => void
    refreshPreview: () => Promise<void>
    commit: () => Promise<CommitResult>
  }
  meta: {
    canSubmit: boolean
    unresolvedConflictCount: number
    locationId: string
    targetCohortId?: string
  }
}
```

#### 8. UI: operator-facing repair surfaces

- **Personen page** (`/locatie/[location]/personen`): new "Mogelijke duplicaten"
  view. Lists pairs above score 100 within the location, sorted by score
  descending. Click → operator-gated copy of the merge dialog.
- **Cohort view**: in `/locatie/[location]/cohorten/[cohort]`, show a banner
  above the roster when the cohort contains two persons (both linked to this
  location) whose pairwise score ≥ 150.

#### 9. Single-create dedup hint

Single-create dialog (`create-single-dialog.tsx`) calls
`findCandidateMatchesInLocation` with one candidate as the operator types name +
DOB. Rate-limited to 10 calls/min/operator (P0-B). If a probable match (≥150)
is found, show inline:

```
  ⚠ Lijkt op een bestaand profiel: Adam de Vries (12-05-2010, 4 diploma's)
     [ Gebruik bestaand profiel ]   [ Toch nieuw aanmaken ]
```

If operator clicks "Toch nieuw aanmaken" and proceeds, an audit row is written
with `decisionKind='create_new'`, `presentedCandidatePersonIds=[Adam.id]`,
`source='single_create_dialog'`. Operator's choice is recorded.

## Import preview UX

### Per-row status taxonomy

| Status | Score | Default action | Operator must |
|---|---|---|---|
| **No match** | <100 or empty | Create new | (nothing) |
| **Single match — weak** | 100-149 | None preselected | Click to choose |
| **Single match — strong** | 150-199 | "Use existing" preselected | Click to confirm or override |
| **Single match — perfect** | ≥200 | None preselected (twin guard) | Click to choose |
| **Multiple matches** | any ≥100 | None preselected | Pick one, or "create new" |
| **Already in target cohort** | match exists, allocation exists | "Skip" preselected | Click to confirm |
| **Parse error** | n/a | "Skip" forced | Fix paste or skip |
| **Cross-row group** (N rows → same person) | n/a | Submit blocked | Confirm "same person" or override to "different people" |

### N-way cross-row groups

Detected server-side from two edge sources (see Architecture §2):

1. **Existing-match edges** — rows that strong-match the same existing person.
2. **Paste-vs-paste edges** — rows that strong-match each other regardless of
   existing-person matches.

Both sources flow through the same union-find component builder, producing one
connected group per "probably-same-person" cluster. A group can have:

- `sharedCandidatePersonIds: [existingId]` — the rows match an existing roster
  member. UX defaults to "link all rows to that existing person."
- `sharedCandidatePersonIds: []` — paste-only group (no existing match). UX
  defaults to "create one new person, link all rows to it."

### UX framing: "same person by default"

The default operator outcome is **always "treat the rows as the same person."**
This is the safe outcome — one personId, all roles applied, no duplicate Person
records (which is the entire reason this feature exists). The "different
people" path is the rare exception (twins, cousins) and is reachable as a
secondary text-link, not a primary button.

**Why this matters:** the previous design proposed three equal-weight options
including "Verschillende personen — maak nieuwe profielen." That option, if
clicked on a real same-person case, creates the exact duplicate-Person bug the
whole feature is supposed to prevent. Default UX must lead the operator into
the safe outcome with one click.

UI for an existing-match group (3 rows → existing Adam de Vries):

```
  ⓘ 3 rijen lijken dezelfde persoon te zijn.

      Adam de Vries, 12-05-2010, adam@gmail.com
      4 diploma's · Laatste cohort: Zomer 2025

      Bij bevestigen wordt 1 profiel voor Adam gebruikt en 1 cohortplek
      aangemaakt. De 3 rijen die je plakte verwijzen naar dezelfde persoon
      — geen dubbele profielen.

      Wil je Adam aan meerdere cursussen binnen dit cohort koppelen? Dat
      doe je na de import via de cohortpagina.

      De 3 rijen die we als dezelfde persoon behandelen:
        Rij  3: "Adam de Vries, 12-05-2010, adam@gmail.com"
        Rij 17: "Adam Vries, 12-05-2010, parent@gmail.com"
        Rij 22: "A. de Vries, 12-05-2010"

  [ Annuleren ]                  [ Bevestig — zelfde persoon (primary) ]

      Het zijn verschillende personen — bijv. tweelingen
      Plak opnieuw
```

UI for a paste-only group (3 rows → no existing match, brand-new Adam pasted
three times):

```
  ⓘ 3 rijen lijken dezelfde persoon te zijn.

      Adam de Vries, 12-05-2010
      (nieuw profiel — bestaat nog niet in jouw roster)

      Bij bevestigen wordt 1 nieuw profiel aangemaakt voor Adam en 1
      cohortplek aangemaakt. De 3 rijen verwijzen naar dezelfde persoon
      — geen dubbele profielen.

      Wil je Adam aan meerdere cursussen binnen dit cohort koppelen? Dat
      doe je na de import via de cohortpagina.

      De 3 rijen die we als dezelfde persoon behandelen:
        Rij  3, 17, 22

  [ Annuleren ]                  [ Bevestig — zelfde persoon (primary) ]

      Het zijn verschillende personen — bijv. tweelingen
      Plak opnieuw
```

### Commit-time dedup (when operator confirms "same person")

The decisions API carries a `shareNewPersonWithGroup?: string` field on
`create_new` decisions. When the operator clicks "Bevestig — zelfde persoon"
on a same-person group:

- For a group whose match is an existing person: each row in the group gets
  `{ kind: 'use_existing', personId: <existingId> }`. All rows share the
  same `personId`.
- For a paste-only group (no existing match): each row gets
  `{ kind: 'create_new', shareNewPersonWithGroup: <groupId> }`. The
  `groupId` ties the rows together so `commitBulkImport` calls
  `createPerson` exactly **once** for the group instead of once per row.

`commitBulkImport` then deduplicates the per-personId work:

- One `linkToLocation` per unique `personId`.
- One `Actor.upsert` per `(personId, role)` pair.
- One `cohort_allocation` per `(personId, cohortId)` pair (the partial
  unique index treats NULL `studentCurriculumId` as DISTINCT under default
  PG semantics, so the dedup is enforced in JS via a `processedPersonIds`
  set).
- One `personMergeAudit` row **per original pasted row** — every operator
  decision is captured even when the underlying work was deduplicated.

If the operator instead picks "Het zijn verschillende personen" and uses
the per-row override panel: rows get individual `create_new` decisions with
no `shareNewPersonWithGroup`. `commitBulkImport` calls `createPerson` per
row, producing N separate Person records. This is the rare twin case.

### Multi-course / multi-curriculum within one cohort

The bulk-import CSV carries person + cohort fields. It does NOT carry
`studentCurriculumId`. So when an operator wants Adam in cohort X under
multiple curricula (e.g., two distinct courses), the import flow handles
the bare cohort placement once and the curriculum assignment happens
afterwards via the cohort page. The "1 cohortplek aangemaakt" copy in the
modal reflects this: the import gets Adam *into* the cohort, not into N
distinct curricula. Multiple-curriculum enrollment is an explicit
post-import action.

**Secondary path — "Het zijn verschillende personen":** clicking the text-link
expands a per-row override panel. Operator picks per-row whether each row is
the same person, a different person (create new), or skip. This is the rare
twin/cousin case. Once the operator commits via the override panel, the
primary "same person" affordance disappears for that group — the override is
the explicit signal.

Submit blocked until every group has been confirmed (either via the primary
button or via the override panel).

### Race guard at submit (3-retry semantics, persisted)

```
  preview action at T0:
    - Run detection
    - Persist bulk_import_preview row with detectionSnapshot, attempt=1
    - Return previewToken in PreviewModel

  operator reviews from T0 to T1

  commit action at T1 inside transaction:
    1. Load preview row by token
    2. Verify operator owns locationId
    3. Verify GDPR scope on every use_existing personId
    4. Re-run detection
    5. Compare against detectionSnapshot:
       - If unchanged → proceed
       - If new matches surfaced:
           attempt < 3 → write attempt+1, ABORT with updated preview
           attempt = 3 → ABORT with preview_invalidated_max,
                         operator must re-paste
```

The `bulk_import_preview` row carries the `attempt` counter and the original
detection snapshot. Survives serverless cold starts. Cleaned up by cron after
1 hour or on commit.

## UI copy register

| English (design) | Dutch (UI) |
|---|---|
| Use existing | Gebruik bestaand profiel |
| Create new | Maak nieuw profiel |
| Skip | Sla over |
| No match | Geen match |
| Probable match | Waarschijnlijk dezelfde persoon |
| Possible match | Mogelijk dezelfde persoon |
| Multiple matches | Meerdere mogelijke matches |
| Already in cohort | Zit al in dit cohort |
| Confirm — same person | Bevestig — zelfde persoon |
| They are different people — e.g. twins | Het zijn verschillende personen — bijv. tweelingen |
| Same person | Zelfde persoon |
| Different people | Verschillende personen |
| Custom (per-row choice) | Aangepast |
| On confirm, Adam is added once to this cohort. All 3 placements work via this one profile — no duplicate profiles. | Bij bevestigen wordt Adam 1 keer aan dit cohort toegevoegd. Alle 3 cohortplekken die je beschreef werken via dit ene profiel — geen dubbele profielen. |
| Rows linked to this profile | De rijen die op dit profiel gekoppeld worden |
| New profile — doesn't exist in your roster yet | Nieuw profiel — bestaat nog niet in jouw roster |
| View full history | Bekijk volledige geschiedenis |
| Cancel | Annuleren |
| Confirm and import | Bevestigen en importeren |
| 4 diplomas | 4 diploma's |
| Last cohort | Laatste cohort |
| Roster changed too many times — paste again | Roster veranderde te vaak — plak opnieuw |
| Possible duplicates | Mogelijke duplicaten |
| Re-link not allowed (revoked) | Deze persoon was eerder verwijderd. Neem contact op met NWD om opnieuw toe te voegen. |

## Tests

### Unit (packages/core)

- `findCandidateMatchesInLocation`:
  - Empty location → []
  - Single match score <100 → not surfaced
  - Single match 100-149 → "weak" band
  - Single match 150-199 → "strong" band
  - Single match ≥200 → "perfect" band
  - Multiple matches above threshold → all returned, sorted desc
  - Match person has revoked link → NOT returned (GDPR)
  - Match person has removed link → NOT returned (GDPR)
  - Match person.deletedAt → NOT returned
  - Pasted email matches existing user but name differs → flagged
  - Two pasted rows resolve to same existing → group with rowIndices [a,b]
  - Three pasted rows resolve to same existing → group with rowIndices [a,b,c]
  - One row in two groups (overlaps two different existing persons) → both groups

- `Person.linkToLocation`:
  - No existing link → insert active, returns
  - Already linked active → no-op
  - Existing link is revoked → THROWS with policy message (P1-E)
  - Existing link is removed → THROWS with policy message (P1-E)

- `Person.ensureActor`:
  - Actor already exists for location+type → no-op
  - Actor doesn't exist → upsert

- Scoring fragments (`_internal/duplicate-scoring.ts`):
  - Per-fragment unit tests with known (input → expected score) pairs

### Integration (packages/core)

- `mergePersons`: regression suite from PR #461 stays green
- Audit row written in same transaction as merge — assert that
  rollback-leaves-no-audit-row
- `bulk_import_preview` row created on preview, status flips to 'committed'
  on commit, deleted by cron after expiry

### Server actions (apps/web)

- `previewBulkImportAction`: operator unauthorized → throws "Geen toegang"
- `previewBulkImportAction`: row-level parse errors returned, not thrown
- `previewBulkImportAction`: writes `bulk_import_preview` row with detection
  snapshot
- `commitBulkImportAction`: GDPR guard rejects use_existing for personId
  outside operator's linked-active set
- `commitBulkImportAction`: race guard on attempt 1, 2, 3 returns updated
  preview; attempt 4 returns preview_invalidated_max
- `commitBulkImportAction`: use_existing where target already in cohort →
  throws (defense in depth)
- `commitBulkImportAction`: existing person data preserved on use_existing
  (no overwrite)
- `commitBulkImportAction`: create_new exact-matching a revoked person
  → throws revoked-link policy message
- `commitBulkImportAction`: transaction rolls back on row failure → no
  partial state
- `commitBulkImportAction`: audit row written for create_new with
  presentedCandidatePersonIds populated when candidates were shown
- Single-create hint endpoint: 11th call within 60s → 429

### E2E (apps/web)

- Bulk import happy path: paste 5 rows, all "no match", create 5 persons
- Mixed bulk import: some matches, some not, operator decides each
- Multi-match row: 2 candidates, operator picks one
- Cross-row group (2 rows): submit blocked, operator resolves
- Cross-row group (3 rows): submit blocked, custom per-row resolution works
- Already-in-cohort: row preselected skip, operator can override
- View full history: side panel loads without leaving preview
- Race guard: simulated concurrent edit, banner shown, recovery works (attempt
  2), 4th-strike forces re-paste
- Operator cancels mid-review: no state mutation, preview row is cleaned up
  by cron
- Personen page duplicates view: list, click, merge, list updates
- Cohort banner: shown when duplicates exist, hidden when not, click → merge
- GDPR boundary: operator A cannot merge a person whose only active link is
  to operator B's location (test crafted payload)
- Revoked-link guard: pasting a CSV row that exact-matches a revoked person
  triggers policy error message
- Single-create dedup hint: inline match suggestion appears, audit row
  records the operator's create_new choice with presented candidates

### Regression (CRITICAL)

- Existing single-create dialog produces identical Person + Actor + LocationLink
  rows before and after this PR. Assertion: snapshot the rows AND the
  exact INSERT order via SQL log capture. (Mitigates P0-C residual risk —
  even though we kept `createPersonForLocation` unchanged, the test verifies
  no incidental ordering drift via dependencies.)

### LLM evals

None — no LLM in this scope.

## Performance

### Indexes (single migration, all backward-compatible)

```sql
-- Filtered btree index on (locationId, personId) for the active-link join.
-- Already a foreign key; this adds the composite covering form.
CREATE INDEX person_location_link_active
  ON person_location_link (location_id, person_id)
  WHERE status = 'linked';

-- Date-of-birth lookup, the highest-selectivity filter in scoring.
CREATE INDEX person_match_dob
  ON person (date_of_birth)
  WHERE deleted_at IS NULL;

-- bulk_import_preview cleanup
CREATE INDEX bulk_import_preview_expires_at
  ON bulk_import_preview (expires_at)
  WHERE status = 'active';
```

**`pg_trgm` is deferred** to a follow-up PR (TODOS.md). v1 uses the existing
`LEFT(x, 3)` prefix-similarity from PR #461's detection. This avoids the
P1-D migration locking risk (no `CREATE INDEX CONCURRENTLY` ceremony needed
in v1) and the P1-H tuning-as-precondition issue.

### Latency target

Preview action with 30 rows × 5,000 location persons: target p99 ≤ 1.5s.
Measured before merge with seed data. If above target: soft-cap at 100 rows
per preview with operator-facing notice ("Plak maximaal 100 rijen tegelijk").

### N+1 prevention

All display aggregates (cert count, last cohort, last diploma) computed in the
same SQL via LEFT JOIN with aggregates over `certificate` and
`cohort_allocation`. One round trip per preview. Explicitly tested with a
query-count assertion in integration tests.

## Phasing

Ship together in one PR stacked on `codex/person-duplicate-merge` (PR #461).
Target `codex/person-duplicate-merge` until #461 lands, then GitHub auto-retargets
to main.

### Worktree parallelization

```
Lane A (db)                          Lane C (detection refactor)
  - audit.ts schema:                   - extract scoring fragments
      personMergeAudit                 - candidate-scoring SQL shape
      bulkImportPreview                - keep existing scripts green
  - migration (schema + indexes)       - tests
  - tests
                       └────────┐  ┌────┘
                                ▼  ▼
                       Lane B (server + glue)
                         - linkToLocation primitive (with revoked-throw)
                         - ensureActor primitive
                         - findCandidateMatchesInLocation
                         - previewBulkImportAction
                         - commitBulkImportAction (race guard, audit writes)
                         - cleanup cron
                         - inline-hint rate limiter
                         - tests
                                ▼
                       Lane D (UI)
                         - lift secretariaat dialog → shared
                         - import preview components (5 row variants
                           + cross-row resolver)
                         - personen duplicates view
                         - cohort banner
                         - single-create dedup hint
                         - E2E tests
```

A and C run in parallel. B starts when A and C are done. D starts when B is done.

## What we deliberately don't refactor

Per outside-voice P0-C, the following stay untouched in this PR:

- `lib/nwd.ts` `createPersonForLocation` — unchanged signature, unchanged body.
  All existing callers (single-create dialog, programmatic flows) continue to
  work identically.
- `Person.getOrCreate` exact-match criteria — unchanged. Fuzzy matching lives
  one layer up, with a human in the loop.

## Failure modes (must remain green)

1. **GDPR boundary verified at commit, not just at preview.** Step 3 of
   `commitBulkImportAction`. Crafted-payload test.
2. **Audit row write in same transaction as the merge/link/create.** No async,
   no post-commit hook. Asserted by transaction-rollback test.
3. **Revoked-link silent re-link prevented.** `Person.linkToLocation` throws.
   Tested by attempting to use_existing on a revoked person via crafted payload
   AND by attempting create_new with data that exact-matches a revoked person.

## Open engineering questions (to resolve during implementation)

- Vercel cron syntax + auth header for the `bulk_import_preview` cleanup job.
  Existing cron jobs in this repo? If yes, follow that pattern.
- `bulk_import_preview` retention for committed rows: 30 days (current
  proposal) vs longer for forensics. Decide with legal/data-minimization
  tradeoff in mind.
- Audit table storage: at 1 row per merge, this stays small for years. Revisit
  if row count > 1M.

## What this design does NOT change

- The merge engine itself (PR #461 already shipped the hard part).
- The exact-match `Person.getOrCreate`. We don't loosen its match criteria —
  fuzzy matching without UI is a different bug class.
- Existing sysadmin flows at `/secretariaat/gebruikers` (which now also log to
  `person_merge_audit` with `source='sysadmin'`).
- `lib/nwd.ts` `createPersonForLocation` — unchanged.

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | informal | scope reframed from cure-only to prevention+repair; GDPR boundary set |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 11 issues, 0 critical gaps, all decisions applied |
| Outside Voice | `/codex` (fallback: claude subagent) | Independent 2nd opinion | 1 | CLEAR | 3 P0 + 5 P1 + 3 P2 found; 9 absorbed, 2 rejected (P2-I diff-view → defer v1.5, P2-K full collapse → keep reduced split) |
| Design Review | `/plan-design-review` | UI/UX gaps | 0 | — | recommended next |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | not applicable (operator-facing) |

**UNRESOLVED:** 0
**VERDICT:** ENG + OUTSIDE-VOICE CLEARED — ready for `/plan-design-review` on the multi-match resolver, then implementation.
