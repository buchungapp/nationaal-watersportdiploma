# TODOs

Items the team has explicitly considered and deferred. Each entry includes context
so a future contributor can pick it up cold.

## Subject-initiated cross-location merge inbox

**What:** A sysadmin (Buchung) tool: an inbox of "Adam wants his Location X record
merged with his Location Y record" requests, sourced from email or a self-service
form. One-click merge under controller authority, with the data subject's
authorization recorded as evidence.

**Why:** Operators cannot merge across location boundaries (GDPR — they can only see
persons with active `person_location_link.status='linked'` to their own location).
The escape valve is data-subject-initiated: the person themselves contacts NWD,
sysadmin merges. Today this happens over email and gets handled ad-hoc by Buchung.
An inbox-style tool would queue these requests with the email evidence pre-attached,
prevent duplicate work, and create a clean audit trail under
`person_merge_audit.source='sysadmin'`.

**Pros:**
- Faster turnaround for the data subject (no manual email triage)
- Audit trail is clean (the request, the evidence, the merge — all linked)
- Buchung's queue is visible, not buried in Gmail

**Cons:**
- New surface area to maintain (inbox UI, request schema, evidence storage)
- Self-service form risks abuse (someone requesting a merge they can't authorize)
- Email parsing for incoming requests has corner cases — easier to start with
  manual entry by sysadmin

**Context:** The audit table `person_merge_audit` already supports
`source='sysadmin'` (see `docs/designs/operator-identity-workflow.md`). The merge
engine in `packages/core/src/models/user/person.ts` already handles
cross-location merges when called from a sysadmin context. This TODO is about
the operational layer — not the merge itself.

**Effort estimate:** L (human team) → M (CC+gstack)

**Priority:** P3. Operators have the cure-and-prevention tooling that solves the
high-volume operator-bottleneck problem. This is the long-tail data-subject path.

**Depends on / blocked by:** The `person_merge_audit` table (introduced in the
operator identity workflow PR). No technical blockers beyond that.

## Adopt `pg_trgm` for duplicate-person scoring

**What:** Replace the hand-rolled `LEFT(x, 3)` prefix-similarity scoring in
`packages/core/src/models/user/_internal/duplicate-scoring.ts` (and the
`packages/scripts/src/utils/duplicate-person-detection.ts` script) with
`pg_trgm` `similarity()` calls + GIN trigram indexes on `lower(first_name)`
and `lower(last_name)`.

**Why:** Trigram similarity gives meaningfully better matches than prefix
comparison, especially for typos in middle/end of names ("de Vries" vs
"de Vires"), and gets a GIN index for free so candidate scoring stays fast on
large locations.

**Pros:**
- Better recall on name typos
- GIN trigram indexes support fast similarity queries at scale
- One source of truth across detection and scoring (already structured for it)

**Cons:**
- Threshold tuning is a precondition. Common Dutch names (Jan, Piet, Bas) share
  trigrams — wrong threshold (0.4) will drown the preview UI in false
  positives. Need a calibration script run against the existing duplicate
  dataset, with results documented before merge.
- `CREATE INDEX CONCURRENTLY` requires non-transactional migration runner setup
  (Drizzle's default migration runner wraps in a transaction). Need to split
  into separate migration files using raw-SQL `--no-transaction` style.
- Rollout risk: changing similarity thresholds changes which rows the operator
  sees as "probable" vs "possible" matches. UI thresholds (150/200) may need
  re-calibration too.

**Context:** Deferred from the operator-identity-workflow PR (P1-H finding
from outside-voice review, 2026-04-29). The decision was: ship the prevention
+ repair UX with the existing prefix-match scoring, then earn the trigram
upgrade with a calibration script and a dedicated migration PR. This avoids
blocking the operator-facing work on a tuning question that would otherwise
hold up the release.

**Effort estimate:** M (human team) → S (CC+gstack), assuming the calibration
dataset and labeling work is small. If the dataset turns out large or
disputed, escalate to L/M.

**Priority:** P2. Quality-of-match improvement, not a blocker. Worth doing
within a quarter of the operator-identity-workflow PR landing, while the
context is fresh.

**Depends on / blocked by:**
- Operator-identity-workflow PR (provides the scoring fragment seam)
- Access to a labeled duplicate dataset for threshold calibration (use the
  existing pile of duplicates the analysis scripts found, then label by hand
  or with a short labeling pass)
