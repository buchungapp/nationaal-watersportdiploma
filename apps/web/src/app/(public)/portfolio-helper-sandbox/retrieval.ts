import "server-only";
import { AiCorpus } from "@nawadi/core";

// Retrieval adapter for the portfolio-helper-sandbox. Thin wrapper around
// the generic ai_corpus.getChunksForCriterium with PvB-specific defaults.
//
// Production (sandbox route) calls this with no exclusions.
// Eval mode passes excludeSourceIds to prevent self-leakage (the model
// peeking at the answer key when eval'ing a portfolio that was also ingested
// as a seed source).

export type RetrievedChunk = {
  content: string;
  wordCount: number;
  qualityScore: number | null;
  sourceIdentifier: string;
};

export async function getReferenceChunksForCriterium(input: {
  criteriumId: string;
  excludeSourceIds?: string[];
  maxResults?: number;
  forUserId?: string;
}): Promise<RetrievedChunk[]> {
  const rows = await AiCorpus.getChunksForCriterium({
    criteriumId: input.criteriumId,
    excludeSourceIds: input.excludeSourceIds ?? [],
    maxResults: input.maxResults ?? 2,
    forUserId: input.forUserId,
  });
  return rows.map((r) => ({
    content: r.content,
    wordCount: r.wordCount,
    qualityScore: r.qualityScore,
    sourceIdentifier: r.sourceIdentifier,
  }));
}

// Retrieve pairs for a batch of criteriumIds (one werkproces at a time).
// Returns a Map so callers can look up by criteriumId in O(1) while building
// the prompt.
export async function getReferenceChunksBatch(input: {
  criteriumIds: string[];
  excludeSourceIds?: string[];
  maxResultsPerCriterium?: number;
  forUserId?: string;
}): Promise<Map<string, RetrievedChunk[]>> {
  const results = await Promise.all(
    input.criteriumIds.map(async (criteriumId) => {
      const chunks = await getReferenceChunksForCriterium({
        criteriumId,
        excludeSourceIds: input.excludeSourceIds,
        maxResults: input.maxResultsPerCriterium,
        forUserId: input.forUserId,
      });
      return [criteriumId, chunks] as const;
    }),
  );
  return new Map(results);
}
