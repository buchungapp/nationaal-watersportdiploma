# Explicit Acting Profile for Staff Dashboards

Status: DRAFT (post fable review; plumbing decision verified against vendored Next.js 16.1.6 source)
Owner: Maurits (Buchung)
Date: 2026-07-04
Related: docs/designs/operator-identity-workflow.md (operator identity for merges/imports)

## Problem

Recurring support cases: an instructor cannot see staff tabs because their account
has no or the wrong "main profile". The current design makes `person.isPrimary` do
too much — it is simultaneously a profile default, a UI gate, an authorization
identity, and an audit identity.

## Verified facts (code evidence)

All claims below were verified against the codebase; paths are repo-relative.

- `getPrimaryPerson` (`apps/web/src/lib/nwd.ts:117-145`) silently falls back to
  `user.persons[0]` when no person is primary, and **writes** `isPrimary` during the
  read (`User.Person.setPrimary`, called at nwd.ts:141). Every one of its ~80 call
  sites uses the default `force = true`, so the write path is live everywhere.
- The write path uses `User.Person.setPrimary` (`packages/core/src/models/user/person.ts:2223`),
  which sets without unsetting siblings — only the partial unique index
  `unq_primary_person` (`packages/db/src/schema/user.ts:94-96`) prevents double
  primaries, by throwing. The transactional unset-then-set variant is
  `User.setPrimaryPerson` (`packages/core/src/models/user/user.ts:207-239`).
- The multi-profile ambiguity is real: the `actor` uniqueness constraint is
  `(type, personId, locationId)` with no reference to `userId`
  (`packages/db/src/schema/user.ts:133-135`), so one user can own two persons that
  are both instructors at the same location.
- `isPrimary` gates instructor UI in four places:
  `apps/web/src/app/(dashboard)/(account)/profiel/[handle]/page.tsx:88-91`, the
  dashboard-toggle wrapper, `require-instructor-person.ts:44-47`, and the PVB page
  `profiel/[handle]/pvb-aanvraag/[pvbHandle]/page.tsx:55` (which blocks a
  non-primary person from seeing their *own* PVB on their own handle).
- Attribution: `studentCohortProgress.createdBy` (`packages/db/src/schema/progress.ts:21`)
  and `bulkImportPreview.createdByPersonId` on the cohort/import side, plus
  `aangemaaktDoor` (actor-id based) in the PVB models
  (`packages/core/src/models/pvb/aanvraag.ts`, `beoordeling.ts`) and person-merge
  logs. Both `updateCompetencyProgress` (nwd.ts:2274) and
  `completeAllCoreCompetencies` (nwd.ts:2305) write `createdBy: primaryPerson.id`.
  `updateStudentInstructorAssignment` (nwd.ts:2668) silently defaults the claiming
  instructor to the primary person.
- Cohort eligibility model: the access window lives **on the cohort**
  (`cohort.accessStartTime`/`accessEndTime`), not on the allocation. The only cohort
  privileges are `manage_cohort_certificate`, `manage_cohort_students`,
  `manage_cohort_instructors` (`packages/lib/src/enums.ts:3-7`). There is no
  "assess" privilege — PVB assessment is a separate `pvb_beoordelaar` actor type.
- There is no existing preference storage (no settings table, no
  location/profile cookie). The only identity-adjacent cookie is
  `impersonated_user_id` (nwd.ts:227,301).

## Architecture decision: how acting identity flows

Verified against the vendored Next.js source at tag `v16.1.6` (the exact version in
`apps/web/package.json`) and the compiled React 19.2.4 server runtime in
`apps/web/node_modules/next/dist/compiled/`:

1. **React `cache()` memoizes per flight-render request.** The cache store is a Map
   on the flight request object (`DefaultAsyncDispatcher.getCacheForType` →
   `request.cache`). Next renders the entire App Router tree — layouts, pages, and
   parallel route slots like `@sidebar` — in **one** `renderToReadableStream` call
   per HTTP request (`app-render.tsx:738`). A `cache()`-wrapped resolver keyed by
   `locationId` is therefore computed once per request and shared by the sidebar
   switcher, the layout, and the page.
