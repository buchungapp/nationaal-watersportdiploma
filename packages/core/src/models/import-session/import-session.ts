import { createHash } from "node:crypto";
import type { Transaction } from "@nawadi/db";
import { schema as s } from "@nawadi/db";
import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.ts";
import {
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.ts";
import { previewBulkImport } from "../user/person.ts";

const importRolesSchema = z
  .array(z.enum(["student", "instructor", "location_admin"]))
  .nonempty();

const rowInputSchema = z
  .object({
    rowIndex: z.number().int().nonnegative(),
    externalRowKey: z.string().trim().min(1).nullable().optional(),
    firstName: z.unknown().optional(),
    lastNamePrefix: z.unknown().optional(),
    lastName: z.unknown().optional(),
    dateOfBirth: z.unknown().optional(),
    birthCity: z.unknown().optional(),
    birthCountry: z.unknown().optional(),
    email: z.unknown().optional(),
    tags: z.array(z.string()).default([]),
    rawPayload: z.unknown().optional(),
  })
  .passthrough();

const upsertFullSnapshotInputSchema = z.object({
  locationId: uuidSchema,
  targetCohortId: uuidSchema,
  sourceSystem: z.string().trim().min(1),
  externalSessionKey: z.string().trim().min(1),
  receivedByTokenId: uuidSchema.optional(),
  rows: z.array(rowInputSchema),
});

const sessionSummarySchema = z.object({
  id: uuidSchema,
  status: z.enum([
    "open",
    "reviewing",
    "superseded",
    "invalidated",
    "cancelled",
    "committed",
  ]),
  generation: z.number().int(),
  revision: z.number().int(),
  rowCount: z.number().int(),
  payloadHash: z.string(),
});

const sessionRecordSchema = sessionSummarySchema.extend({
  locationId: uuidSchema,
  targetCohortId: uuidSchema,
  sourceSystem: z.string(),
  externalSessionKey: z.string(),
  receivedByTokenId: uuidSchema.nullable(),
  supersededAt: z.string().nullable(),
  invalidatedAt: z.string().nullable(),
  committedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

type RowInput = z.output<typeof rowInputSchema>;

type NormalizedImportRow = {
  rowIndex: number;
  externalRowKey: string | null;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  email: string | null;
  tags: string[];
  rawPayload: unknown;
  validationMessages: ValidationMessage[];
  status: "valid" | "invalid";
};

type ValidationMessage = {
  code: string;
  severity: "error" | "warning" | "info";
  field?: string | null;
  message: string;
};

function nullableString(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function requiredMaterializationString(
  value: unknown,
  fieldName: string,
  messages: ValidationMessage[],
) {
  const normalized = nullableString(value);
  if (!normalized) {
    messages.push({
      code: "missing_required_for_materialization",
      severity: "error",
      field: fieldName,
      message: `${fieldName} is required before materialization`,
    });
  }
  return normalized;
}

function normalizeDateOfBirth(value: unknown, messages: ValidationMessage[]) {
  const normalized = requiredMaterializationString(
    value,
    "dateOfBirth",
    messages,
  );
  if (!normalized) {
    return null;
  }
  const parsed = z.string().date().safeParse(normalized);
  if (!parsed.success) {
    messages.push({
      code: "invalid_date",
      severity: "error",
      field: "dateOfBirth",
      message: "dateOfBirth must be an ISO date",
    });
    return normalized;
  }
  return parsed.data;
}

function normalizeBirthCountry(value: unknown, messages: ValidationMessage[]) {
  const normalized = nullableString(value);
  if (!normalized) {
    return null;
  }
  const code = normalized.toLowerCase();
  if (!/^[a-z]{2}$/.test(code)) {
    messages.push({
      code: "invalid_country_code",
      severity: "warning",
      field: "birthCountry",
      message: "birthCountry should be a two-letter country code",
    });
  }
  return code;
}

function normalizeEmail(value: unknown, messages: ValidationMessage[]) {
  const normalized = nullableString(value);
  if (!normalized) {
    return null;
  }
  const parsed = z.string().email().safeParse(normalized);
  if (!parsed.success) {
    messages.push({
      code: "invalid_email",
      severity: "warning",
      field: "email",
      message: "email should be a valid email address",
    });
  }
  return normalized.toLowerCase();
}

function normalizeRow(row: RowInput): NormalizedImportRow {
  const validationMessages: ValidationMessage[] = [];
  const birthCity = requiredMaterializationString(
    row.birthCity,
    "birthCity",
    validationMessages,
  );
  const dateOfBirth = normalizeDateOfBirth(row.dateOfBirth, validationMessages);
  const birthCountry = normalizeBirthCountry(
    row.birthCountry,
    validationMessages,
  );
  const email = normalizeEmail(row.email, validationMessages);
  const firstName = requiredMaterializationString(
    row.firstName,
    "firstName",
    validationMessages,
  );
  const lastName = requiredMaterializationString(
    row.lastName,
    "lastName",
    validationMessages,
  );

  return {
    rowIndex: row.rowIndex,
    externalRowKey: row.externalRowKey ?? null,
    firstName: firstName ?? "",
    lastNamePrefix: nullableString(row.lastNamePrefix),
    lastName: lastName ?? "",
    dateOfBirth,
    birthCity,
    birthCountry,
    email,
    tags: row.tags,
    rawPayload: row.rawPayload ?? row,
    validationMessages,
    status: validationMessages.some((message) => message.severity === "error")
      ? "invalid"
      : "valid",
  };
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, nested]) => [key, canonicalize(nested)]),
    );
  }
  return value;
}

