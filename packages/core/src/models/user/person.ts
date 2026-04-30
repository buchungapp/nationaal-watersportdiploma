import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  and,
  countDistinct,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  formatSearchTerms,
  generatePersonID,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import * as DuplicateScoring from "./_internal/duplicate-scoring.js";
import { insertSchema, personSchema } from "./person.schema.js";
import { getOrCreateFromEmail } from "./user.js";
import { selectSchema } from "./user.schema.js";

export * as $schema from "./person.schema.js";

export const getOrCreate = wrapCommand(
  "user.person.getOrCreate",
  withZod(
    insertSchema
      .pick({
        firstName: true,
        lastName: true,
        lastNamePrefix: true,
        dateOfBirth: true,
        birthCity: true,
        birthCountry: true,
      })
      .extend({
        userId: selectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const conditions: SQL[] = [];

      if (input.userId) {
        conditions.push(eq(s.person.userId, input.userId));
      } else {
        conditions.push(isNull(s.person.userId));
      }

      // Add conditions dynamically based on defined inputs
      if (input.firstName) {
        conditions.push(
          eq(sql`LOWER(${s.person.firstName})`, input.firstName.toLowerCase()),
        );
      }
      if (input.lastName) {
        conditions.push(
          eq(sql`LOWER(${s.person.lastName})`, input.lastName.toLowerCase()),
        );
      }
      if (input.dateOfBirth) {
        conditions.push(
          eq(
            s.person.dateOfBirth,
            dayjs(input.dateOfBirth).format("YYYY-MM-DD"),
          ),
        );
      }

      const [existing] = await query
        .select({ id: s.person.id })
        .from(s.person)
        .where(and(...conditions));

      if (existing) {
        return {
          id: existing.id,
        };
      }

      const [newPerson] = await query
        .insert(s.person)
        .values({
          userId: input.userId,
          handle: generatePersonID(),
          firstName: input.firstName,
          lastName: input.lastName,
          lastNamePrefix: input.lastNamePrefix,
          dateOfBirth: input.dateOfBirth
            ? dayjs(input.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.birthCity,
          birthCountry: input.birthCountry,
        })
        .returning({ id: s.person.id });

      if (!newPerson) {
        throw new Error("Failed to create actor");
      }

      return {
        id: newPerson.id,
      };
    },
  ),
);

export const create = wrapCommand(
  "user.person.create",
  withZod(
    insertSchema
      .pick({
        firstName: true,
        lastName: true,
        lastNamePrefix: true,
        dateOfBirth: true,
        birthCity: true,
        birthCountry: true,
      })
      .extend({
        userId: selectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const newPerson = await query
        .insert(s.person)
        .values({
          userId: input.userId,
          handle: generatePersonID(),
          firstName: input.firstName,
          lastName: input.lastName,
          lastNamePrefix: input.lastNamePrefix,
          dateOfBirth: input.dateOfBirth
            ? dayjs(input.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.birthCity,
          birthCountry: input.birthCountry,
        })
        .returning({ id: s.person.id })
        .then(singleRow);

      return {
        id: newPerson.id,
      };
    },
  ),
);

export const createLocationLink = wrapCommand(
  "user.person.createLocationLink",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .insert(s.personLocationLink)
        .values({
          personId: input.personId,
          locationId: input.locationId,
          status: "linked",
          permissionLevel: "none",
        })
        .onConflictDoNothing({
          target: [
            s.personLocationLink.personId,
            s.personLocationLink.locationId,
          ],
        });

      return;
    },
  ),
);

// ─── Bulk import preview / commit ──────────────────────────────────────────
//
// Operator-facing flow for paste-CSV-into-cohort. The preview action scores
// pasted candidates against the location's roster, persists a preview row
// (the snapshot used for race-guard at commit time), and returns the model
// the UI renders. The commit action takes per-row decisions, re-runs
// detection in-transaction (race guard with hard 3-retry cap), applies the
// decisions, and writes audit rows.

const BULK_IMPORT_PREVIEW_TTL_MINUTES = 60;

type ParsedCandidate = {
  rowIndex: number;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  dateOfBirth: string;
  birthCity: string;
  birthCountry: string;
  email: string | null;
};

type ImportRoles = ("student" | "instructor" | "location_admin")[];

type DetectionSnapshotEntry = {
  matchPersonIds: string[];
  topScore: number;
};

const buildDetectionSnapshot = (matches: {
  matchesByRow: {
    rowIndex: number;
    candidates: { personId: string; score: number }[];
  }[];
}): Record<string, DetectionSnapshotEntry> => {
  const snap: Record<string, DetectionSnapshotEntry> = {};
  for (const row of matches.matchesByRow) {
    const sortedIds = row.candidates
      .map((c) => c.personId)
      .sort((a, b) => a.localeCompare(b));
    snap[row.rowIndex.toString()] = {
      matchPersonIds: sortedIds,
      topScore: row.candidates[0]?.score ?? 0,
    };
  }
  return snap;
};

const snapshotsDiverge = (
  before: Record<string, DetectionSnapshotEntry>,
  after: Record<string, DetectionSnapshotEntry>,
): boolean => {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const k of keys) {
    const a = before[k];
    const b = after[k];
    const aIds = a?.matchPersonIds ?? [];
    const bIds = b?.matchPersonIds ?? [];
    if (aIds.length !== bIds.length) return true;
    for (let i = 0; i < aIds.length; i++) {
      if (aIds[i] !== bIds[i]) return true;
    }
  }
  return false;
};

export const previewBulkImport = wrapCommand(
  "user.person.previewBulkImport",
  withZod(
    z.object({
      locationId: uuidSchema,
      performedByPersonId: uuidSchema,
      targetCohortId: uuidSchema.optional(),
      roles: z
        .array(z.enum(["student", "instructor", "location_admin"]))
        .nonempty(),
      candidates: z.array(
        z.object({
          rowIndex: z.number().int().nonnegative(),
          firstName: z.string(),
          lastName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          dateOfBirth: z.string(),
          birthCity: z.string(),
          birthCountry: z.string(),
          email: z.string().nullable(),
        }),
      ),
      parseErrors: z
        .array(
          z.object({
            rowIndex: z.number().int().nonnegative(),
            error: z.string(),
          }),
        )
        .default([]),
    }),
    z.object({
      previewToken: z.string().uuid(),
      attempt: z.number().int(),
      matches: z.unknown(), // shape is the findCandidateMatchesInLocation result
      parseErrors: z.array(
        z.object({ rowIndex: z.number().int(), error: z.string() }),
      ),
      candidates: z.array(z.unknown()),
    }),
    async (input) => {
      const query = useQuery();

      const matches =
        input.candidates.length > 0
          ? await findCandidateMatchesInLocation({
              locationId: input.locationId,
              targetCohortId: input.targetCohortId,
              candidates: input.candidates.map((c) => ({
                rowIndex: c.rowIndex,
                firstName: c.firstName,
                lastName: c.lastName,
                lastNamePrefix: c.lastNamePrefix,
                dateOfBirth: c.dateOfBirth,
                birthCity: c.birthCity,
                email: c.email,
              })),
            })
          : { matchesByRow: [], crossRowGroups: [] };

      const snapshot = buildDetectionSnapshot(matches);

      const expiresAt = dayjs()
        .add(BULK_IMPORT_PREVIEW_TTL_MINUTES, "minute")
        .toISOString();

      const [row] = await query
        .insert(s.bulkImportPreview)
        .values({
          locationId: input.locationId,
          createdByPersonId: input.performedByPersonId,
          targetCohortId: input.targetCohortId,
          detectionSnapshot: snapshot,
          rowsParsed: {
            candidates: input.candidates,
            roles: input.roles,
          },
          attempt: 1,
          status: "active",
          expiresAt,
        })
        .returning({ token: s.bulkImportPreview.token });

      if (!row) {
        throw new Error("Failed to persist bulk import preview row");
      }

      return {
        previewToken: row.token,
        attempt: 1,
        matches,
        parseErrors: input.parseErrors,
        candidates: input.candidates,
      };
    },
  ),
);

const rowDecisionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("create_new"),
    // When set, multiple rows in the same cross-row group all default to
    // creating ONE shared new person. Operator confirmed "same person" on
    // the group; without this flag the server would call createPerson per
    // row and produce N duplicate Person records — the very bug this whole
    // flow is meant to prevent. Rows in "different people" mode (the twins
    // override) leave this unset, getting per-row createPerson calls.
    shareNewPersonWithGroup: z.string().optional(),
  }),
  z.object({ kind: z.literal("use_existing"), personId: uuidSchema }),
  z.object({
    kind: z.literal("skip"),
    reason: z
      .enum([
        "cohort_conflict",
        "cross_row_conflict",
        "parse_error",
        "operator",
      ])
      .default("operator"),
  }),
]);

export type BulkImportRowDecision = z.infer<typeof rowDecisionSchema>;

/**
 * Commit a bulk import preview. Race-guards against concurrent location edits
 * (3 attempts), GDPR-rechecks every use_existing personId server-side, opens
 * a transaction, applies each row decision, writes audit rows, marks the
 * preview committed.
 *
 * IMPORTANT: this function does NOT call createPersonForLocation directly —
 * it expects the caller (web layer) to provide a `createPerson` callback for
 * the create_new branch. This keeps core free of the auth-context and
 * Supabase wiring that lives in `lib/nwd.ts`.
 */
