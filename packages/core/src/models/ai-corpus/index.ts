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
  sql,
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
  "artefact",
]);
const consentLevelSchema = z.enum(["seed", "opt_in_shared", "user_only"]);
const richtingSchema = z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]);

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
    richting: richtingSchema.nullable(),
    niveauRang: z.number().int().nullable(),
    // chat_id is required when domain === "artefact" (caller enforces).
    // Leave null for every other domain.
    chatId: uuidSchema.nullable(),
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
            richting: input.source.richting,
            niveauRang: input.source.niveauRang,
            chatId: input.source.chatId,
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
        whereClauses.push(notInArray(s.chunk.sourceId, input.excludeSourceIds));
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
        qualityScore: r.qualityScore === null ? null : Number(r.qualityScore),
        sourceIdentifier: r.sourceIdentifier,
      }));
    },
  ),
);

// ---- User-owned prior portfolios ----
//
// Helpers for the "kandidaat uploads their prior PvB portfolios as
// reference material" flow. Access is strictly user-scoped:
// consent_level must be "user_only" AND contributedByUserId must match.
// No cross-user visibility here; the public retrieval helper above is
// the only path that returns seed + opt_in_shared chunks.

export const listUserPriorSourcesInput = z.object({
  userId: uuidSchema,
});

/**
 * Shape of the `metadata.coverage` blob stamped onto pvb_portfolio
 * sources by the web upload pipeline. Optional — legacy rows won't
 * carry it. Kept permissive (passthrough) so we don't re-validate
 * user-supplied strings here; the upload action has already filtered
 * to known-valid kerntaakCodes before persisting.
 */
const coverageScopeSchema = z
  .union([
    z.object({ type: z.literal("full_profiel") }),
    z.object({
      type: z.literal("kerntaken"),
      kerntaakCodes: z.array(z.string()),
    }),
  ])
  .nullable();

export const listUserPriorSourcesOutput = z.array(
  z.object({
    sourceId: uuidSchema,
    sourceIdentifier: z.string(),
    profielId: uuidSchema.nullable(),
    richting: richtingSchema.nullable(),
    niveauRang: z.number().int().nullable(),
    coverage: coverageScopeSchema,
    charCount: z.number().int(),
    pageCount: z.number().int().nullable(),
    createdAt: z.string(),
    chunkCount: z.number().int(),
  }),
);

/**
 * List all of a user's prior-portfolio sources (consent_level="user_only")
 * for display in the management UI. Includes a cheap chunk-count so the
 * list can show how much content is available per source.
 */
export const listUserPriorSources = wrapQuery(
  "aiCorpus.source.listUserPrior",
  withZod(
    listUserPriorSourcesInput,
    listUserPriorSourcesOutput,
    async (input) => {
      const query = useQuery();
      const sources = await query
        .select({
          id: s.source.id,
          sourceIdentifier: s.source.sourceIdentifier,
          profielId: s.source.profielId,
          richting: s.source.richting,
          niveauRang: s.source.niveauRang,
          metadata: s.source.metadata,
          charCount: s.source.charCount,
          pageCount: s.source.pageCount,
          createdAt: s.source.createdAt,
        })
        .from(s.source)
        .where(
          and(
            eq(s.source.consentLevel, "user_only"),
            eq(s.source.contributedByUserId, input.userId),
            isNull(s.source.revokedAt),
          ),
        )
        .orderBy(desc(s.source.createdAt));

      if (sources.length === 0) return [];

      // Count chunks per source in one pass so the list render doesn't
      // N+1. We'd use a SUM + GROUP BY but Drizzle's raw SQL here keeps
      // the surface simple.
      const sourceIds = sources.map((src) => src.id);
      const counts = await query
        .select({
          sourceId: s.chunk.sourceId,
        })
        .from(s.chunk)
        .where(inArray(s.chunk.sourceId, sourceIds));
      const countBySource = new Map<string, number>();
      for (const row of counts) {
        countBySource.set(
          row.sourceId,
          (countBySource.get(row.sourceId) ?? 0) + 1,
        );
      }

      return sources.map((src) => ({
        sourceId: src.id,
        sourceIdentifier: src.sourceIdentifier,
        profielId: src.profielId,
        richting: src.richting,
        niveauRang: src.niveauRang,
        // Defensive narrowing: metadata is typed as a record but we
        // persist a known shape from the upload pipeline. Parse via
        // the schema so stale/legacy rows without a coverage field
        // yield null rather than crashing the listing query.
        coverage:
          coverageScopeSchema.safeParse(
            (src.metadata as { coverage?: unknown })?.coverage ?? null,
          ).data ?? null,
        charCount: src.charCount,
        pageCount: src.pageCount,
        createdAt: src.createdAt,
        chunkCount: countBySource.get(src.id) ?? 0,
      }));
    },
  ),
);