function computePayloadHash(rows: NormalizedImportRow[]) {
  const canonicalRows = rows
    .toSorted((a, b) => a.rowIndex - b.rowIndex)
    .map((row) => canonicalize(row));

  return createHash("sha256")
    .update(JSON.stringify(canonicalRows))
    .digest("hex");
}

function importRowFingerprint(row: {
  firstName: string | null;
  lastNamePrefix: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  birthCity: string | null;
  birthCountry: string | null;
  email: string | null;
  tags: string[];
  rawPayload: unknown;
}) {
  return JSON.stringify(
    canonicalize({
      firstName: row.firstName ?? "",
      lastNamePrefix: row.lastNamePrefix,
      lastName: row.lastName ?? "",
      dateOfBirth: row.dateOfBirth,
      birthCity: row.birthCity,
      birthCountry: row.birthCountry,
      email: row.email,
      tags: row.tags,
      rawPayload: row.rawPayload,
    }),
  );
}

function buildImportSessionDetectionSnapshot(matches: {
  matchesByRow: {
    rowIndex: number;
    candidates: { personId: string; score: number }[];
  }[];
}) {
  const snapshot: Record<
    string,
    { matchPersonIds: string[]; topScore: number }
  > = {};
  for (const row of matches.matchesByRow) {
    snapshot[row.rowIndex.toString()] = {
      matchPersonIds: row.candidates
        .map((candidate) => candidate.personId)
        .sort((a, b) => a.localeCompare(b)),
      topScore: row.candidates[0]?.score ?? 0,
    };
  }
  return snapshot;
}

async function invalidateActivePreviews(
  tx: Transaction,
  importSessionIds: string[],
  status: "invalidated" | "superseded",
) {
  if (importSessionIds.length === 0) {
    return;
  }

  const activePreviewLinks = await tx
    .select({
      token: s.importSessionPreview.bulkImportPreviewToken,
    })
    .from(s.importSessionPreview)
    .where(
      and(
        inArray(s.importSessionPreview.importSessionId, importSessionIds),
        eq(s.importSessionPreview.status, "active"),
      ),
    );

  if (activePreviewLinks.length === 0) {
    return;
  }

  const nowColumn =
    status === "invalidated" ? { invalidatedAt: sql`NOW()` } : {};
  const supersededColumn =
    status === "superseded" ? { supersededAt: sql`NOW()` } : {};

  await tx
    .update(s.importSessionPreview)
    .set({
      status,
      ...nowColumn,
      ...supersededColumn,
    })
    .where(
      and(
        inArray(s.importSessionPreview.importSessionId, importSessionIds),
        eq(s.importSessionPreview.status, "active"),
      ),
    );

  await tx
    .update(s.bulkImportPreview)
    .set({ status: "invalidated_max" })
    .where(
      and(
        inArray(
          s.bulkImportPreview.token,
          activePreviewLinks.map((link) => link.token),
        ),
        eq(s.bulkImportPreview.status, "active"),
      ),
    );
}