export const commitBulkImport = wrapCommand(
  "user.person.commitBulkImport",
  withZod(
    z.object({
      previewToken: z.string().uuid(),
      performedByPersonId: uuidSchema,
      decisions: z.record(z.string(), rowDecisionSchema),
      // Caller-supplied factory for the create_new path. Kept callback-shaped
      // so the web layer can plug in `createPersonForLocation` (which carries
      // its own makeRequest+auth context) without core depending on it.
      createPerson: z
        .function()
        .args(
          z.object({
            firstName: z.string(),
            lastName: z.string().nullable(),
            lastNamePrefix: z.string().nullable(),
            dateOfBirth: z.string(),
            birthCity: z.string(),
            birthCountry: z.string(),
            email: z.string().nullable(),
          }),
        )
        .returns(z.promise(z.object({ personId: z.string().uuid() })))
        .optional(),
      // Optional cohort-allocation tags per row (rowIndex → tags[]).
      // Applied after the cohort_allocation insert, so only relevant when
      // the preview was created with targetCohortId set. Tags travel
      // with the allocation, not the person.
      tagsByRowIndex: z.record(z.string(), z.array(z.string())).optional(),
    }),
    z.unknown(),
    async (input) => {
      const query = useQuery();

      const previewRow = await query
        .select()
        .from(s.bulkImportPreview)
        .where(eq(s.bulkImportPreview.token, input.previewToken))
        .then(possibleSingleRow);

      if (!previewRow) {
        throw new Error("Preview niet gevonden of verlopen");
      }
      if (previewRow.status !== "active") {
        throw new Error("Preview is al verwerkt of geblokkeerd");
      }
      if (previewRow.createdByPersonId !== input.performedByPersonId) {
        throw new Error("Preview hoort niet bij deze gebruiker");
      }
      if (dayjs(previewRow.expiresAt).isBefore(dayjs())) {
        throw new Error("Preview verlopen — plak opnieuw");
      }

      const stored = previewRow.rowsParsed as {
        candidates: ParsedCandidate[];
        roles: ImportRoles;
      };
      const candidates = stored.candidates ?? [];
      const roles = stored.roles ?? ["student"];

      // GDPR re-check: every use_existing personId must currently belong to
      // the linked-active set for this location. The preview already filtered,
      // but we reverify in case the link was revoked between preview and
      // commit, and as defense-in-depth against crafted payloads.
      const useExistingPersonIds = Object.values(input.decisions)
        .filter(
          (d): d is { kind: "use_existing"; personId: string } =>
            d.kind === "use_existing",
        )
        .map((d) => d.personId);

      if (useExistingPersonIds.length > 0) {
        const allowed = await query
          .select({ personId: s.personLocationLink.personId })
          .from(s.personLocationLink)
          .where(
            and(
              eq(s.personLocationLink.locationId, previewRow.locationId),
              eq(s.personLocationLink.status, "linked"),
              inArray(s.personLocationLink.personId, useExistingPersonIds),
            ),
          );
        const allowedSet = new Set(allowed.map((r) => r.personId));
        const invalid = useExistingPersonIds.filter(
          (id) => !allowedSet.has(id),
        );
        if (invalid.length > 0) {
          throw new Error(
            `GDPR-grenscontrole afgewezen voor persoon ID(s): ${invalid.join(", ")}`,
          );
        }
      }

      // Race guard: re-run detection, compare against stored snapshot.
      const refreshedMatches =
        candidates.length > 0
          ? await findCandidateMatchesInLocation({
              locationId: previewRow.locationId,
              targetCohortId: previewRow.targetCohortId ?? undefined,
              candidates: candidates.map((c) => ({
                rowIndex: c.rowIndex,
                firstName: c.firstName,
                lastName: c.lastName,
                lastNamePrefix: c.lastNamePrefix,
                dateOfBirth: c.dateOfBirth,
                birthCity: c.birthCity,
                email: c.email,
              })),
            })
          : { matchesByRow: [], crossRowGroups: [] };

      const oldSnapshot = previewRow.detectionSnapshot as Record<
        string,
        DetectionSnapshotEntry
      >;
      const newSnapshot = buildDetectionSnapshot(refreshedMatches);

      if (snapshotsDiverge(oldSnapshot, newSnapshot)) {
        const nextAttempt = previewRow.attempt + 1;
        if (nextAttempt > 3) {
          await query
            .update(s.bulkImportPreview)
            .set({ status: "invalidated_max" })
            .where(eq(s.bulkImportPreview.token, previewRow.token));
          return {
            kind: "preview_invalidated_max" as const,
            message: "Roster veranderde te vaak — plak opnieuw",
          };
        }
        await query
          .update(s.bulkImportPreview)
          .set({
            attempt: nextAttempt,
            detectionSnapshot: newSnapshot,
          })
          .where(eq(s.bulkImportPreview.token, previewRow.token));
        return {
          kind: "preview_invalidated" as const,
          attempt: nextAttempt as 2 | 3,
          updatedMatches: refreshedMatches,
        };
      }

      // No race — apply decisions inside a transaction. Using READ
      // COMMITTED rather than the default SERIALIZABLE: the createPerson
      // callback creates a Supabase auth.users row on a separate
      // connection (via the admin API), and a SERIALIZABLE snapshot
      // can't see that row when the subsequent public.user FK check
      // runs — manifests as a "user_auth_user_id_fk" violation. Race-
      // safety here is already covered by (a) the preview-token
      // detection-snapshot check above and (b) DB unique constraints
      // on person_location_link / cohort_allocation that prevent
      // duplicate-link races at the DB level.
      const result = await withTransaction(
        async () => {
          const tx = useQuery();
          const createdPersonIds: string[] = [];
          const linkedPersonIds: string[] = [];

          // ── Pre-pass: assign personIds for every actionable row ──────
          //
          // Three sources:
          //   1. use_existing → personId is on the decision
          //   2. create_new with shareNewPersonWithGroup set → call
          //      createPerson ONCE per group, assign the result to every
          //      row in the group
          //   3. create_new without shareNewPersonWithGroup → call
          //      createPerson per row (different-people / ungrouped case)

          const personIdByRow = new Map<number, string>();
          const createdGroupPersonIds = new Map<string, string>();

          // First, handle shared-new-person groups.
          const rowsByGroup = new Map<string, number[]>();
          for (const candidate of candidates) {
            const decision = input.decisions[candidate.rowIndex.toString()];
            if (
              decision?.kind === "create_new" &&
              decision.shareNewPersonWithGroup
            ) {
              const key = decision.shareNewPersonWithGroup;
              if (!rowsByGroup.has(key)) rowsByGroup.set(key, []);
              // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
              rowsByGroup.get(key)!.push(candidate.rowIndex);
            }
          }

          for (const [groupKey, rowIndices] of rowsByGroup.entries()) {
            if (!input.createPerson) {
              throw new Error(
                "createPerson factory not provided — caller must supply it for create_new decisions",
              );
            }
            // Use the first row in the group as the representative person input.
            // The cross-row group means all rows are "the same person", so
            // any row's pasted data is acceptable; first wins for determinism.
            const representativeRow = candidates.find(
              (c) => c.rowIndex === rowIndices[0],
            );
            if (!representativeRow) {
              throw new Error(
                `Cross-row group ${groupKey} references row ${rowIndices[0]} which is missing from the preview`,
              );
            }
            const created = await input.createPerson({
              firstName: representativeRow.firstName,
              lastName: representativeRow.lastName,
              lastNamePrefix: representativeRow.lastNamePrefix,
              dateOfBirth: representativeRow.dateOfBirth,
              birthCity: representativeRow.birthCity,
              birthCountry: representativeRow.birthCountry,
              email: representativeRow.email,
            });
            createdGroupPersonIds.set(groupKey, created.personId);
            createdPersonIds.push(created.personId);
            for (const rowIndex of rowIndices) {
              personIdByRow.set(rowIndex, created.personId);
            }
          }

          // Then, ungrouped create_new + use_existing assignments.
          for (const candidate of candidates) {
            const rowIndex = candidate.rowIndex;
            if (personIdByRow.has(rowIndex)) continue;
            const decision = input.decisions[rowIndex.toString()];
            if (!decision || decision.kind === "skip") continue;
            if (decision.kind === "use_existing") {
              personIdByRow.set(rowIndex, decision.personId);
            } else if (decision.kind === "create_new") {
              // No group → per-row createPerson (operator declared "different
              // people" or this row is genuinely independent).
              if (!input.createPerson) {
                throw new Error(
                  "createPerson factory not provided — caller must supply it for create_new decisions",
                );
              }
              const created = await input.createPerson({
                firstName: candidate.firstName,
                lastName: candidate.lastName,
                lastNamePrefix: candidate.lastNamePrefix,
                dateOfBirth: candidate.dateOfBirth,
                birthCity: candidate.birthCity,
                birthCountry: candidate.birthCountry,
                email: candidate.email,
              });
              createdPersonIds.push(created.personId);
              personIdByRow.set(rowIndex, created.personId);
            }
          }

          // ── Main pass: link/actor/allocate per UNIQUE personId, audit per row ──
          //
          // Operations are deduplicated by personId so that 3 rows targeting
          // the same person produce 1 link + 1 actor per role + 1 cohort
          // allocation. Audit rows are still written per ORIGINAL pasted row
          // so the forensics trail captures every operator decision.

          const processedPersonIds = new Set<string>();
          // Cache resolved student-actor id per personId so we don't repeat
          // the lookup for every paste row that targets the same person.
          const studentActorIdByPersonId = new Map<string, string>();

          for (const candidate of candidates) {
            const rowIndex = candidate.rowIndex;
            const decision = input.decisions[rowIndex.toString()];
            if (!decision || decision.kind === "skip") continue;
            const targetPersonId = personIdByRow.get(rowIndex);
            if (!targetPersonId) continue;

            const candidateMatches =
              refreshedMatches.matchesByRow.find((m) => m.rowIndex === rowIndex)
                ?.candidates ?? [];
            const presentedIds = candidateMatches.map((c) => c.personId);

            // ── Per-personId work (link, actor) — runs ONCE per commit ──
            //
            // The Person, the location-link, and the per-role Actor row
            // are facts about the human, not the paste row. They're
            // idempotent in shape and de-duped here. Cohort allocations
            // are NOT in this block: each paste row is its own intent
            // ("Adam in optimist", "Adam in dinsdag") and gets its own
            // allocation below.
            if (!processedPersonIds.has(targetPersonId)) {
              if (decision.kind === "use_existing") {
                // linkToLocation throws on revoked/removed; defense-in-depth.
                await linkToLocation({
                  personId: targetPersonId,
                  locationId: previewRow.locationId,
                });
              }
              // For create_new the createPersonForLocation callback already
              // wired up the link via its existing semantics; nothing extra.

              for (const role of roles) {
                await tx
                  .insert(s.actor)
                  .values({
                    personId: targetPersonId,
                    locationId: previewRow.locationId,
                    type: role,
                  })
                  .onConflictDoUpdate({
                    target: [
                      s.actor.type,
                      s.actor.personId,
                      s.actor.locationId,
                    ],
                    set: { deletedAt: null, createdAt: sql`NOW()` },
                  });
              }

              if (previewRow.targetCohortId) {
                const studentActor = await tx
                  .select({ id: s.actor.id })
                  .from(s.actor)
                  .where(
                    and(
                      eq(s.actor.personId, targetPersonId),
                      eq(s.actor.locationId, previewRow.locationId),
                      eq(s.actor.type, "student"),
                      isNull(s.actor.deletedAt),
                    ),
                  )
                  .then(possibleSingleRow);
                if (studentActor) {
                  studentActorIdByPersonId.set(targetPersonId, studentActor.id);
                }
              }

              if (decision.kind === "use_existing") {
                linkedPersonIds.push(targetPersonId);
              }
              processedPersonIds.add(targetPersonId);
            }

            // ── Per-row cohort allocation ──
            //
            // Each paste row produces its own cohort_allocation, even
            // when multiple rows target the same person. The operator's
            // mental model: each row is one course / sub-group within
            // the cohort, and tags on that row describe THAT enrollment.
            // Three rows of Adam with three different Tag values →
            // 1 Person row, 1 Actor row, 3 cohort_allocations (each with
            // its own tags).
            //
            // PG treats NULL studentCurriculumId as distinct in the
            // partial unique index, so multiple NULL-curriculum
            // allocations per (cohort, actor) coexist by design.
            if (previewRow.targetCohortId) {
              const studentActorId =
                studentActorIdByPersonId.get(targetPersonId);
              if (studentActorId) {
                const rowTags =
                  input.tagsByRowIndex?.[rowIndex.toString()] ?? [];
                const cleanTags = (() => {
                  const seen = new Set<string>();
                  const out: string[] = [];
                  for (const t of rowTags) {
                    const trimmed = t.trim();
                    if (!trimmed) continue;
                    if (seen.has(trimmed)) continue;
                    seen.add(trimmed);
                    out.push(trimmed);
                  }
                  return out;
                })();
                await tx
                  .insert(s.cohortAllocation)
                  .values({
                    cohortId: previewRow.targetCohortId,
                    actorId: studentActorId,
                    ...(cleanTags.length > 0 ? { tags: cleanTags } : {}),
                  })
                  .onConflictDoNothing();
              }
            }

            // Audit per ORIGINAL row (every operator decision is captured).
            await tx.insert(s.personMergeAudit).values({
              performedByPersonId: input.performedByPersonId,
              locationId: previewRow.locationId,
              targetPersonId,
              decisionKind:
                decision.kind === "use_existing"
                  ? "use_existing"
                  : "create_new",
              presentedCandidatePersonIds:
                presentedIds.length > 0 ? presentedIds : null,
              source: "bulk_import_preview",
              bulkImportPreviewToken: previewRow.token,
            });
          }

          await tx
            .update(s.bulkImportPreview)
            .set({
              status: "committed",
              committedAt: sql`NOW()`,
            })
            .where(eq(s.bulkImportPreview.token, previewRow.token));

          return {
            kind: "committed" as const,
            createdPersonIds,
            linkedPersonIds,
          };
        },
        { isolationLevel: "read committed" },
      );

      return result;
    },
  ),
);