export const matchQualitySchema = z.enum(["profiel", "richting", "other"]);

export const getUserPriorChunksInput = z.object({
  userId: uuidSchema,
  /**
   * Upper bound on total fragments returned. The result is *diversified*
   * round-robin across sources before this cap applies, so the cap
   * determines breadth+depth rather than "which single source wins".
   * Default 12 comfortably covers 3–4 uploads with a few fragments each
   * without overflowing the model's context window.
   */
  maxResults: z.number().int().min(1).max(40).default(12),
  /**
   * When provided, each returned fragment is tagged with `matchQuality`
   * reflecting how tightly its source aligns with this chat:
   *   - "profiel": source.profielId === scope.profielId (tightest match)
   *   - "richting": same richting, different profiel (content probably
   *     still on-topic: same domain, different qualification level)
   *   - "other": different richting entirely (instructeur portfolio
   *     surfaced in a leercoach session). Still useful to the LLM as
   *     voice / reflection-style reference even when the *content*
   *     isn't topical.
   * Scope is NEVER used as a hard filter — we always return the user's
   * uploads and let the model decide. This deliberately surfaces
   * cross-richting uploads so the leercoach can at minimum comment on
   * writing style rather than pretend nothing was uploaded.
   */
  scopeProfielId: uuidSchema.optional(),
  scopeRichting: richtingSchema.optional(),
});

export const getUserPriorChunksOutput = z.array(
  z.object({
    chunkId: uuidSchema,
    sourceId: uuidSchema,
    sourceIdentifier: z.string(),
    profielId: uuidSchema.nullable(),
    richting: richtingSchema.nullable(),
    niveauRang: z.number().int().nullable(),
    matchQuality: matchQualitySchema,
    content: z.string(),
    wordCount: z.number().int(),
  }),
);

/**
 * Retrieve the user's prior-portfolio chunks, diversified across
 * sources so every upload gets a shot at the N-slot budget.
 *
 * Tiering (tight → loose) — scope is a sort hint, never a hard filter:
 *   1. Profiel-exact matches (if scopeProfielId provided)
 *   2. Same-richting matches
 *   3. Everything else
 *   4. Within each tier: newest-source first, chunk-insertion order
 *
 * Diversification: within the above tier-sorted list we round-robin
 * across sources — first chunk of each source first, then second
 * chunk of each, etc. This prevents the naïve `LIMIT maxResults`
 * failure mode where a single source with more chunks starves the
 * other uploads entirely (e.g. 5-cap + 3 uploads yielded 5/0/0
 * instead of the intuitive 2/2/1 spread).
 *
 * Each row carries a `matchQuality` classifier so the LLM can weight
 * content vs. style-only observations.
 *
 * For v1 we don't do keyword search. A user's chunk volume is bounded
 * (a handful of uploads × ~30 chunks each), so we fetch all candidates
 * and diversify in memory rather than coax Postgres window functions
 * through Drizzle. Revisit when per-user volume crosses ~500.
 */