2. **`cache()` is a silent no-op inside server actions.** Actions execute inside
   Next's `workUnitAsyncStorage.run(...)` (`action-handler.ts:1222`), which is not
   React's flight-request scope; without an active flight request,
   `getCacheForType` returns a fresh Map per call. There is no such thing as
   request-scoped memoization in an action.
3. **The post-action re-render is a fresh flight request with a fresh cache**
   (`executeActionAndPrepareForRender` switches the store to the render phase and
   re-renders in the same HTTP request). A choose-profile action that writes the
   preference and revalidates is automatically picked up by the re-render — no
   manual cache invalidation needed.

Consequences:

- **Reads: request-scoped resolution via React `cache()`.**
  `resolveActingContextForLocation = cache(async (locationId) => …)` plus a cohort
  variant that composes it. Existing `nwd.ts` functions swap
  `getPrimaryPerson(user)` for `resolveActingPersonForLocation(locationId)` using
  the `locationId`/`cohortId` they already receive. No signature threading through
  pages, no route-param plumbing. This is idiomatic here — `nwd.ts` already wraps
  ~all reads in `cache()`.
- **Mutations: explicit `actingPersonId` argument, fully revalidated per action.**
  Not a style preference: fact 2 means the read-side resolver cannot memoize in an
  action, so each action does exactly one explicit resolve-and-validate anyway.
- **Rejected — userland `AsyncLocalStorage`:** userland cannot wrap Next's render
  pipeline, and an `als.run()` around a layout's body does not extend to children
  or sibling parallel slots (RSC renders them later, outside the synchronous
  scope). Any ALS design collapses back into "call a function with the key".
- **Rejected — threading `actingPersonId` through every `nwd.ts` signature:**
  touches every call site (~80 in nwd.ts alone) for zero semantic gain over
  `cache()` on the read side.

## Key Changes

- In `apps/web/src/lib/nwd.ts`, split identity helpers:
  - `getDefaultPerson`: **truly read-only** default profile for `/profiel` landing.
    Deletes the write-during-read; never falls back by writing.
  - `getPersonByHandle`: profile routes; the handle determines the acting person.
  - `resolveActingContextForLocation` / `resolveActingContextForCohort`:
    `cache()`-wrapped read-side resolvers keyed by resource id.
  - `requireActingPersonForLocation` / `requireActingPersonForCohort`: mutation-side
    validators taking an explicit `actingPersonId`.
- Add `userActingProfilePreference` table: `userId`, `locationId`, `personId`,
  timestamps, unique on `(userId, locationId)`. Convenience only — every read and
  action revalidates ownership and active role/privilege. Cross-device by design
  (a cookie was considered and rejected: per-device memory reproduces the support
  problem on every new device).
- Remove `person.isPrimary` from all four instructor-UI gates listed above. Active
  owned roles decide visibility; on `/profiel/[handle]` the handle decides identity.
- Acting-profile switcher in the location sidebar layout
  (`apps/web/src/app/(dashboard)/(management)/@sidebar/locatie/[location]/layout.tsx`).
  Note: this layout currently renders only the `LocationSelector`; the account
  selector lives in the parent `@sidebar/layout.tsx`. The switcher shows
  "Handelt als [name]", role badges, and a switch action when multiple profiles
  qualify.

## Acting Identity Rules

- `/profiel/[handle]/...`: acting person is derived only from the owned profile
  handle. No fallback to the default profile. This includes the PVB page under
  `pvb-aanvraag/[pvbHandle]` (currently blocked by a `primaryPerson.id` check).
- `/locatie/[location]/...`: eligible profiles are owned profiles with active roles
  for that location/page.
- `/locatie/[location]/cohorten/[cohort]/...`: eligible profiles are owned profiles
  that are location admin, **or** have a cohort allocation while the cohort's
  access window (`accessStartTime`/`accessEndTime`, on the cohort) is open —
  optionally narrowed by the three `manage_cohort_*` privileges the page needs.