/**
 * Cleanup helper for the bulk_import_preview table. Called by the cron job:
 * deletes active rows past their TTL and committed/invalidated rows older
 * than 30 days (forensics window).
 *
 * Returns the count of deleted rows for telemetry.
 */
export const cleanupExpiredBulkImportPreviews = wrapCommand(
  "user.person.cleanupExpiredBulkImportPreviews",
  withZod(
    z.object({}).optional(),
    z.object({
      activeExpired: z.number().int(),
      historicalPurged: z.number().int(),
    }),
    async () => {
      const query = useQuery();

      const activeDeleted = await query
        .delete(s.bulkImportPreview)
        .where(
          and(
            eq(s.bulkImportPreview.status, "active"),
            sql`${s.bulkImportPreview.expiresAt} < NOW()`,
          ),
        )
        .returning({ token: s.bulkImportPreview.token });

      const historicalDeleted = await query
        .delete(s.bulkImportPreview)
        .where(
          and(
            inArray(s.bulkImportPreview.status, [
              "committed",
              "invalidated_max",
            ]),
            sql`${s.bulkImportPreview.createdAt} < NOW() - INTERVAL '30 days'`,
          ),
        )
        .returning({ token: s.bulkImportPreview.token });

      return {
        activeExpired: activeDeleted.length,
        historicalPurged: historicalDeleted.length,
      };
    },
  ),
);

/**
 * Operator-driven location link primitive used by the import preview commit
 * path. Differs from `createLocationLink` in policy: a previously revoked or
 * removed link is NEVER silently re-linked. Re-linking after a revoke is a
 * GDPR consent regression — the revoke was an active operator decision (or a
 * data-subject withdrawal). Operators must escalate to NWD/sysadmin for the
 * re-link, who handle it with proper consent record.
 *
 *   no existing link  → insert with status='linked'
 *   linked active     → no-op (idempotent)
 *   revoked / removed → THROW with operator-facing policy message
 */
export const linkToLocation = wrapCommand(
  "user.person.linkToLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      const existing = await query
        .select({ status: s.personLocationLink.status })
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.locationId, input.locationId),
          ),
        )
        .then(possibleSingleRow);

      if (existing?.status === "linked") {
        return;
      }

      if (existing?.status === "revoked" || existing?.status === "removed") {
        throw new Error(
          "Deze persoon was eerder verwijderd. Neem contact op met NWD om opnieuw toe te voegen.",
        );
      }

      await query.insert(s.personLocationLink).values({
        personId: input.personId,
        locationId: input.locationId,
        status: "linked",
        permissionLevel: "none",
      });

      return;
    },
  ),
);

/**
 * Score a set of pasted candidate rows against the operator's location's
 * linked-active persons. Returns matches grouped by row index plus the
 * cross-row groups (when ≥2 rows resolve to the same existing person above
 * threshold).
 *
 * The query is GDPR-scoped at the database level: only persons with
 * `personLocationLink.status='linked'` for `locationId` and `deletedAt IS NULL`
 * are scoreable. Operators do not see persons they shouldn't.
 *
 * Aggregates (cert count, last diploma date) are computed in the same SQL
 * via LEFT JOIN over already-matched persons — one round trip per call. The
 * full per-person history (cohort labels, certificate handles, etc.) is
 * fetched lazily by the UI's history side panel.
 */