export const upsertFullSnapshot = wrapCommand(
  "importSession.upsertFullSnapshot",
  withZod(
    upsertFullSnapshotInputSchema,
    sessionSummarySchema.extend({
      changed: z.boolean(),
      insertedRows: z.number().int(),
    }),
    async (input) =>
      withTransaction(async (tx) => {
        const normalizedRows = input.rows
          .map(normalizeRow)
          .toSorted((a, b) => a.rowIndex - b.rowIndex);
        const payloadHash = computePayloadHash(normalizedRows);

        const existing = await tx
          .select()
          .from(s.importSession)
          .where(
            and(
              eq(s.importSession.locationId, input.locationId),
              eq(s.importSession.targetCohortId, input.targetCohortId),
              eq(s.importSession.sourceSystem, input.sourceSystem),
              eq(s.importSession.externalSessionKey, input.externalSessionKey),
            ),
          )
          .orderBy(desc(s.importSession.generation))
          .limit(1)
          .then(possibleSingleRow);

        const replaceExisting =
          existing && ["open", "reviewing"].includes(existing.status);
        const nextGeneration = existing ? existing.generation + 1 : 1;

        if (replaceExisting && existing.payloadHash === payloadHash) {
          const [updated] = await tx
            .update(s.importSession)
            .set({
              receivedByTokenId: input.receivedByTokenId,
              updatedAt: sql`NOW()`,
            })
            .where(eq(s.importSession.id, existing.id))
            .returning({
              id: s.importSession.id,
              status: s.importSession.status,
              generation: s.importSession.generation,
              revision: s.importSession.revision,
              rowCount: s.importSession.rowCount,
              payloadHash: s.importSession.payloadHash,
            });

          if (!updated) {
            throw new Error("Failed to touch import session");
          }

          return {
            ...updated,
            changed: false,
            insertedRows: 0,
          };
        }

        const siblingSessions = await tx
          .select({ id: s.importSession.id })
          .from(s.importSession)
          .where(
            and(
              eq(s.importSession.locationId, input.locationId),
              eq(s.importSession.targetCohortId, input.targetCohortId),
              eq(s.importSession.sourceSystem, input.sourceSystem),
              inArray(s.importSession.status, ["open", "reviewing"]),
              ne(s.importSession.externalSessionKey, input.externalSessionKey),
            ),
          );
        const siblingSessionIds = siblingSessions.map((row) => row.id);

        if (siblingSessionIds.length > 0) {
          await invalidateActivePreviews(tx, siblingSessionIds, "superseded");
          await tx
            .update(s.importSession)
            .set({
              status: "superseded",
              supersededAt: sql`NOW()`,
              updatedAt: sql`NOW()`,
            })
            .where(inArray(s.importSession.id, siblingSessionIds));
        }

        const session = replaceExisting
          ? await tx
              .update(s.importSession)
              .set({
                status: "open",
                revision: existing.revision + 1,
                rowCount: normalizedRows.length,
                payloadHash,
                receivedByTokenId: input.receivedByTokenId,
                invalidatedAt: null,
                supersededAt: null,
                updatedAt: sql`NOW()`,
              })
              .where(eq(s.importSession.id, existing.id))
              .returning({
                id: s.importSession.id,
                status: s.importSession.status,
                generation: s.importSession.generation,
                revision: s.importSession.revision,
                rowCount: s.importSession.rowCount,
                payloadHash: s.importSession.payloadHash,
              })
              .then(singleRow)
          : await tx
              .insert(s.importSession)
              .values({
                locationId: input.locationId,
                targetCohortId: input.targetCohortId,
                sourceSystem: input.sourceSystem,
                externalSessionKey: input.externalSessionKey,
                generation: nextGeneration,
                rowCount: normalizedRows.length,
                payloadHash,
                receivedByTokenId: input.receivedByTokenId,
              })
              .returning({
                id: s.importSession.id,
                status: s.importSession.status,
                generation: s.importSession.generation,
                revision: s.importSession.revision,
                rowCount: s.importSession.rowCount,
                payloadHash: s.importSession.payloadHash,
              })
              .then(singleRow);

        if (replaceExisting) {
          await invalidateActivePreviews(tx, [existing.id], "invalidated");
          await tx
            .update(s.importSessionRow)
            .set({ supersededAt: sql`NOW()` })
            .where(
              and(
                eq(s.importSessionRow.importSessionId, existing.id),
                isNull(s.importSessionRow.supersededAt),
              ),
            );
        }

        if (normalizedRows.length > 0) {
          await tx.insert(s.importSessionRow).values(
            normalizedRows.map((row) => ({
              importSessionId: session.id,
              revision: session.revision,
              rowIndex: row.rowIndex,
              externalRowKey: row.externalRowKey,
              firstName: row.firstName,
              lastNamePrefix: row.lastNamePrefix,
              lastName: row.lastName,
              dateOfBirth: row.dateOfBirth,
              birthCity: row.birthCity,
              birthCountry: row.birthCountry,
              email: row.email,
              tags: row.tags,
              rawPayload: row.rawPayload,
              validationErrors: row.validationMessages,
              status: row.status,
            })),
          );
        }

        return {
          ...session,
          changed: true,
          insertedRows: normalizedRows.length,
        };
      }),
  ),
);

