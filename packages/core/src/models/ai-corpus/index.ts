export * from "./outline.js";

import { schema as s } from "@nawadi/db";
import {
  and,
  desc,
  eq,
  inArray,
  isNull,
  notInArray,
  or,
  type SQLWrapper,
} from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const domainSchema = z.enum([
  "pvb_portfolio",
  "diplomalijn",
  "knowledge_center",
]);
const consentLevelSchema = z.enum(["seed", "opt_in_shared", "user_only"]);

const publicConsentLevels: Array<"seed" | "opt_in_shared"> = [
  "seed",
  "opt_in_shared",
];

const chunkInputSchema = z.object({
  content: z.string().min(1),
  wordCount: z.number().int().nonnegative(),
  qualityScore: z.number().min(0).max(99.99).nullable(),
  criteriumId: uuidSchema.nullable(),
  werkprocesId: uuidSchema.nullable(),
  metadata: z.record(z.unknown()).default({}),
});

export const upsertSourceWithChunksInput = z.object({
  source: z.object({
    domain: domainSchema,
    sourceIdentifier: z.string().min(1),
    sourceHash: z.string().min(32),
    content: z.string().min(1),
    consentLevel: consentLevelSchema,
    contributedByUserId: uuidSchema.nullable(),
    profielId: uuidSchema.nullable(),
    niveauRang: z.number().int().nullable(),
    metadata: z.record(z.unknown()).default({}),
    charCount: z.number().int().nonnegative(),
    pageCount: z.number().int().nullable(),
  }),
  chunks: z.array(chunkInputSchema),
});

export const upsertSourceWithChunksOutput = z.object({
  sourceId: uuidSchema,
  chunkCount: z.number().int().nonnegative(),
  inserted: z.boolean(), // false if source already existed (idempotent re-run)
});

export const getChunksForCriteriumInput = z.object({
  criteriumId: uuidSchema,
  excludeSourceIds: z.array(uuidSchema).default([]),
  maxResults: z.number().int().min(1).max(10).default(2),
  /**
   * When provided, `user_only` rows owned by this user are included alongside
   * the public (seed + opt_in_shared) rows. When absent, only public rows.
   */
  forUserId: uuidSchema.optional(),
});

export const getChunksForCriteriumOutput = z.array(
  z.object({
    chunkId: uuidSchema,
    sourceId: uuidSchema,
    content: z.string(),
    wordCount: z.number().int(),
    qualityScore: z.number().nullable(),
    sourceIdentifier: z.string(),
  }),
);

// Admin/debug listing deliberately omitted from Phase 1 — add when we have
// a consuming surface. Keeps the model surface minimal to what ingest + eval
// actually need.

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------

/**
 * Idempotent source + chunk ingestion.
 *
 * If a source with the same (domain, sourceHash) already exists, returns its
 * id and `inserted: false` without touching chunks. To force re-ingest, revoke
 * the source first (set revokedAt) or delete it.
 */
export const upsertSourceWithChunks = wrapCommand(
  "aiCorpus.source.upsertWithChunks",
  withZod(
    upsertSourceWithChunksInput,
    upsertSourceWithChunksOutput,
    async (input) => {
      return withTransaction(async (tx) => {
        const existing = await tx
          .select({ id: s.source.id })
          .from(s.source)
          .where(
            and(
              eq(s.source.domain, input.source.domain),
              eq(s.source.sourceHash, input.source.sourceHash),
            ),
          )
          .then((r) => r[0]);

        if (existing) {
          return { sourceId: existing.id, chunkCount: 0, inserted: false };
        }

        const inserted = await tx
          .insert(s.source)
          .values({
            domain: input.source.domain,
            sourceIdentifier: input.source.sourceIdentifier,
            sourceHash: input.source.sourceHash,
            content: input.source.content,
            consentLevel: input.source.consentLevel,
            contributedByUserId: input.source.contributedByUserId,
            profielId: input.source.profielId,
            niveauRang: input.source.niveauRang,
            metadata: input.source.metadata,
            charCount: input.source.charCount,
            pageCount: input.source.pageCount,
          })
          .returning({ id: s.source.id })
          .then((r) => r[0]);

        if (!inserted) {
          throw new Error("Insert source returned no rows");
        }

        if (input.chunks.length > 0) {
          await tx.insert(s.chunk).values(
            input.chunks.map((c) => ({
              sourceId: inserted.id,
              content: c.content,
              wordCount: c.wordCount,
              qualityScore:
                c.qualityScore === null ? null : c.qualityScore.toString(),
              criteriumId: c.criteriumId,
              werkprocesId: c.werkprocesId,
              metadata: c.metadata,
            })),
          );
        }

        return {
          sourceId: inserted.id,
          chunkCount: input.chunks.length,
          inserted: true,
        };
      });
    },
  ),
);

/**
 * Retrieve the highest-quality chunks for a given criterium, subject to
 * consent and self-exclusion.
 *
 * Visibility rules (application-layer, no RLS):
 *   - Always: sources with consent_level in ('seed', 'opt_in_shared') AND not revoked
 *   - If forUserId is set: also include user_only sources owned by that user
 *   - excludeSourceIds are dropped (used during eval to prevent self-leakage)
 */
export const getChunksForCriterium = wrapQuery(
  "aiCorpus.chunk.getForCriterium",
  withZod(
    getChunksForCriteriumInput,
    getChunksForCriteriumOutput,
    async (input) => {
      const query = useQuery();

      const publicClause = inArray(s.source.consentLevel, publicConsentLevels);

      const userClause: SQLWrapper | undefined = input.forUserId
        ? and(
            eq(s.source.consentLevel, "user_only"),
            eq(s.source.contributedByUserId, input.forUserId),
          )
        : undefined;

      const visibilityClause = userClause
        ? or(publicClause, userClause)
        : publicClause;

      const whereClauses: SQLWrapper[] = [
        eq(s.chunk.criteriumId, input.criteriumId),
        isNull(s.source.revokedAt),
      ];
      if (visibilityClause) whereClauses.push(visibilityClause);
      if (input.excludeSourceIds.length > 0) {
        whereClauses.push(
          notInArray(s.chunk.sourceId, input.excludeSourceIds),
        );
      }

      const rows = await query
        .select({
          chunkId: s.chunk.id,
          sourceId: s.chunk.sourceId,
          content: s.chunk.content,
          wordCount: s.chunk.wordCount,
          qualityScore: s.chunk.qualityScore,
          sourceIdentifier: s.source.sourceIdentifier,
        })
        .from(s.chunk)
        .innerJoin(s.source, eq(s.source.id, s.chunk.sourceId))
        .where(and(...whereClauses))
        .orderBy(desc(s.chunk.qualityScore))
        .limit(input.maxResults);

      return rows.map((r) => ({
        chunkId: r.chunkId,
        sourceId: r.sourceId,
        content: r.content,
        wordCount: r.wordCount,
        qualityScore:
          r.qualityScore === null ? null : Number(r.qualityScore),
        sourceIdentifier: r.sourceIdentifier,
      }));
    },
  ),
);