export const findCandidateMatchesInLocation = wrapQuery(
  "user.person.findCandidateMatchesInLocation",
  withZod(
    z.object({
      locationId: uuidSchema,
      targetCohortId: uuidSchema.optional(),
      candidates: z
        .array(
          z.object({
            rowIndex: z.number().int().nonnegative(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            lastNamePrefix: z.string().nullable(),
            dateOfBirth: z.string(), // YYYY-MM-DD
            birthCity: z.string(),
            email: z.string().nullable(),
          }),
        )
        .max(200),
    }),
    z.object({
      matchesByRow: z.array(
        z.object({
          rowIndex: z.number().int(),
          candidates: z.array(
            z.object({
              personId: z.string().uuid(),
              score: z.number(),
              reasons: z.array(z.string()),
              firstName: z.string(),
              lastName: z.string().nullable(),
              lastNamePrefix: z.string().nullable(),
              dateOfBirth: z.string().nullable(),
              birthCity: z.string().nullable(),
              certificateCount: z.number().int(),
              lastDiplomaIssuedAt: z.string().nullable(),
              isAlreadyInTargetCohort: z.boolean(),
            }),
          ),
        }),
      ),
      crossRowGroups: z.array(
        z.object({
          rowIndices: z.array(z.number().int()),
          sharedCandidatePersonIds: z.array(z.string().uuid()),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();

      if (input.candidates.length === 0) {
        return { matchesByRow: [], crossRowGroups: [] };
      }

      // Build the VALUES list of pasted candidates for the CTE. Each row
      // becomes (row_index, first_name, last_name, last_name_prefix,
      // date_of_birth, birth_city). Email isn't used in scoring v1 (no userId
      // boost path) but kept available for future similarity work.
      const valuesRows = input.candidates.map(
        (c) =>
          sql`(${c.rowIndex}::int, ${c.firstName}::text, ${c.lastName}::text, ${c.lastNamePrefix}::text, ${c.dateOfBirth}::date, ${c.birthCity}::text)`,
      );

      const targetCohortFilter = input.targetCohortId
        ? sql`(
            SELECT EXISTS (
              SELECT 1
              FROM cohort_allocation ca
              INNER JOIN actor a ON a.id = ca.actor_id
              WHERE ca.cohort_id = ${input.targetCohortId}::uuid
                AND ca.deleted_at IS NULL
                AND a.deleted_at IS NULL
                AND a.person_id = lp.id
            )
          )`
        : sql`FALSE`;

      const NORMALIZE = (col: SQL) => sql`
        LOWER(REGEXP_REPLACE(COALESCE(${col}, ''), '[^[:alnum:]]+', '', 'g'))
      `;

      const stmt = sql`
        WITH pasted AS (
          SELECT
            v.row_index,
            v.first_name AS raw_first_name,
            v.last_name AS raw_last_name,
            v.last_name_prefix AS raw_last_name_prefix,
            v.date_of_birth AS dob,
            v.birth_city AS raw_birth_city,
            ${NORMALIZE(sql`v.first_name`)} AS first_norm,
            ${NORMALIZE(sql`v.last_name`)} AS last_norm,
            ${NORMALIZE(
              sql`TRIM(CONCAT(
                COALESCE(v.last_name_prefix, ''),
                CASE WHEN v.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(v.last_name, '')
              ))`,
            )} AS full_last_norm,
            ${NORMALIZE(sql`v.birth_city`)} AS birth_city_norm,
            NULL::uuid AS user_id
          FROM (VALUES ${sql.join(valuesRows, sql`, `)})
            AS v(row_index, first_name, last_name, last_name_prefix, date_of_birth, birth_city)
        ),
        location_persons AS (
          SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.last_name_prefix,
            p.date_of_birth,
            p.birth_city,
            p.user_id,
            ${NORMALIZE(sql`p.first_name`)} AS first_norm,
            ${NORMALIZE(sql`p.last_name`)} AS last_norm,
            ${NORMALIZE(
              sql`TRIM(CONCAT(
                COALESCE(p.last_name_prefix, ''),
                CASE WHEN p.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(p.last_name, '')
              ))`,
            )} AS full_last_norm,
            ${NORMALIZE(sql`p.birth_city`)} AS birth_city_norm
          FROM person p
          INNER JOIN person_location_link pll
            ON pll.person_id = p.id
          WHERE pll.location_id = ${input.locationId}::uuid
            AND pll.status = 'linked'
            AND p.deleted_at IS NULL
            AND p.first_name IS NOT NULL
        ),
        scored AS (
          SELECT
            pa.row_index,
            lp.id AS person_id,
            lp.first_name,
            lp.last_name,
            lp.last_name_prefix,
            lp.date_of_birth::text AS date_of_birth,
            lp.birth_city,
            -- Use the name+birth scoring branch: pasted candidates have no
            -- user_id, so the same-user branch is never applicable.
            ${DuplicateScoring.scoreNameBirthPair(
              {
                firstNorm: sql`pa.first_norm`,
                lastNorm: sql`pa.last_norm`,
                fullLastNorm: sql`pa.full_last_norm`,
                dateOfBirth: sql`pa.dob`,
                birthCityNorm: sql`pa.birth_city_norm`,
                userId: sql`pa.user_id`,
              },
              {
                firstNorm: sql`lp.first_norm`,
                lastNorm: sql`lp.last_norm`,
                fullLastNorm: sql`lp.full_last_norm`,
                dateOfBirth: sql`lp.date_of_birth`,
                birthCityNorm: sql`lp.birth_city_norm`,
                userId: sql`lp.user_id`,
              },
            )} AS score,
            ARRAY_REMOVE(ARRAY[
              CASE WHEN pa.first_norm <> '' AND pa.first_norm = lp.first_norm
                   THEN 'zelfde voornaam' END,
              CASE WHEN (pa.full_last_norm <> '' AND pa.full_last_norm = lp.full_last_norm)
                       OR (pa.last_norm <> '' AND pa.last_norm = lp.last_norm)
                   THEN 'zelfde achternaam' END,
              CASE WHEN pa.dob IS NOT NULL AND lp.date_of_birth IS NOT NULL
                       AND pa.dob = lp.date_of_birth
                   THEN 'zelfde geboortedatum'
                   WHEN pa.dob IS NOT NULL AND lp.date_of_birth IS NOT NULL
                       AND ABS(pa.dob - lp.date_of_birth) <= 7
                   THEN 'geboortedatum binnen een week' END,
              CASE WHEN pa.birth_city_norm <> ''
                       AND pa.birth_city_norm = lp.birth_city_norm
                   THEN 'zelfde geboorteplaats' END
            ], NULL) AS reasons,
            ${targetCohortFilter} AS is_already_in_target_cohort
          FROM pasted pa
          INNER JOIN location_persons lp
            -- Prefilter MUST mirror the pair-finder's join: name signal AND
            -- last-name signal AND DOB-within-year. Without all three the
            -- scoreNameBirthPair formula's last-name "fallback 50" falsely
            -- gives 100+ to pairs that share only a birth city, and
            -- non-matches (e.g. Lars Peters appearing under Adam de Vries
            -- because both live in Amsterdam) leak into the preview.
            ON (
              pa.first_norm <> ''
              AND (
                pa.first_norm = lp.first_norm
                OR (LENGTH(pa.first_norm) >= 3
                    AND LENGTH(lp.first_norm) >= 3
                    AND LEFT(pa.first_norm, 3) = LEFT(lp.first_norm, 3))
              )
              AND (
                (pa.full_last_norm <> '' AND pa.full_last_norm = lp.full_last_norm)
                OR (pa.last_norm <> '' AND pa.last_norm = lp.last_norm)
              )
              AND pa.dob IS NOT NULL
              AND lp.date_of_birth IS NOT NULL
              AND ABS(pa.dob - lp.date_of_birth) <= 365
            )
        ),
        person_aggregates AS (
          SELECT
            sc.person_id,
            COUNT(DISTINCT cert.id) FILTER (
              WHERE cert.deleted_at IS NULL AND cert.issued_at IS NOT NULL
            )::int AS certificate_count,
            MAX(cert.issued_at) FILTER (
              WHERE cert.deleted_at IS NULL AND cert.issued_at IS NOT NULL
            ) AS last_diploma_issued_at
          FROM scored sc
          LEFT JOIN student_curriculum scur ON scur.person_id = sc.person_id
          LEFT JOIN certificate cert ON cert.student_curriculum_id = scur.id
          GROUP BY sc.person_id
        )
        SELECT
          scored.row_index,
          scored.person_id,
          scored.first_name,
          scored.last_name,
          scored.last_name_prefix,
          scored.date_of_birth,
          scored.birth_city,
          scored.score::int AS score,
          scored.reasons,
          scored.is_already_in_target_cohort,
          COALESCE(agg.certificate_count, 0)::int AS certificate_count,
          agg.last_diploma_issued_at
        FROM scored
        LEFT JOIN person_aggregates agg ON agg.person_id = scored.person_id
        WHERE scored.score >= ${DuplicateScoring.SCORE_THRESHOLDS.weak}
        ORDER BY scored.row_index ASC, scored.score DESC, scored.person_id ASC
      `;

      const result = await query.execute(stmt);
      type Row = {
        row_index: number;
        person_id: string;
        first_name: string;
        last_name: string | null;
        last_name_prefix: string | null;
        date_of_birth: string | null;
        birth_city: string | null;
        score: number;
        reasons: string[];
        is_already_in_target_cohort: boolean;
        certificate_count: number;
        last_diploma_issued_at: string | null;
      };
      const rows = result.rows as unknown as Row[];

      const byRow = new Map<
        number,
        Array<{
          personId: string;
          score: number;
          reasons: string[];
          firstName: string;
          lastName: string | null;
          lastNamePrefix: string | null;
          dateOfBirth: string | null;
          birthCity: string | null;
          certificateCount: number;
          lastDiplomaIssuedAt: string | null;
          isAlreadyInTargetCohort: boolean;
        }>
      >();

      for (const r of rows) {
        if (!byRow.has(r.row_index)) {
          byRow.set(r.row_index, []);
        }
        // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
        byRow.get(r.row_index)!.push({
          personId: r.person_id,
          score: Number(r.score),
          reasons: r.reasons ?? [],
          firstName: r.first_name,
          lastName: r.last_name,
          lastNamePrefix: r.last_name_prefix,
          dateOfBirth: r.date_of_birth,
          birthCity: r.birth_city,
          certificateCount: Number(r.certificate_count),
          lastDiplomaIssuedAt: r.last_diploma_issued_at,
          isAlreadyInTargetCohort: r.is_already_in_target_cohort,
        });
      }

      // ── Paste-vs-paste similarity detection ────────────────────────
      //
      // The above query catches rows that match the SAME existing person.
      // It misses the equally-important case: 2+ pasted rows that look like
      // each other but no existing person matches (e.g., operator pasted
      // brand-new Adam three times). Without this pass, all three rows
      // would default to "create new" and produce three duplicate Person
      // records — exactly the bug this whole flow is supposed to prevent.

      const pastePairsStmt = sql`
        WITH pasted AS (
          SELECT
            v.row_index,
            ${NORMALIZE(sql`v.first_name`)} AS first_norm,
            ${NORMALIZE(sql`v.last_name`)} AS last_norm,
            ${NORMALIZE(
              sql`TRIM(CONCAT(
                COALESCE(v.last_name_prefix, ''),
                CASE WHEN v.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(v.last_name, '')
              ))`,
            )} AS full_last_norm,
            v.date_of_birth AS dob,
            ${NORMALIZE(sql`v.birth_city`)} AS birth_city_norm,
            NULL::uuid AS user_id
          FROM (VALUES ${sql.join(valuesRows, sql`, `)})
            AS v(row_index, first_name, last_name, last_name_prefix, date_of_birth, birth_city)
        )
        SELECT
          p1.row_index AS row_index_a,
          p2.row_index AS row_index_b,
          ${DuplicateScoring.scoreNameBirthPair(
            {
              firstNorm: sql`p1.first_norm`,
              lastNorm: sql`p1.last_norm`,
              fullLastNorm: sql`p1.full_last_norm`,
              dateOfBirth: sql`p1.dob`,
              birthCityNorm: sql`p1.birth_city_norm`,
              userId: sql`p1.user_id`,
            },
            {
              firstNorm: sql`p2.first_norm`,
              lastNorm: sql`p2.last_norm`,
              fullLastNorm: sql`p2.full_last_norm`,
              dateOfBirth: sql`p2.dob`,
              birthCityNorm: sql`p2.birth_city_norm`,
              userId: sql`p2.user_id`,
            },
          )}::int AS score
        FROM pasted p1
        JOIN pasted p2
          ON p1.row_index < p2.row_index
          AND p1.first_norm <> ''
          AND (
            p1.first_norm = p2.first_norm
            OR (LENGTH(p1.first_norm) >= 3
                AND LENGTH(p2.first_norm) >= 3
                AND LEFT(p1.first_norm, 3) = LEFT(p2.first_norm, 3))
          )
          -- Last-name signal required for the same reason as the
          -- existing-match prefilter: scoreNameBirthPair's fallback 50
          -- otherwise gives 100+ to two unrelated people sharing only a
          -- birth city and a close DOB.
          AND (
            (p1.full_last_norm <> '' AND p1.full_last_norm = p2.full_last_norm)
            OR (p1.last_norm <> '' AND p1.last_norm = p2.last_norm)
          )
          AND p1.dob IS NOT NULL
          AND p2.dob IS NOT NULL
          AND ABS(p1.dob - p2.dob) <= 365
        WHERE
          ${DuplicateScoring.scoreNameBirthPair(
            {
              firstNorm: sql`p1.first_norm`,
              lastNorm: sql`p1.last_norm`,
              fullLastNorm: sql`p1.full_last_norm`,
              dateOfBirth: sql`p1.dob`,
              birthCityNorm: sql`p1.birth_city_norm`,
              userId: sql`p1.user_id`,
            },
            {
              firstNorm: sql`p2.first_norm`,
              lastNorm: sql`p2.last_norm`,
              fullLastNorm: sql`p2.full_last_norm`,
              dateOfBirth: sql`p2.dob`,
              birthCityNorm: sql`p2.birth_city_norm`,
              userId: sql`p2.user_id`,
            },
          )} >= ${DuplicateScoring.SCORE_THRESHOLDS.strong}
      `;

      const pasteEdges =
        input.candidates.length >= 2
          ? ((await query.execute(pastePairsStmt)).rows as unknown as {
              row_index_a: number;
              row_index_b: number;
              score: number;
            }[])
          : [];

      // ── Cross-row group detection (union-find over both edge sources) ──
      //
      // A "cross-row group" is a connected component of pasted rows where
      // each pair is linked by either:
      //   (a) sharing a strong-match (≥150) against the same existing
      //       person, OR
      //   (b) directly scoring ≥150 against each other (paste-vs-paste).
      //
      // The default UX is "treat as the same person" — link all rows in
      // the group to one personId (existing or newly created). The operator
      // can override per-row if they're genuinely different people (twins).

      const parent = new Map<number, number>();
      const find = (x: number): number => {
        let root = x;
        while (parent.get(root) !== root) {
          // biome-ignore lint/style/noNonNullAssertion: ensured by ensure() below
          root = parent.get(root)!;
        }
        let cur = x;
        while (cur !== root) {
          // biome-ignore lint/style/noNonNullAssertion: ensured by ensure() below
          const next = parent.get(cur)!;
          parent.set(cur, root);
          cur = next;
        }
        return root;
      };
      const union = (a: number, b: number) => {
        const ra = find(a);
        const rb = find(b);
        if (ra !== rb) parent.set(ra, rb);
      };
      const ensure = (x: number) => {
        if (!parent.has(x)) parent.set(x, x);
      };

      // Edges from existing-person matches: rows sharing a strong-match
      // existing personId.
      const personToRows = new Map<string, number[]>();
      for (const [rowIndex, candidates] of byRow.entries()) {
        for (const c of candidates) {
          if (c.score < DuplicateScoring.SCORE_THRESHOLDS.strong) continue;
          ensure(rowIndex);
          if (!personToRows.has(c.personId)) {
            personToRows.set(c.personId, []);
          }
          // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
          personToRows.get(c.personId)!.push(rowIndex);
        }
      }
      for (const rowIndices of personToRows.values()) {
        for (let i = 1; i < rowIndices.length; i++) {
          // biome-ignore lint/style/noNonNullAssertion: bounded by length
          union(rowIndices[0]!, rowIndices[i]!);
        }
      }

      // Edges from paste-vs-paste similarity.
      for (const edge of pasteEdges) {
        ensure(edge.row_index_a);
        ensure(edge.row_index_b);
        union(edge.row_index_a, edge.row_index_b);
      }

      // Build group descriptors: connected components with ≥2 rows.
      const componentToRows = new Map<number, Set<number>>();
      for (const rowIndex of parent.keys()) {
        const root = find(rowIndex);
        if (!componentToRows.has(root)) {
          componentToRows.set(root, new Set());
        }
        // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
        componentToRows.get(root)!.add(rowIndex);
      }

      const groups: Array<{
        rowIndices: number[];
        sharedCandidatePersonIds: string[];
      }> = [];
      for (const memberSet of componentToRows.values()) {
        if (memberSet.size < 2) continue;
        const rowIndices = [...memberSet].sort((a, b) => a - b);
        // Collect all strong-match existing personIds across the group's
        // rows (deduplicated). Empty array when this is a paste-only group
        // (no existing match — operator just typed the same person twice).
        const sharedIds = new Set<string>();
        for (const rowIndex of rowIndices) {
          const candidates = byRow.get(rowIndex) ?? [];
          for (const c of candidates) {
            if (c.score < DuplicateScoring.SCORE_THRESHOLDS.strong) continue;
            sharedIds.add(c.personId);
          }
        }
        groups.push({
          rowIndices,
          sharedCandidatePersonIds: [...sharedIds].sort(),
        });
      }

      const matchesByRow = Array.from(byRow.entries())
        .map(([rowIndex, candidates]) => ({ rowIndex, candidates }))
        .sort((a, b) => a.rowIndex - b.rowIndex);

      return { matchesByRow, crossRowGroups: groups };
    },
  ),
);

export const isLinkedToLocation = wrapQuery(
  "user.person.isLinkedToLocation",
  withZod(
    z.object({ personId: uuidSchema, locationId: uuidSchema }),
    z.boolean(),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select()
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.locationId, input.locationId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(possibleSingleRow);

      return result !== null;
    },
  ),
);

export const byIdOrHandle = wrapQuery(
  "user.person.byIdOrHandle",
  withZod(
    z.union([z.object({ id: uuidSchema }), z.object({ handle: z.string() })]),
    personSchema,
    async (input) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [isNull(s.person.deletedAt)];

      if ("id" in input) {
        whereClausules.push(eq(s.person.id, input.id));
      }

      if ("handle" in input) {
        whereClausules.push(eq(s.person.handle, input.handle));
      }

      const res = await query
        .select({
          ...getTableColumns(s.person),
          email: s.user.email,
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .where(and(...whereClausules))
        .then((rows) => {
          const result = singleRow(rows);
          if (result.birthCountry?.code === null) {
            return {
              ...result,
              birthCountry: null,
            };
          }
          return result;
        });

      return {
        ...res,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: res.handle!,
        createdAt: dayjs(res.createdAt).toISOString(),
        updatedAt: dayjs(res.updatedAt).toISOString(),
      };
    },
  ),
);

export const list = wrapQuery(
  "user.person.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            userId: singleOrArray(uuidSchema).optional(),
            personId: singleOrArray(uuidSchema).optional(),
            locationId: singleOrArray(uuidSchema).optional(),
            actorType: singleOrArray(
              z.enum([
                "student",
                "instructor",
                "location_admin",
                "pvb_beoordelaar",
              ]),
            ).optional(),
            q: z.string().optional(),
          })
          .default({}),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().default(0),
      })
      .default({}),
    z.object({
      items: personSchema
        .extend({
          actors: z
            .object({
              id: uuidSchema,
              createdAt: z.string(),
              type: z.enum([
                "student",
                "instructor",
                "location_admin",
                "system",
                "pvb_beoordelaar",
                "secretariaat",
              ]),
              locationId: uuidSchema.nullable(),
            })
            .array(),
        })
        .array(),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive().nullable(),
      offset: z.number().int().nonnegative(),
    }),
    async ({ filter, limit, offset }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        filter.userId
          ? Array.isArray(filter.userId)
            ? inArray(s.person.userId, filter.userId)
            : eq(s.person.userId, filter.userId)
          : undefined,
        filter.personId
          ? Array.isArray(filter.personId)
            ? inArray(s.person.id, filter.personId)
            : eq(s.person.id, filter.personId)
          : undefined,
        filter.actorType
          ? Array.isArray(filter.actorType)
            ? and(
                inArray(s.actor.type, filter.actorType),
                isNull(s.actor.deletedAt),
              )
            : and(eq(s.actor.type, filter.actorType), isNull(s.actor.deletedAt))
          : undefined,
        filter.q
          ? sql`
              (
                setweight(to_tsvector('simple', 
                  COALESCE(${s.user.email}, '')
                ), 'A') ||
                setweight(to_tsvector('simple', 
                  COALESCE(split_part(${s.user.email}, '@', 1), '')
                ), 'B') ||
                setweight(to_tsvector('simple', 
                  COALESCE(split_part(${s.user.email}, '@', 2), '')
                ), 'C') ||
                setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
                setweight(to_tsvector('simple', 
                  COALESCE(${s.person.firstName}, '') || ' ' || 
                  COALESCE(${s.person.lastNamePrefix}, '') || ' ' || 
                  COALESCE(${s.person.lastName}, '')
                ), 'A')
              ) @@ to_tsquery('simple', ${formatSearchTerms(filter.q, "and")})
            `
          : undefined,
        isNull(s.person.deletedAt),
      ];

      if (filter.locationId) {
        if (Array.isArray(filter.locationId)) {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                inArray(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        } else {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                eq(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        }
      }

      const personCountQuery = query
        .select({ count: countDistinct(s.person.id) })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .then(singleRow);

      const personQuery = query
        .select({
          ...getTableColumns(s.person),
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
          email: s.user.email,
          actor: s.actor,
        })
        .from(s.person)
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .$dynamic();

      const [{ count }, persons] = await Promise.all([
        personCountQuery,
        withLimitOffset(personQuery, limit, offset).then(
          aggregate({ pkey: "id", fields: { actors: "actor.id" } }),
        ),
      ]);

      if (persons.length === 0) {
        return {
          items: [],
          count,
          limit: limit ?? null,
          offset,
        };
      }

      return {
        items: persons.map((person) => ({
          ...person,
          // biome-ignore lint/style/noNonNullAssertion: intentional
          handle: person.handle!,
          createdAt: dayjs(person.createdAt).toISOString(),
          updatedAt: dayjs(person.updatedAt).toISOString(),
        })),
        count,
        limit: limit ?? null,
        offset,
      };
    },
  ),
);

export const searchForAutocomplete = wrapQuery(
  "user.person.searchForAutocomplete",
  withZod(
    z.object({
      q: z.string().min(1),
      limit: z.number().int().positive().default(10),
      excludePersonId: uuidSchema.optional(),
    }),
    z.array(
      personSchema.pick({
        id: true,
        handle: true,
        firstName: true,
        lastNamePrefix: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        userId: true,
        isPrimary: true,
      }),
    ),
    async ({ q, limit, excludePersonId }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        sql`
          (
            setweight(to_tsvector('simple', 
              COALESCE(${s.user.email}, '')
            ), 'A') ||
            setweight(to_tsvector('simple', 
              COALESCE(split_part(${s.user.email}, '@', 1), '')
            ), 'B') ||
            setweight(to_tsvector('simple', 
              COALESCE(split_part(${s.user.email}, '@', 2), '')
            ), 'C') ||
            setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
            setweight(to_tsvector('simple', 
              COALESCE(${s.person.firstName}, '') || ' ' || 
              COALESCE(${s.person.lastNamePrefix}, '') || ' ' || 
              COALESCE(${s.person.lastName}, '')
            ), 'A')
          ) @@ to_tsquery('simple', ${formatSearchTerms(q, "and")})
        `,
        isNull(s.person.deletedAt),
        excludePersonId ? ne(s.person.id, excludePersonId) : undefined,
      ];

      const persons = await query
        .select({
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          email: s.user.email,
          dateOfBirth: s.person.dateOfBirth,
          userId: s.person.userId,
          isPrimary: s.person.isPrimary,
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .where(and(...whereClausules))
        .limit(limit);

      return persons.map((person) => ({
        ...person,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: person.handle!,
      }));
    },
  ),
);

// Location-scoped autocomplete search. Identical to searchForAutocomplete
// but constrained to persons with an active personLocationLink for the
// given location. Used by operator-facing merge flows where GDPR
// enforces location boundary.
export const searchForAutocompleteInLocation = wrapQuery(
  "user.person.searchForAutocompleteInLocation",
  withZod(
    z.object({
      q: z.string().min(1),
      locationId: uuidSchema,
      limit: z.number().int().positive().default(10),
      excludePersonId: uuidSchema.optional(),
    }),
    z.array(
      personSchema.pick({
        id: true,
        handle: true,
        firstName: true,
        lastNamePrefix: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        userId: true,
        isPrimary: true,
      }),
    ),
    async ({ q, locationId, limit, excludePersonId }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        sql`
          (
            setweight(to_tsvector('simple',
              COALESCE(${s.user.email}, '')
            ), 'A') ||
            setweight(to_tsvector('simple',
              COALESCE(split_part(${s.user.email}, '@', 1), '')
            ), 'B') ||
            setweight(to_tsvector('simple',
              COALESCE(split_part(${s.user.email}, '@', 2), '')
            ), 'C') ||
            setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
            setweight(to_tsvector('simple',
              COALESCE(${s.person.firstName}, '') || ' ' ||
              COALESCE(${s.person.lastNamePrefix}, '') || ' ' ||
              COALESCE(${s.person.lastName}, '')
            ), 'A')
          ) @@ to_tsquery('simple', ${formatSearchTerms(q, "and")})
        `,
        isNull(s.person.deletedAt),
        excludePersonId ? ne(s.person.id, excludePersonId) : undefined,
        eq(s.personLocationLink.locationId, locationId),
        eq(s.personLocationLink.status, "linked"),
      ];

      const persons = await query
        .select({
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          email: s.user.email,
          dateOfBirth: s.person.dateOfBirth,
          userId: s.person.userId,
          isPrimary: s.person.isPrimary,
        })
        .from(s.person)
        .innerJoin(
          s.personLocationLink,
          eq(s.personLocationLink.personId, s.person.id),
        )
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .where(and(...whereClausules))
        .limit(limit);

      return persons.map((person) => ({
        ...person,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: person.handle!,
      }));
    },
  ),
);

// List duplicate-pair candidates within a single location. Reuses the
// pair-finder algorithm via shared scoring fragments. Operator-facing —
// scope is enforced via personLocationLink linked-active. Optionally
// further constrained to persons allocated to a specific cohort.
export const listDuplicatePairsInLocation = wrapQuery(
  "user.person.listDuplicatePairsInLocation",
  withZod(
    z.object({
      locationId: uuidSchema,
      // When set, only pairs where BOTH persons are allocated to this
      // cohort are returned. Drives the cohort-banner "duplicates in
      // this cohort" surface.
      cohortId: uuidSchema.optional(),
      threshold: z
        .number()
        .int()
        .min(0)
        .default(DuplicateScoring.DEFAULT_ANALYZE_THRESHOLD),
      limit: z.number().int().positive().max(500).default(200),
    }),
    z.array(
      z.object({
        score: z.number().int(),
        primary: z.object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          lastName: z.string().nullable(),
          dateOfBirth: z.string().nullable(),
          email: z.string().nullable(),
          isPrimary: z.boolean(),
          createdAt: z.string(),
        }),
        duplicate: z.object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          lastName: z.string().nullable(),
          dateOfBirth: z.string().nullable(),
          email: z.string().nullable(),
          isPrimary: z.boolean(),
          createdAt: z.string(),
        }),
      }),
    ),
    async ({ locationId, cohortId, threshold, limit }) => {
      const query = useQuery();

      const NORM = (col: SQL) => sql`
        LOWER(REGEXP_REPLACE(COALESCE(${col}, ''), '[^[:alnum:]]+', '', 'g'))
      `;

      const cohortFilter = cohortId
        ? sql`AND EXISTS (
            SELECT 1
            FROM cohort_allocation ca
            INNER JOIN actor a ON a.id = ca.actor_id
            WHERE ca.cohort_id = ${cohortId}::uuid
              AND ca.deleted_at IS NULL
              AND a.deleted_at IS NULL
              AND a.person_id = p.id
          )`
        : sql``;

      const stmt = sql`
        WITH location_persons AS (
          SELECT
            p.id, p.handle, p.first_name, p.last_name, p.last_name_prefix,
            p.date_of_birth, p.birth_city, p.is_primary, p.created_at,
            p.user_id, u.email,
            ${NORM(sql`p.first_name`)} AS first_norm,
            ${NORM(sql`p.last_name`)} AS last_norm,
            ${NORM(
              sql`TRIM(CONCAT(
                COALESCE(p.last_name_prefix, ''),
                CASE WHEN p.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(p.last_name, '')
              ))`,
            )} AS full_last_norm,
            ${NORM(sql`p.birth_city`)} AS birth_city_norm
          FROM person p
          INNER JOIN person_location_link pll
            ON pll.person_id = p.id
          LEFT JOIN "user" u ON p.user_id = u.auth_user_id
          WHERE pll.location_id = ${locationId}::uuid
            AND pll.status = 'linked'
            AND p.deleted_at IS NULL
            AND p.first_name IS NOT NULL
            ${cohortFilter}
        ),
        same_user_pairs AS (
          SELECT
            p1.id AS id1, p1.first_name AS fn1, p1.last_name AS ln1,
            p1.last_name_prefix AS lnp1, p1.date_of_birth::text AS dob1,
            p1.email AS email1, p1.is_primary AS prim1,
            p1.created_at AS created_at1,
            p2.id AS id2, p2.first_name AS fn2, p2.last_name AS ln2,
            p2.last_name_prefix AS lnp2, p2.date_of_birth::text AS dob2,
            p2.email AS email2, p2.is_primary AS prim2,
            p2.created_at AS created_at2,
            ${DuplicateScoring.scoreSameUserPair(
              {
                firstNorm: sql`p1.first_norm`,
                lastNorm: sql`p1.last_norm`,
                fullLastNorm: sql`p1.full_last_norm`,
                dateOfBirth: sql`p1.date_of_birth`,
                birthCityNorm: sql`p1.birth_city_norm`,
                userId: sql`p1.user_id`,
              },
              {
                firstNorm: sql`p2.first_norm`,
                lastNorm: sql`p2.last_norm`,
                fullLastNorm: sql`p2.full_last_norm`,
                dateOfBirth: sql`p2.date_of_birth`,
                birthCityNorm: sql`p2.birth_city_norm`,
                userId: sql`p2.user_id`,
              },
            )}::int AS score
          FROM location_persons p1
          INNER JOIN location_persons p2
            ON p1.id < p2.id
            AND p1.user_id IS NOT NULL
            AND p1.user_id = p2.user_id
            AND (
              p1.first_norm = p2.first_norm
              OR (LENGTH(p1.first_norm) >= 3
                  AND LENGTH(p2.first_norm) >= 3
                  AND LEFT(p1.first_norm, 3) = LEFT(p2.first_norm, 3))
            )
        ),
        name_birth_pairs AS (
          SELECT
            p1.id AS id1, p1.first_name AS fn1, p1.last_name AS ln1,
            p1.last_name_prefix AS lnp1, p1.date_of_birth::text AS dob1,
            p1.email AS email1, p1.is_primary AS prim1,
            p1.created_at AS created_at1,
            p2.id AS id2, p2.first_name AS fn2, p2.last_name AS ln2,
            p2.last_name_prefix AS lnp2, p2.date_of_birth::text AS dob2,
            p2.email AS email2, p2.is_primary AS prim2,
            p2.created_at AS created_at2,
            ${DuplicateScoring.scoreNameBirthPair(
              {
                firstNorm: sql`p1.first_norm`,
                lastNorm: sql`p1.last_norm`,
                fullLastNorm: sql`p1.full_last_norm`,
                dateOfBirth: sql`p1.date_of_birth`,
                birthCityNorm: sql`p1.birth_city_norm`,
                userId: sql`p1.user_id`,
              },
              {
                firstNorm: sql`p2.first_norm`,
                lastNorm: sql`p2.last_norm`,
                fullLastNorm: sql`p2.full_last_norm`,
                dateOfBirth: sql`p2.date_of_birth`,
                birthCityNorm: sql`p2.birth_city_norm`,
                userId: sql`p2.user_id`,
              },
            )}::int AS score
          FROM location_persons p1
          INNER JOIN location_persons p2
            ON p1.id < p2.id
            AND p1.first_norm <> ''
            AND p1.first_norm = p2.first_norm
            AND (
              p1.full_last_norm <> '' AND p1.full_last_norm = p2.full_last_norm
              OR p1.last_norm <> '' AND p1.last_norm = p2.last_norm
            )
            AND p1.date_of_birth IS NOT NULL
            AND p2.date_of_birth IS NOT NULL
            AND ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 365
            AND (p1.user_id IS NULL OR p2.user_id IS NULL OR p1.user_id <> p2.user_id)
        ),
        all_pairs AS (
          SELECT * FROM same_user_pairs
          UNION ALL
          SELECT * FROM name_birth_pairs
        ),
        ranked AS (
          SELECT
            *,
            ROW_NUMBER() OVER (
              PARTITION BY LEAST(id1, id2), GREATEST(id1, id2)
              ORDER BY score DESC
            ) AS pair_rank
          FROM all_pairs
          WHERE score >= ${threshold}
        )
        SELECT *
        FROM ranked
        WHERE pair_rank = 1
        ORDER BY score DESC, created_at1 ASC
        LIMIT ${limit}
      `;

      const result = await query.execute(stmt);
      type Row = {
        id1: string;
        fn1: string | null;
        ln1: string | null;
        lnp1: string | null;
        dob1: string | null;
        email1: string | null;
        prim1: boolean;
        created_at1: string;
        id2: string;
        fn2: string | null;
        ln2: string | null;
        lnp2: string | null;
        dob2: string | null;
        email2: string | null;
        prim2: boolean;
        created_at2: string;
        score: number;
      };
      const rows = result.rows as unknown as Row[];

      // Convention: sort the pair so the "primary" candidate is the one
      // most likely to be kept in a merge. Primary > userId > older.
      return rows.map((r) => {
        const pickPrimary = (): "1" | "2" => {
          if (r.prim1 && !r.prim2) return "1";
          if (!r.prim1 && r.prim2) return "2";
          if (r.email1 && !r.email2) return "1";
          if (!r.email1 && r.email2) return "2";
          return new Date(r.created_at1).getTime() <=
            new Date(r.created_at2).getTime()
            ? "1"
            : "2";
        };
        const which = pickPrimary();
        const a = which === "1" ? r : flipSides(r);
        return {
          score: Number(r.score),
          primary: {
            id: a.id1,
            firstName: a.fn1,
            lastNamePrefix: a.lnp1,
            lastName: a.ln1,
            dateOfBirth: a.dob1,
            email: a.email1,
            isPrimary: a.prim1,
            createdAt: a.created_at1,
          },
          duplicate: {
            id: a.id2,
            firstName: a.fn2,
            lastNamePrefix: a.lnp2,
            lastName: a.ln2,
            dateOfBirth: a.dob2,
            email: a.email2,
            isPrimary: a.prim2,
            createdAt: a.created_at2,
          },
        };
      });
    },
  ),
);