- Zero eligible profiles: deny/not found. Zero persons on the account at all
  (today `getPrimaryPerson` throws "Expected at least one person"): redirect to
  onboarding, defined behavior instead of a 500.
- One eligible profile: use it automatically, show the acting indicator.
- Multiple eligible profiles + valid remembered preference for the location: use
  it, show the switcher.
- Multiple eligible profiles, no valid preference: **redirect to a chooser route**
  (`/locatie/[location]/kies-profiel?next=…`) before any student/cohort data is
  fetched. A redirect, not an in-place blocking render: the dashboard uses parallel
  route slots that fetch independently, so an in-place gate would have to be
  re-implemented in every segment. Choosing stores the preference (server action)
  and redirects back to the canonical URL; per architecture fact 3 the fresh render
  picks it up with no extra invalidation.
- `?actingPersonId=` is never authority. Links from `/profiel/[handle]` into
  management pages set acting context via a server action or transition route,
  then redirect to the canonical resource URL.
- **Impersonation:** acting-profile resolution composes with the existing
  `impersonated_user_id` cookie — resolve profiles from the impersonated user's
  persons, and key/write preferences against the impersonated user only.

## Surfaces in scope

The migration list is larger than `/profiel` + `/locatie`:

- **PVB server actions** (`apps/web/src/app/_actions/pvb/assessment-action.ts` — 5
  `getPrimaryPerson` call sites deriving the beoordelaar actor —
  `leercoach-permission-action.ts`, `course-management-action.ts`): squarely inside
  the support-bug class; migrate with the cohort actions.
- **API routes** used by dashboards (`api/persons/list/[location]`,
  `api/beoordelaars/list/[location]`, certificate PDF exports): authorize per
  request via the same resolve-for-location logic (they have a `location` param;
  `cache()` works per request in route handlers the same way).
- **`secretariaat/`** (org-wide, no `locationId` — the preference key cannot
  represent it): resolve by the `secretariaat` actor type across owned profiles; if
  multiple qualify this is a data error to surface, not a chooser case. Explicitly
  phase 4; until then it stays on the read-only `getDefaultPerson` (bug class does
  not apply: secretariaat users are Buchung-managed).
- **`penningmeester/`**: same treatment as secretariaat.

## Mutation Rules

- Staff actions **re-resolve the acting person server-side from the resource +
  the per-location preference** (`requireActingPersonForLocation(locationId)` /
  `requireActingPersonForCohort(cohortId)` using the ids the action already
  receives) rather than receiving a client-visible `actingPersonId` argument.
  This is stricter than the earlier "receive a server-rendered `actingPersonId`"
  wording: per architecture fact 2, `cache()` is a no-op inside actions, so a
  passed id would save no work while being pure attack surface (a client could
  submit any owned — or, absent a check, unowned — person id). The resolver
  fails closed on any status other than `ok` (unauthorized/choose → throw), so
  missing, stale, cross-account, and underprivileged cases are all rejected by
  construction. Client-supplied person ids survive only as mutation *subjects*
  (the student being enrolled, the person being merged), never as the acting or
  operator identity.
- Audit fields (`createdBy` on `studentCohortProgress`,
  `createdByPersonId` on bulk import) and the instructor default in
  `updateStudentInstructorAssignment` use the acting profile.