export const list = wrapQuery(
  "importSession.list",
  withZod(
    z.object({
      locationId: uuidSchema,
      targetCohortId: uuidSchema.optional(),
      sourceSystem: z.string().optional(),
    }),
    z.array(sessionRecordSchema),
    async (input) => {
      const query = useQuery();

      return query
        .select()
        .from(s.importSession)
        .where(
          and(
            eq(s.importSession.locationId, input.locationId),
            input.targetCohortId
              ? eq(s.importSession.targetCohortId, input.targetCohortId)
              : undefined,
            input.sourceSystem
              ? eq(s.importSession.sourceSystem, input.sourceSystem)
              : undefined,
          ),
        )
        .orderBy(
          asc(s.importSession.createdAt),
          asc(s.importSession.generation),
        );
    },
  ),
);

export const get = wrapQuery(
  "importSession.get",
  withZod(
    z.object({
      importSessionId: uuidSchema,
    }),
    z.unknown(),
    async (input) => {
      const query = useQuery();

      const session = await query
        .select()
        .from(s.importSession)
        .where(eq(s.importSession.id, input.importSessionId))
        .then(possibleSingleRow);

      if (!session) {
        return null;
      }

      const [rows, previews] = await Promise.all([
        query
          .select()
          .from(s.importSessionRow)
          .where(
            and(
              eq(s.importSessionRow.importSessionId, input.importSessionId),
              isNull(s.importSessionRow.supersededAt),
            ),
          )
          .orderBy(asc(s.importSessionRow.rowIndex)),
        query
          .select()
          .from(s.importSessionPreview)
          .where(
            eq(s.importSessionPreview.importSessionId, input.importSessionId),
          )
          .orderBy(asc(s.importSessionPreview.materializedAt)),
      ]);

      return { session, rows, previews };
    },
  ),
);