function flipSides<R extends Record<string, unknown>>(r: R): R {
  const next: Record<string, unknown> = { ...r };
  for (const k of Object.keys(r)) {
    if (k.endsWith("1")) {
      const k2 = `${k.slice(0, -1)}2`;
      next[k] = (r as Record<string, unknown>)[k2];
      next[k2] = (r as Record<string, unknown>)[k];
    }
  }
  return next as R;
}

// Verify a personId is in the operator's GDPR scope (linked-active to the
// given location). Helper used by operator merge actions for defense-in-
// depth — the underlying mergePersons engine doesn't enforce scope, so the
// action must.
export const isInLocationScope = wrapQuery(
  "user.person.isInLocationScope",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.boolean(),
    async ({ personId, locationId }) => {
      const query = useQuery();
      const result = await query
        .select({ id: s.personLocationLink.personId })
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, personId),
            eq(s.personLocationLink.locationId, locationId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .limit(1);
      return result.length > 0;
    },
  ),
);

export const listLocationsByRole = wrapQuery(
  "user.person.listLocationsByRole",
  withZod(
    z.object({
      personId: uuidSchema,
      roles: z
        .array(z.enum(["student", "instructor", "location_admin"]))
        .default(["instructor", "student", "location_admin"]),
    }),
    z.array(
      z.object({
        locationId: uuidSchema,
        roles: z.array(z.enum(["student", "instructor", "location_admin"])),
      }),
    ),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select({
          locationId: s.personLocationLink.locationId,
          role: s.actor.type,
        })
        .from(s.personLocationLink)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.personLocationLink.personId),
            eq(s.actor.locationId, s.personLocationLink.locationId),
            isNull(s.actor.deletedAt),
            inArray(s.actor.type, input.roles),
          ),
        )
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(aggregate({ pkey: "locationId", fields: { roles: "role" } }));

      // biome-ignore lint/suspicious/noExplicitAny: intentional
      return result as any;
    },
  ),
);