- Authorization holes are fixed in the same pass as each function is migrated —
  acting identity must not be layered over missing authorization. **Scope includes
  unauthorized reads, not just TODO mutations:**
  - `updateStudentInstructorAssignment` (nwd.ts:2641): **no authorization at all**
    today, plus the primary-person attribution default. Worst offender; fix first.
  - `enrollStudentsInCurriculumForCohort` (nwd.ts:2712) and
    `withdrawStudentFromCurriculumInCohort` (nwd.ts:2756): auth checks are
    commented out.
  - `updateCompetencyProgress` (nwd.ts:2293) and `completeAllCoreCompetencies`
    (nwd.ts:2319): "TODO: check instructor for cohort" — no real check.
  - Unauthorized reads: `listInstructorsByCohortId` (nwd.ts:2130),
    `listCurriculaByPersonId` (2201), `listCurriculaProgressByPersonId` (2215),
    `listStudentCohortProgressByPersonId` (2234),
    `listCompletedCompetenciesByStudentCurriculumId` (2251),
    `listCompetencyProgressInCohortForStudent` (2262).
  - `listAllocationHistory` (nwd.ts:3347): never verifies the allocation belongs to
    the passed cohort.
  - `removeAllocationById` / `moveAllocationById` (nwd.ts:2508,2555): conflate
    `manage_cohort_students` and `manage_cohort_instructors`;
    `remove-instructor-from-cohort-action` can remove a student allocation.

## Hazards (review checklist)

- **Never call the acting resolver (or pass its result) inside a `"use cache"`
  scope.** `"use cache"` is cross-request and cross-user — it is live in this
  codebase today (`nwd.ts:710-821`, cohort overview page). `cache()` (per-request)
  and `"use cache"` (cross-request) look similar in this file; a leak here serves
  one user's acting identity to another.
- Do not "fix" the unmemoized-in-actions behavior with module-global caching —
  that is a cross-request leak by construction.
- `cache()` memoizes thrown errors per request (consistent within a request; fine).
- If any code path still sets a primary person, use the transactional
  `User.setPrimaryPerson`, never `User.Person.setPrimary` (set-without-unset).

## Phasing

1. **Quick win (kills most support cases):** make the default-person lookup truly
   read-only (delete the write-during-read — which today can fire repeatedly per
   action invocation, since `cache()` does not dedupe there), and switch the four
   `/profiel/[handle]` gates to handle-derived identity. Also widen
   `retrievePvbAanvraagByHandle` from primary-person to any-owned-person
   authorization so the PVB page fix is effective (the explicit acting-person
   parameter lands in phase 3). Small diff, immediately shippable.
2. **Location tree:** `resolveActingContextForLocation`, chooser route, preference
   table, sidebar switcher, migrate `/locatie/[location]` pages.
3. **Cohorts + mutations + auth fixes:** `resolveActingContextForCohort`, migrate
   cohort pages/actions and PVB actions, fix the enumerated authorization holes,
   route audit fields through the acting profile.
4. **Remaining surfaces:** API routes, secretariaat, penningmeester.

## Test Plan

- Non-primary instructor profile shows staff tabs, staff profile pages, and their
  own PVB pages under their own handle.
- Account with no primary profile can access eligible staff dashboards; account
  with zero persons gets the defined onboarding redirect, not a 500.
- Shared cohort URL with one eligible profile opens directly with the indicator.
- Shared cohort URL with two eligible profiles redirects to the chooser before any
  student data is fetched (assert on the redirect, not just the rendered page).
- After choosing, the same-request re-render uses the new preference (no stale
  acting context); revisits reuse it; the switcher changes it.
- Stale or unauthorized remembered profile prompts again or denies.
- Server actions reject missing, stale, cross-account, or underprivileged
  `actingPersonId`.
- Audit records (`createdBy`) and the claim-instructor default attribute to the
  selected acting profile.
- Previously unauthorized reads/mutations (list above) now deny for
  non-eligible users.
- Impersonated sessions resolve and store preferences against the impersonated
  user.
- Sidebar slot and page resolve the same acting person within one request (single
  resolver execution per request).

## Tradeoffs

- No `actingPersonId` in canonical URLs: brittle for shared links, leaks identity
  selection into resource URLs, and never authority anyway.
- No main/default-profile fallback for staff resources: recreates today's bug.
- Choose-before-view on ambiguous staff URLs (no read-only preview): safer for
  student/cohort data.
- Preference is per location, not account-global: switching in one location must
  not affect another. Table over cookie: cross-device memory is the point.
- Main/default profile survives only as `/profiel` landing behavior, renamed
  "default profile"; removing the concept entirely is larger than this problem
  needs.