export const getUserPriorChunks = wrapQuery(
  "aiCorpus.chunk.getUserPrior",
  withZod(getUserPriorChunksInput, getUserPriorChunksOutput, async (input) => {
    const query = useQuery();

    const whereClauses: SQLWrapper[] = [
      eq(s.source.consentLevel, "user_only"),
      eq(s.source.contributedByUserId, input.userId),
      isNull(s.source.revokedAt),
    ];

    // Tier ordering via boolean `ORDER BY <expr> DESC` (true first).
    const profielTierOrder = input.scopeProfielId
      ? sql`(${s.source.profielId} = ${input.scopeProfielId}) desc`
      : sql`true`;
    const richtingTierOrder = input.scopeRichting
      ? sql`(${s.source.richting} = ${input.scopeRichting}) desc`
      : sql`true`;

    // Fetch ALL candidate chunks (no SQL-side LIMIT) so the
    // diversification step has the full set to draw from. The
    // bounded user-upload model makes this safe in practice.
    const rows = await query
      .select({
        chunkId: s.chunk.id,
        sourceId: s.chunk.sourceId,
        sourceIdentifier: s.source.sourceIdentifier,
        profielId: s.source.profielId,
        richting: s.source.richting,
        niveauRang: s.source.niveauRang,
        content: s.chunk.content,
        wordCount: s.chunk.wordCount,
        createdAt: s.source.createdAt,
      })
      .from(s.chunk)
      .innerJoin(s.source, eq(s.source.id, s.chunk.sourceId))
      .where(and(...whereClauses))
      .orderBy(
        profielTierOrder,
        richtingTierOrder,
        desc(s.source.createdAt),
        s.chunk.createdAt,
      );

    // Group by sourceId while preserving the tier-sorted source
    // order. The Map keeps insertion order, so the first time we
    // see a source dictates its queue position in the round-robin.
    const bySource = new Map<string, typeof rows>();
    for (const r of rows) {
      const existing = bySource.get(r.sourceId);
      if (existing) existing.push(r);
      else bySource.set(r.sourceId, [r]);
    }

    // Round-robin across source queues until we hit maxResults or
    // run out of chunks. Round N takes the Nth chunk from every
    // source that has one.
    const queues = Array.from(bySource.values());
    const diversified: (typeof rows)[number][] = [];
    for (
      let round = 0;
      diversified.length < input.maxResults && queues.some((q) => q[round]);
      round++
    ) {
      for (const queue of queues) {
        if (diversified.length >= input.maxResults) break;
        const chunk = queue[round];
        if (chunk) diversified.push(chunk);
      }
    }

    // Classify each row by match tightness so the LLM can weight
    // content vs. style-only observations.
    const scopeProfielId = input.scopeProfielId;
    const scopeRichting = input.scopeRichting;
    return diversified.map((r) => {
      const matchQuality: "profiel" | "richting" | "other" =
        scopeProfielId && r.profielId === scopeProfielId
          ? "profiel"
          : scopeRichting && r.richting === scopeRichting
            ? "richting"
            : "other";
      return {
        chunkId: r.chunkId,
        sourceId: r.sourceId,
        sourceIdentifier: r.sourceIdentifier,
        profielId: r.profielId,
        richting: r.richting,
        niveauRang: r.niveauRang,
        matchQuality,
        content: r.content,
        wordCount: r.wordCount,
      };
    });
  }),
);

export const revokeUserPriorSourceInput = z.object({
  userId: uuidSchema,
  sourceId: uuidSchema,
});

/**
 * Revoke a prior-portfolio source. Soft-delete via `revoked_at` so the
 * data stays for audit but stops appearing in retrieval. userId match
 * prevents cross-user revocation even with a guessed sourceId.
 */
export const revokeUserPriorSource = wrapCommand(
  "aiCorpus.source.revokeUserPrior",
  withZod(revokeUserPriorSourceInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.source)
        .set({ revokedAt: new Date().toISOString() })
        .where(
          and(
            eq(s.source.id, input.sourceId),
            eq(s.source.consentLevel, "user_only"),
            eq(s.source.contributedByUserId, input.userId),
          ),
        );
    });
  }),
);