export const setPrimary = wrapCommand(
  "user.person.setPrimary",
  withZod(
    z.object({
      personId: uuidSchema,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const result = await query
        .update(s.person)
        .set({
          isPrimary: true,
          updatedAt: sql`NOW()`,
        })
        .where(and(eq(s.person.id, input.personId), isNull(s.person.deletedAt)))
        .returning({ id: s.person.id })
        .then(singleRow);

      return result;
    },
  ),
);

export const replaceMetadata = wrapCommand(
  "user.person.replaceMetadata",
  withZod(
    z.object({
      personId: uuidSchema,
      metadata: z.record(z.any()),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          _metadata: sql`(((${JSON.stringify(input.metadata)})::jsonb)#>> '{}')::jsonb`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const listActiveRolesForLocation = wrapQuery(
  "user.person.listActiveRolesForLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.array(z.enum(["student", "instructor", "location_admin"])),
    async (input) => {
      const query = useQuery();

      return await query
        .select({
          type: s.actor.type,
        })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.locationId, input.locationId),
            eq(s.actor.personId, input.personId),
            isNull(s.actor.deletedAt),
          ),
        )
        .then((rows) =>
          rows
            .filter(({ type }) =>
              ["student", "instructor", "location_admin"].includes(type),
            )
            .map(
              ({ type }) => type as "student" | "instructor" | "location_admin",
            ),
        );
    },
  ),
);

export const moveToAccountByEmail = wrapCommand(
  "user.person.moveToAccountByEmail",
  withZod(
    z.object({
      personId: uuidSchema,
      email: z.string().toLowerCase().trim().email(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      async function findUserForPerson(personId: string) {
        return query
          .select()
          .from(s.user)
          .where(
            exists(
              query
                .select({ id: sql`1` })
                .from(s.person)
                .where(
                  and(
                    eq(s.person.id, personId),
                    isNull(s.person.deletedAt),
                    eq(s.person.userId, s.user.authUserId),
                  ),
                ),
            ),
          )
          .then(possibleSingleRow);
      }

      async function updatePersonUser(personId: string, userId: string) {
        return query
          .update(s.person)
          .set({ userId: userId, updatedAt: sql`NOW()`, isPrimary: false })
          .where(eq(s.person.id, personId))
          .returning({ id: s.person.id })
          .then(singleRow);
      }

      const user = await findUserForPerson(input.personId);

      const newUser = await getOrCreateFromEmail({
        email: input.email,
        displayName: user?.displayName ?? undefined,
      });
      return await updatePersonUser(input.personId, newUser.id);
    },
  ),
);

export const updateDetails = wrapCommand(
  "user.person.updateDetails",
  withZod(
    z.object({
      personId: uuidSchema,
      data: insertSchema
        .pick({
          firstName: true,
          lastName: true,
          lastNamePrefix: true,
          dateOfBirth: true,
          birthCity: true,
          birthCountry: true,
        })
        .partial(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          firstName: input.data.firstName,
          lastName: input.data.lastName,
          lastNamePrefix: input.data.lastNamePrefix,
          dateOfBirth: input.data.dateOfBirth
            ? dayjs(input.data.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.data.birthCity,
          birthCountry: input.data.birthCountry,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const mergePersons = wrapCommand(
  "user.person.mergePersons",
  withZod(
    z.object({
      personId: uuidSchema,
      targetPersonId: uuidSchema,
      // Optional audit metadata. When provided, mergePersons writes one
      // person_merge_audit row inside the same transaction. Operator-driven
      // surfaces (personen_page, cohort_view) and the sysadmin path all use
      // this. Bulk import has its own audit shape so it doesn't go through
      // here.
      auditMetadata: z
        .object({
          performedByPersonId: uuidSchema,
          locationId: uuidSchema,
          source: z.enum(["personen_page", "cohort_view", "sysadmin"]),
          score: z.number().int().optional(),
          reasons: z.array(z.string()).optional(),
        })
        .optional(),
    }),
    async (input) => {
      return await withTransaction(async (tx) => {
        // First validate that both persons exist
        const persons = await tx
          .select({
            id: s.person.id,
            userId: s.person.userId,
            isPrimary: s.person.isPrimary,
          })
          .from(s.person)
          .where(
            and(
              inArray(s.person.id, [input.personId, input.targetPersonId]),
              isNull(s.person.deletedAt),
            ),
          );

        if (persons.length !== 2) {
          throw new Error("One or both persons not found");
        }

        // Transfer actors first so allocations point to the target person's actors.
        const actors = await tx
          .select({
            id: s.actor.id,
            type: s.actor.type,
            locationId: s.actor.locationId,
          })
          .from(s.actor)
          .where(eq(s.actor.personId, input.personId));

        if (actors.length > 0) {
          await tx
            .insert(s.actor)
            .values(
              actors.map((actor) => ({
                ...actor,
                id: undefined,
                personId: input.targetPersonId,
              })),
            )
            .onConflictDoNothing();

          const [targetPersonActors, cohortAllocationsToUpdate] =
            await Promise.all([
              tx
                .select({
                  id: s.actor.id,
                  type: s.actor.type,
                  locationId: s.actor.locationId,
                })
                .from(s.actor)
                .where(eq(s.actor.personId, input.targetPersonId)),
              tx
                .select({
                  id: s.cohortAllocation.id,
                  actorId: s.cohortAllocation.actorId,
                })
                .from(s.cohortAllocation)
                .where(
                  inArray(
                    s.cohortAllocation.actorId,
                    actors.map((actor) => actor.id),
                  ),
                ),
            ]);

          for (const cohortAllocation of cohortAllocationsToUpdate) {
            const currentActor = actors.find(
              (actor) => actor.id === cohortAllocation.actorId,
            );

            if (!currentActor) {
              throw new Error("Actor not found");
            }

            const targetActor = targetPersonActors.filter(
              (actor) =>
                actor.locationId === currentActor.locationId &&
                actor.type === currentActor.type,
            );

            if (targetActor.length !== 1) {
              throw new Error("Target actor not found");
            }

            await tx
              .update(s.cohortAllocation)
              // biome-ignore lint/style/noNonNullAssertion: intentional
              .set({ actorId: targetActor[0]!.id })
              .where(eq(s.cohortAllocation.id, cohortAllocation.id));
          }

          // ── Repoint counterparty actor refs ────────────────────────
          //
          // The cohort_allocation.actor_id repointing above was a
          // special case — it walked one table and matched per-row. In
          // practice many other tables also reference an actor.id as a
          // counterparty (instructor of someone else's allocation,
          // creator of a PVB event, etc). Without repointing them too,
          // the source-actor `tx.delete(s.actor)` below would trip a
          // FK violation and roll the merge back.
          //
          // Generalize: build a sourceActorId → targetActorId map
          // (matched by type + locationId), then issue per-source
          // UPDATEs across every table that holds a counterparty
          // reference. Per-source loops keep the SQL trivial; in the
          // merge call site there are typically a handful of source
          // actors, so the roundtrip cost is negligible.
          const actorIdMap = new Map<string, string>();
          for (const sourceActor of actors) {
            const matches = targetPersonActors.filter(
              (a) =>
                a.locationId === sourceActor.locationId &&
                a.type === sourceActor.type,
            );
            if (matches.length === 1 && matches[0]) {
              actorIdMap.set(sourceActor.id, matches[0].id);
            }
          }

          for (const [srcActorId, tgtActorId] of actorIdMap) {
            // cohort_allocation.instructor_id — instructor for someone
            // else's allocation (counterparty to the student).
            await tx
              .update(s.cohortAllocation)
              .set({ instructorId: tgtActorId })
              .where(eq(s.cohortAllocation.instructorId, srcActorId));

            // media.actor_id — author/uploader.
            await tx
              .update(s.media)
              .set({ actorId: tgtActorId })
              .where(eq(s.media.actorId, srcActorId));

            // KSS qualification — recorder of the qualification.
            await tx
              .update(s.persoonKwalificatie)
              .set({ toegevoegdDoor: tgtActorId })
              .where(eq(s.persoonKwalificatie.toegevoegdDoor, srcActorId));

            // PVB audit-trail tables — actor that triggered the event/
            // status change. None of these have unique constraints on
            // `aangemaakt_door`, so a plain UPDATE is safe even if the
            // source actor's events end up adjacent to target's.
            await tx
              .update(s.pvbAanvraagStatus)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbAanvraagStatus.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbGebeurtenis)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbGebeurtenis.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbLeercoachToestemming)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbLeercoachToestemming.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbBeoordelaarBeschikbaarheidStatus)
              .set({ aangemaaktDoor: tgtActorId })
              .where(
                eq(
                  s.pvbBeoordelaarBeschikbaarheidStatus.aangemaaktDoor,
                  srcActorId,
                ),
              );
          }

          await tx.delete(s.actor).where(eq(s.actor.personId, input.personId));
        }

        // Conflict detection runs LIVE-only on both sides:
        //   - A soft-deleted target curriculum at the same
        //     (curriculumId, gearTypeId) as a live source curriculum
        //     used to be picked up as a "conflict", which buried
        //     source's live data behind the deleted target. The partial
        //     unique index (`student_curriculum_unq_identity_gear_curriculum
        //     WHERE deleted_at IS NULL`) lets us safely UPDATE the
        //     source's personId to the target without colliding.
        //   - A soft-deleted source curriculum still references
        //     `source.person_id` via `student_curriculum_link_person_id_fk`,
        //     so it must ALSO migrate to the target — otherwise the
        //     end-of-merge `tx.delete(s.person)` trips an FK violation
        //     and rolls the whole merge back. The migration is a plain
        //     UPDATE; the deleted row stays deleted, just under the
        //     target person's id.
        //
        // So we load source curricula in two buckets (live, deleted),
        // load only LIVE target curricula (deleted target is invisible
        // by design), match by identity LIVE×LIVE only, and migrate
        // the rest by personId UPDATE.
        const allSourceStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
            deletedAt: s.studentCurriculum.deletedAt,
          })
          .from(s.studentCurriculum)
          .where(eq(s.studentCurriculum.personId, input.personId));
        const sourceStudentCurricula = allSourceStudentCurricula.filter(
          (c) => c.deletedAt == null,
        );
        const deletedSourceStudentCurriculumIds = allSourceStudentCurricula
          .filter((c) => c.deletedAt != null)
          .map((c) => c.id);

        const targetStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
          })
          .from(s.studentCurriculum)
          .where(
            and(
              eq(s.studentCurriculum.personId, input.targetPersonId),
              isNull(s.studentCurriculum.deletedAt),
            ),
          );

        const targetCurriculumByIdentity = new Map<
          string,
          {
            id: string;
            curriculumId: string;
            gearTypeId: string;
            createdAt: string;
          }
        >(
          targetStudentCurricula.map((curriculum) => [
            `${curriculum.curriculumId}:${curriculum.gearTypeId}`,
            curriculum,
          ]),
        );

        const conflictingCurriculumPairs: {
          sourceStudentCurriculumId: string;
          targetStudentCurriculumId: string;
        }[] = [];

        // Soft-deleted source curricula skip conflict detection (their
        // "live" identity slot is already empty per the partial index)
        // and just migrate by personId.
        const nonConflictingStudentCurriculumIds: string[] = [
          ...deletedSourceStudentCurriculumIds,
        ];

        for (const sourceStudentCurriculum of sourceStudentCurricula) {
          const matchingTargetStudentCurriculum =
            targetCurriculumByIdentity.get(
              `${sourceStudentCurriculum.curriculumId}:${sourceStudentCurriculum.gearTypeId}`,
            );

          if (!matchingTargetStudentCurriculum) {
            nonConflictingStudentCurriculumIds.push(sourceStudentCurriculum.id);
            continue;
          }

          conflictingCurriculumPairs.push({
            sourceStudentCurriculumId: sourceStudentCurriculum.id,
            targetStudentCurriculumId: matchingTargetStudentCurriculum.id,
          });
        }

        if (nonConflictingStudentCurriculumIds.length > 0) {
          await tx
            .update(s.studentCurriculum)
            .set({
              personId: input.targetPersonId,
            })
            .where(
              inArray(
                s.studentCurriculum.id,
                nonConflictingStudentCurriculumIds,
              ),
            );
        }

        for (const {
          sourceStudentCurriculumId,
          targetStudentCurriculumId,
        } of conflictingCurriculumPairs) {
          const targetCompletedCompetencies = await tx
            .select({
              competencyId: s.studentCompletedCompetency.competencyId,
            })
            .from(s.studentCompletedCompetency)
            .where(
              and(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  targetStudentCurriculumId,
                ),
                eq(
                  s.studentCompletedCompetency.isMergeConflictDuplicate,
                  false,
                ),
                isNull(s.studentCompletedCompetency.deletedAt),
              ),
            );

          if (targetCompletedCompetencies.length > 0) {
            await tx
              .update(s.studentCompletedCompetency)
              .set({
                isMergeConflictDuplicate: true,
              })
              .where(
                and(
                  eq(
                    s.studentCompletedCompetency.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  inArray(
                    s.studentCompletedCompetency.competencyId,
                    targetCompletedCompetencies.map(
                      (competency) => competency.competencyId,
                    ),
                  ),
                  isNull(s.studentCompletedCompetency.deletedAt),
                ),
              );
          }

          await Promise.all([
            tx
              .update(s.studentCompletedCompetency)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  sourceStudentCurriculumId,
                ),
              ),
            tx
              .update(s.certificate)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(
                  s.certificate.studentCurriculumId,
                  sourceStudentCurriculumId,
                ),
              ),
          ]);

          const [sourceAllocations, targetAllocations] = await Promise.all([
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    targetStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
          ]);

          const targetAllocationByIdentity = new Map<
            string,
            {
              id: string;
              cohortId: string;
              actorId: string;
              createdAt: string;
            }
          >(
            targetAllocations.map((allocation) => [
              `${allocation.cohortId}:${allocation.actorId}`,
              allocation,
            ]),
          );

          for (const sourceAllocation of sourceAllocations) {
            const collidingTargetAllocation = targetAllocationByIdentity.get(
              `${sourceAllocation.cohortId}:${sourceAllocation.actorId}`,
            );

            if (!collidingTargetAllocation) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, sourceAllocation.id));
              continue;
            }

            const [sourceHasLinkedCertificates, targetHasLinkedCertificates] =
              await Promise.all([
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(s.certificate.cohortAllocationId, sourceAllocation.id),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(
                        s.certificate.cohortAllocationId,
                        collidingTargetAllocation.id,
                      ),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
              ]);

            let winnerAllocation = sourceAllocation;
            let loserAllocation = collidingTargetAllocation;

            if (sourceHasLinkedCertificates !== targetHasLinkedCertificates) {
              if (targetHasLinkedCertificates) {
                winnerAllocation = collidingTargetAllocation;
                loserAllocation = sourceAllocation;
              }
            } else if (
              dayjs(sourceAllocation.createdAt).isAfter(
                collidingTargetAllocation.createdAt,
              ) ||
              (dayjs(sourceAllocation.createdAt).isSame(
                collidingTargetAllocation.createdAt,
              ) &&
                sourceAllocation.id > collidingTargetAllocation.id)
            ) {
              winnerAllocation = collidingTargetAllocation;
              loserAllocation = sourceAllocation;
            }

            const winnerProgressCompetencies = await tx
              .selectDistinct({
                competencyId: s.studentCohortProgress.competencyId,
              })
              .from(s.studentCohortProgress)
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  winnerAllocation.id,
                ),
              );

            if (winnerProgressCompetencies.length > 0) {
              await tx.delete(s.studentCohortProgress).where(
                and(
                  eq(
                    s.studentCohortProgress.cohortAllocationId,
                    loserAllocation.id,
                  ),
                  inArray(
                    s.studentCohortProgress.competencyId,
                    winnerProgressCompetencies.map(
                      (competency) => competency.competencyId,
                    ),
                  ),
                ),
              );
            }

            await tx
              .update(s.studentCohortProgress)
              .set({
                cohortAllocationId: winnerAllocation.id,
              })
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  loserAllocation.id,
                ),
              );

            await Promise.all([
              tx
                .update(s.certificate)
                .set({
                  cohortAllocationId: null,
                })
                .where(
                  and(
                    eq(s.certificate.cohortAllocationId, loserAllocation.id),
                    isNull(s.certificate.deletedAt),
                  ),
                ),
              tx
                .update(s.cohortAllocation)
                .set({
                  deletedAt: new Date().toISOString(),
                  updatedAt: sql`NOW()`,
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, loserAllocation.id)),
            ]);

            if (winnerAllocation.id === sourceAllocation.id) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, winnerAllocation.id));
            }
          }

          await tx
            .update(s.cohortAllocation)
            .set({
              studentCurriculumId: targetStudentCurriculumId,
            })
            .where(
              eq(
                s.cohortAllocation.studentCurriculumId,
                sourceStudentCurriculumId,
              ),
            );

          await tx
            .delete(s.studentCurriculum)
            .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId));
        }

        await Promise.all([
          // Transfer location links
          (async () => {
            const links = await tx
              .select()
              .from(s.personLocationLink)
              .where(eq(s.personLocationLink.personId, input.personId));

            if (links.length > 0) {
              await tx
                .delete(s.personLocationLink)
                .where(eq(s.personLocationLink.personId, input.personId));

              await tx
                .insert(s.personLocationLink)
                .values(
                  links.map((link) => ({
                    ...link,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          tx
            .update(s.externalCertificate)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.externalCertificate.personId, input.personId)),

          tx
            .update(s.logbook)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.logbook.personId, input.personId)),

          tx
            .update(s.studentCohortProgress)
            .set({
              createdBy: input.targetPersonId,
            })
            .where(eq(s.studentCohortProgress.createdBy, input.personId)),

          // Transfer person roles (PK: personId + roleId)
          (async () => {
            const roles = await tx
              .select()
              .from(s.personRole)
              .where(eq(s.personRole.personId, input.personId));

            if (roles.length > 0) {
              await tx
                .delete(s.personRole)
                .where(eq(s.personRole.personId, input.personId));

              await tx
                .insert(s.personRole)
                .values(
                  roles.map((role) => ({
                    ...role,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          // Transfer KSS qualifications (unique: personId + courseId + kerntaakOnderdeelId)
          (async () => {
            const kwalificaties = await tx
              .select()
              .from(s.persoonKwalificatie)
              .where(eq(s.persoonKwalificatie.personId, input.personId));

            if (kwalificaties.length > 0) {
              await tx
                .delete(s.persoonKwalificatie)
                .where(eq(s.persoonKwalificatie.personId, input.personId));

              await tx
                .insert(s.persoonKwalificatie)
                .values(
                  kwalificaties.map((kwalificatie) => ({
                    ...kwalificatie,
                    id: undefined,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),
        ]);

        // Handle isPrimary constraint before delete
        const duplicatePerson = persons.find((p) => p.id === input.personId);

        if (duplicatePerson?.isPrimary && duplicatePerson?.userId) {
          // FIRST: Unset isPrimary on the person we're about to delete
          // This avoids constraint violation if we try to set another as primary first
          await tx
            .update(s.person)
            .set({ isPrimary: false, updatedAt: sql`NOW()` })
            .where(eq(s.person.id, input.personId));

          // THEN: Find another person for this user to make primary
          const otherPerson = await tx
            .select({ id: s.person.id })
            .from(s.person)
            .where(
              and(
                eq(s.person.userId, duplicatePerson.userId),
                ne(s.person.id, input.personId),
                isNull(s.person.deletedAt),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (otherPerson) {
            await tx
              .update(s.person)
              .set({ isPrimary: true, updatedAt: sql`NOW()` })
              .where(eq(s.person.id, otherPerson.id));
          }
          // If no other person exists, user account becomes orphaned (accepted risk)
        }

        // ── Repoint person counterparty FKs across the KSS schema ──
        //
        // PVB tables hold person-level references for kandidaat /
        // beoordelaar / leercoach roles. If the source person was any
        // of those on someone else's record, the row still references
        // source.id at this point — and the `tx.delete(s.person)` below
        // would trip a FK violation. Migrate them to target.
        //
        // For tables with a unique constraint that includes the
        // migrated column (just `pvb_onderdeel`), we delete the source-
        // side rows that would conflict with target's existing rows
        // first. The "duplicate" is precisely a same-human scenario
        // (source and target are merging exactly because they're the
        // same human) so the delete drops a redundant record, not real
        // information.
        await tx
          .update(s.pvbAanvraag)
          .set({ kandidaatId: input.targetPersonId })
          .where(eq(s.pvbAanvraag.kandidaatId, input.personId));

        // pvb_onderdeel.beoordelaar_id has unique on
        // (pvb_aanvraag_id, kerntaak_onderdeel_id, beoordelaar_id).
        // Drop source-side rows that would collide with existing
        // target-side rows on the same (aanvraag, kerntaak_onderdeel)
        // pair, then migrate the rest.
        await tx.execute(sql`
          DELETE FROM ${s.pvbOnderdeel}
          WHERE ${s.pvbOnderdeel.beoordelaarId} = ${input.personId}
            AND (${s.pvbOnderdeel.pvbAanvraagId}, ${s.pvbOnderdeel.kerntaakOnderdeelId}) IN (
              SELECT ${s.pvbOnderdeel.pvbAanvraagId}, ${s.pvbOnderdeel.kerntaakOnderdeelId}
              FROM ${s.pvbOnderdeel}
              WHERE ${s.pvbOnderdeel.beoordelaarId} = ${input.targetPersonId}
            )
        `);
        await tx
          .update(s.pvbOnderdeel)
          .set({ beoordelaarId: input.targetPersonId })
          .where(eq(s.pvbOnderdeel.beoordelaarId, input.personId));

        // pvb_beoordelaar_beschikbaarheid.beoordelaar_id — no unique
        // constraint on the column, plain UPDATE.
        await tx
          .update(s.pvbBeoordelaarBeschikbaarheid)
          .set({ beoordelaarId: input.targetPersonId })
          .where(
            eq(s.pvbBeoordelaarBeschikbaarheid.beoordelaarId, input.personId),
          );

        // pvb_leercoach_toestemming.leercoach_id — no unique on column.
        await tx
          .update(s.pvbLeercoachToestemming)
          .set({ leercoachId: input.targetPersonId })
          .where(eq(s.pvbLeercoachToestemming.leercoachId, input.personId));

        await tx.delete(s.person).where(eq(s.person.id, input.personId));

        // Audit row — written inside the same transaction so a bug + missing
        // audit is impossible (rollback removes both, commit keeps both).
        if (input.auditMetadata) {
          await tx.insert(s.personMergeAudit).values({
            performedByPersonId: input.auditMetadata.performedByPersonId,
            locationId: input.auditMetadata.locationId,
            sourcePersonId: input.personId,
            targetPersonId: input.targetPersonId,
            decisionKind: "merge",
            score: input.auditMetadata.score ?? null,
            reasons: input.auditMetadata.reasons ?? null,
            source: input.auditMetadata.source,
          });
        }
      });
    },
  ),
);

export { DuplicateScoring };