export const materializeBulkImportPreview = wrapCommand(
  "importSession.materializeBulkImportPreview",
  withZod(
    z.object({
      importSessionId: uuidSchema,
      performedByPersonId: uuidSchema,
      roles: importRolesSchema.default(["student"]),
    }),
    z.object({
      previewToken: uuidSchema,
      importSessionPreviewId: uuidSchema,
      validRowCount: z.number().int(),
      invalidRowCount: z.number().int(),
      attempt: z.number().int(),
      matches: z.unknown(),
      candidates: z.array(z.unknown()),
      parseErrors: z.array(
        z.object({
          rowIndex: z.number().int(),
          error: z.string(),
        }),
      ),
    }),
    async (input) =>
      withTransaction(async (tx) => {
        const session = await tx
          .select()
          .from(s.importSession)
          .where(eq(s.importSession.id, input.importSessionId))
          .then(possibleSingleRow);

        if (!session) {
          throw new Error("Import session not found");
        }
        if (!["open", "reviewing"].includes(session.status)) {
          throw new Error("Import session is not open for review");
        }

        const activePreview = await tx
          .select({
            id: s.importSessionPreview.id,
            token: s.bulkImportPreview.token,
            attempt: s.bulkImportPreview.attempt,
            rowsParsed: s.bulkImportPreview.rowsParsed,
          })
          .from(s.importSessionPreview)
          .innerJoin(
            s.bulkImportPreview,
            eq(
              s.bulkImportPreview.token,
              s.importSessionPreview.bulkImportPreviewToken,
            ),
          )
          .where(
            and(
              eq(s.importSessionPreview.importSessionId, input.importSessionId),
              eq(s.importSessionPreview.status, "active"),
              eq(s.bulkImportPreview.status, "active"),
            ),
          )
          .then(possibleSingleRow);

        if (activePreview) {
          const stored = activePreview.rowsParsed as {
            candidates?: unknown[];
            matches?: unknown;
            parseErrors?: { rowIndex: number; error: string }[];
          };
          return {
            previewToken: activePreview.token,
            importSessionPreviewId: activePreview.id,
            validRowCount:
              stored.candidates?.filter(
                (candidate) =>
                  typeof candidate === "object" &&
                  candidate !== null &&
                  "rowIndex" in candidate,
              ).length ?? 0,
            invalidRowCount: stored.parseErrors?.length ?? 0,
            attempt: activePreview.attempt,
            matches: stored.matches ?? { matchesByRow: [], crossRowGroups: [] },
            candidates: stored.candidates ?? [],
            parseErrors: stored.parseErrors ?? [],
          };
        }

        const rows = await tx
          .select()
          .from(s.importSessionRow)
          .where(
            and(
              eq(s.importSessionRow.importSessionId, input.importSessionId),
              isNull(s.importSessionRow.supersededAt),
            ),
          )
          .orderBy(asc(s.importSessionRow.rowIndex));

        const validRows = rows.filter((row) => row.status === "valid");
        const invalidRows = rows.filter((row) => row.status === "invalid");
        const externalRowKeys = validRows
          .map((row) => row.externalRowKey)
          .filter((key): key is string => typeof key === "string");
        const priorRows =
          externalRowKeys.length > 0
            ? await tx
                .select({
                  externalRowKey: s.importSessionRow.externalRowKey,
                  firstName: s.importSessionRow.firstName,
                  lastNamePrefix: s.importSessionRow.lastNamePrefix,
                  lastName: s.importSessionRow.lastName,
                  dateOfBirth: s.importSessionRow.dateOfBirth,
                  birthCity: s.importSessionRow.birthCity,
                  birthCountry: s.importSessionRow.birthCountry,
                  email: s.importSessionRow.email,
                  tags: s.importSessionRow.tags,
                  rawPayload: s.importSessionRow.rawPayload,
                  targetPersonId: s.importSessionRowCommit.targetPersonId,
                  personFirstName: s.person.firstName,
                  personLastNamePrefix: s.person.lastNamePrefix,
                  personLastName: s.person.lastName,
                  personDateOfBirth: s.person.dateOfBirth,
                  personBirthCity: s.person.birthCity,
                })
                .from(s.importSessionRow)
                .innerJoin(
                  s.importSession,
                  eq(s.importSession.id, s.importSessionRow.importSessionId),
                )
                .innerJoin(
                  s.importSessionRowCommit,
                  eq(
                    s.importSessionRowCommit.importSessionRowId,
                    s.importSessionRow.id,
                  ),
                )
                .innerJoin(
                  s.person,
                  eq(s.person.id, s.importSessionRowCommit.targetPersonId),
                )
                .where(
                  and(
                    eq(s.importSession.locationId, session.locationId),
                    eq(s.importSession.targetCohortId, session.targetCohortId),
                    eq(s.importSession.sourceSystem, session.sourceSystem),
                    eq(s.importSession.status, "committed"),
                    ne(s.importSession.id, session.id),
                    inArray(s.importSessionRow.externalRowKey, externalRowKeys),
                    sql`${s.importSessionRowCommit.targetPersonId} IS NOT NULL`,
                  ),
                )
                .orderBy(
                  desc(s.importSession.generation),
                  desc(s.importSessionRow.revision),
                )
            : [];
        const priorByExternalRowKey = new Map<
          string,
          (typeof priorRows)[number]
        >();
        for (const prior of priorRows) {
          if (!prior.externalRowKey) continue;
          if (priorByExternalRowKey.has(prior.externalRowKey)) continue;
          priorByExternalRowKey.set(prior.externalRowKey, prior);
        }
        const priorDecisionByRowIndex = new Map<
          number,
          {
            equal: boolean;
            targetPersonId: string;
            person: {
              firstName: string;
              lastNamePrefix: string | null;
              lastName: string | null;
              dateOfBirth: string | null;
              birthCity: string | null;
            };
          }
        >();
        for (const row of validRows) {
          if (!row.externalRowKey) continue;
          const prior = priorByExternalRowKey.get(row.externalRowKey);
          if (!prior?.targetPersonId) continue;
          priorDecisionByRowIndex.set(row.rowIndex, {
            equal: importRowFingerprint(row) === importRowFingerprint(prior),
            targetPersonId: prior.targetPersonId,
            person: {
              firstName: prior.personFirstName,
              lastNamePrefix: prior.personLastNamePrefix,
              lastName: prior.personLastName,
              dateOfBirth: prior.personDateOfBirth,
              birthCity: prior.personBirthCity,
            },
          });
        }

        const preview = await previewBulkImport({
          locationId: session.locationId,
          performedByPersonId: input.performedByPersonId,
          targetCohortId: session.targetCohortId,
          roles: input.roles,
          candidates: validRows.map((row) => ({
            rowIndex: row.rowIndex,
            firstName: row.firstName ?? "",
            lastName: row.lastName,
            lastNamePrefix: row.lastNamePrefix,
            dateOfBirth: row.dateOfBirth ?? "",
            birthCity: row.birthCity ?? "",
            birthCountry: row.birthCountry ?? "",
            email: row.email,
          })),
          parseErrors: invalidRows.map((row) => ({
            rowIndex: row.rowIndex,
            error: Array.isArray(row.validationErrors)
              ? row.validationErrors
                  .map((message) =>
                    typeof message === "object" &&
                    message !== null &&
                    "message" in message
                      ? String(message.message)
                      : String(message),
                  )
                  .join("; ")
              : "Invalid import row",
          })),
        });
        const previewMatches = preview.matches as {
          matchesByRow: {
            rowIndex: number;
            candidates: {
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
            }[];
          }[];
          crossRowGroups: unknown[];
        };
        for (const [rowIndex, priorDecision] of priorDecisionByRowIndex) {
          let match = previewMatches.matchesByRow.find(
            (entry) => entry.rowIndex === rowIndex,
          );
          if (!match) {
            match = { rowIndex, candidates: [] };
            previewMatches.matchesByRow.push(match);
          }
          const existingCandidate = match.candidates.find(
            (candidate) => candidate.personId === priorDecision.targetPersonId,
          );
          const reason = priorDecision.equal
            ? "import_session_unchanged_prior_commit"
            : "import_session_changed_since_prior_commit";
          const candidate = existingCandidate ?? {
            personId: priorDecision.targetPersonId,
            score: 200,
            reasons: [],
            firstName: priorDecision.person.firstName,
            lastName: priorDecision.person.lastName,
            lastNamePrefix: priorDecision.person.lastNamePrefix,
            dateOfBirth: priorDecision.person.dateOfBirth,
            birthCity: priorDecision.person.birthCity,
            certificateCount: 0,
            lastDiplomaIssuedAt: null,
            isAlreadyInTargetCohort: false,
          };
          candidate.score = Math.max(candidate.score, 200);
          candidate.reasons = Array.from(
            new Set([...candidate.reasons, reason]),
          );
          candidate.isAlreadyInTargetCohort = priorDecision.equal;
          if (!existingCandidate) {
            match.candidates.unshift(candidate);
          }
        }

        await tx
          .update(s.bulkImportPreview)
          .set({
            detectionSnapshot:
              buildImportSessionDetectionSnapshot(previewMatches),
            rowsParsed: {
              candidates: preview.candidates,
              roles: input.roles,
              matches: previewMatches,
              parseErrors: preview.parseErrors,
            },
          })
          .where(eq(s.bulkImportPreview.token, preview.previewToken));

        const importSessionPreview = await tx
          .insert(s.importSessionPreview)
          .values({
            importSessionId: input.importSessionId,
            bulkImportPreviewToken: preview.previewToken,
            materializedByPersonId: input.performedByPersonId,
            status: "active",
          })
          .returning({ id: s.importSessionPreview.id })
          .then(singleRow);

        await tx
          .update(s.importSession)
          .set({
            status: "reviewing",
            updatedAt: sql`NOW()`,
          })
          .where(eq(s.importSession.id, input.importSessionId));

        return {
          previewToken: preview.previewToken,
          importSessionPreviewId: importSessionPreview.id,
          validRowCount: validRows.length,
          invalidRowCount: invalidRows.length,
          attempt: preview.attempt,
          matches: previewMatches,
          candidates: preview.candidates,
          parseErrors: preview.parseErrors,
        };
      }),
  ),
);