// ---- Per-chat artefacten ----
//
// Artefacten are input material a kandidaat uploads inside a specific
// leercoach chat (opleidingsplannen, WhatsApp screenshots, emails,
// notities). Everything is:
//   - domain="artefact"
//   - consent_level="user_only"
//   - chatId set (required — retrieval joins on it)
//   - contributedByUserId set (defense-in-depth against chat-id-guessing)
//
// Retrieval is chat-scoped: there's no cross-chat reuse, no profiel
// tiering. A separate helper from the portfolio path because the
// invariants and shape of the returned data are different enough that
// sharing one function would bury the domain distinction.

export const listArtefactsForChatInput = z.object({
  chatId: uuidSchema,
  userId: uuidSchema,
});

/**
 * One artefact as surfaced by the `listArtefacten` leercoach tool and
 * the chat UI's chip strip. `summary` is pre-computed at upload time
 * so the cheap "what's in this chat?" call never pays for another LLM
 * round-trip.
 */
const artefactListRowSchema = z.object({
  artefactId: uuidSchema,
  label: z.string(),
  artefactType: z.enum(["pdf", "docx", "text", "image"]),
  summary: z.string(),
  chunkCount: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export const listArtefactsForChatOutput = z.array(artefactListRowSchema);

/**
 * List every non-revoked artefact for a chat the user owns. The userId
 * filter is defence-in-depth: a well-behaved caller has already verified
 * chat ownership, but we double-check at the query level so a rogue
 * `chatId` can't leak someone else's uploads.
 */
export const listArtefactsForChat = wrapQuery(
  "aiCorpus.source.listArtefactsForChat",
  withZod(
    listArtefactsForChatInput,
    listArtefactsForChatOutput,
    async (input) => {
      const query = useQuery();

      const sources = await query
        .select({
          id: s.source.id,
          metadata: s.source.metadata,
          createdAt: s.source.createdAt,
        })
        .from(s.source)
        .where(
          and(
            eq(s.source.domain, "artefact"),
            eq(s.source.chatId, input.chatId),
            eq(s.source.contributedByUserId, input.userId),
            isNull(s.source.revokedAt),
          ),
        )
        .orderBy(desc(s.source.createdAt));

      if (sources.length === 0) return [];

      const sourceIds = sources.map((r) => r.id);
      const counts = await query
        .select({ sourceId: s.chunk.sourceId })
        .from(s.chunk)
        .where(inArray(s.chunk.sourceId, sourceIds));
      const countBySource = new Map<string, number>();
      for (const row of counts) {
        countBySource.set(
          row.sourceId,
          (countBySource.get(row.sourceId) ?? 0) + 1,
        );
      }

      return sources.map((r) => {
        const meta = r.metadata as {
          label?: unknown;
          artefactType?: unknown;
          summary?: unknown;
        };
        const artefactType = (() => {
          const t =
            typeof meta.artefactType === "string" ? meta.artefactType : "";
          return t === "pdf" || t === "docx" || t === "image" ? t : "text";
        })();
        return {
          artefactId: r.id,
          label: typeof meta.label === "string" ? meta.label : "Artefact",
          artefactType,
          summary:
            typeof meta.summary === "string" && meta.summary.length > 0
              ? meta.summary
              : "",
          chunkCount: countBySource.get(r.id) ?? 0,
          createdAt: r.createdAt,
        };
      });
    },
  ),
);

export const getArtefactChunksInput = z.object({
  artefactId: uuidSchema,
  userId: uuidSchema,
  /**
   * Optional substring filter. Matched case-insensitively against chunk
   * content; scores chunks by how many word-boundary matches they contain
   * (simplest possible relevance signal). When omitted we return the
   * first `maxResults` chunks in insertion order.
   */
  query: z.string().trim().min(1).max(200).optional(),
  maxResults: z.number().int().min(1).max(40).default(10),
});

const artefactChunkRowSchema = z.object({
  chunkId: uuidSchema,
  content: z.string(),
  wordCount: z.number().int(),
});

export const getArtefactChunksOutput = z.object({
  artefactId: uuidSchema,
  label: z.string(),
  artefactType: z.enum(["pdf", "docx", "text", "image"]),
  summary: z.string(),
  totalChunks: z.number().int().nonnegative(),
  chunks: z.array(artefactChunkRowSchema),
});

/**
 * Read chunks from one artefact, optionally narrowed by a query string.
 * Does NOT implement real FTS — this is naive substring + word-boundary
 * scoring in the application layer. Good enough for the handful of
 * chunks a single artefact produces; revisit when we add embeddings.
 *
 * Ownership check: we require artefactId + userId match on the same
 * row, so a leaked artefactId from another user won't return content.
 */
export const getArtefactChunks = wrapQuery(
  "aiCorpus.chunk.getArtefact",
  withZod(getArtefactChunksInput, getArtefactChunksOutput, async (input) => {
    const query = useQuery();

    const sourceRow = await query
      .select({
        id: s.source.id,
        metadata: s.source.metadata,
      })
      .from(s.source)
      .where(
        and(
          eq(s.source.id, input.artefactId),
          eq(s.source.domain, "artefact"),
          eq(s.source.contributedByUserId, input.userId),
          isNull(s.source.revokedAt),
        ),
      )
      .then((r) => r[0]);

    if (!sourceRow) {
      return {
        artefactId: input.artefactId,
        label: "",
        artefactType: "text" as const,
        summary: "",
        totalChunks: 0,
        chunks: [],
      };
    }

    const allChunks = await query
      .select({
        id: s.chunk.id,
        content: s.chunk.content,
        wordCount: s.chunk.wordCount,
        createdAt: s.chunk.createdAt,
      })
      .from(s.chunk)
      .where(eq(s.chunk.sourceId, sourceRow.id))
      .orderBy(s.chunk.createdAt);

    const meta = sourceRow.metadata as {
      label?: unknown;
      artefactType?: unknown;
      summary?: unknown;
    };
    const label = typeof meta.label === "string" ? meta.label : "Artefact";
    const artefactType = (() => {
      const t = typeof meta.artefactType === "string" ? meta.artefactType : "";
      return t === "pdf" || t === "docx" || t === "image" ? t : "text";
    })();
    const summary = typeof meta.summary === "string" ? meta.summary : "";

    // Rank by number of case-insensitive matches of the query.
    // Ties break on insertion order (already sorted that way).
    const ranked = (() => {
      if (!input.query) return allChunks;
      const needle = input.query.toLowerCase();
      const withScore = allChunks
        .map((c) => {
          const hay = c.content.toLowerCase();
          let score = 0;
          let idx = 0;
          for (;;) {
            const found = hay.indexOf(needle, idx);
            if (found === -1) break;
            score++;
            idx = found + needle.length;
          }
          return { chunk: c, score };
        })
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      // Fall back to insertion order when the query matches nothing —
      // better to return SOMETHING than to claim the artefact is empty.
      return withScore.length > 0 ? withScore.map((x) => x.chunk) : allChunks;
    })();

    return {
      artefactId: sourceRow.id,
      label,
      artefactType,
      summary,
      totalChunks: allChunks.length,
      chunks: ranked.slice(0, input.maxResults).map((c) => ({
        chunkId: c.id,
        content: c.content,
        wordCount: c.wordCount,
      })),
    };
  }),
);

export const revokeArtefactInput = z.object({
  artefactId: uuidSchema,
  userId: uuidSchema,
});

/**
 * Soft-delete an artefact via `revoked_at`. Identical semantics to
 * `revokeUserPriorSource` but scoped to the artefact domain — keeps the
 * two code paths from conflating when we eventually add per-domain
 * cleanup policies (artefacten may get hard-deleted with their parent
 * chat; portfolios stay for audit).
 */
export const revokeArtefact = wrapCommand(
  "aiCorpus.source.revokeArtefact",
  withZod(revokeArtefactInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      await tx
        .update(s.source)
        .set({ revokedAt: new Date().toISOString() })
        .where(
          and(
            eq(s.source.id, input.artefactId),
            eq(s.source.domain, "artefact"),
            eq(s.source.consentLevel, "user_only"),
            eq(s.source.contributedByUserId, input.userId),
          ),
        );
    });
  }),
);
