// Seed-corpus ingest: reads anonymised portfolios from
// .tmp/portfolio-corpus/anonymized/, extracts (criteriumId, bewijs) pairs via
// LLM, and upserts source + chunks into ai_corpus tables via the core model.
//
// Idempotent: re-running only inserts sources whose (domain, source_hash) is
// new. Existing rows are skipped (no chunk update). To force re-ingest, revoke
// or delete the offending source rows.
//
// Run:
//   pnpm -C apps/web corpus:ingest-seed

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gateway } from "@ai-sdk/gateway";
import { AiCorpus, withDatabase } from "@nawadi/core";
import { generateObject } from "ai";
import pg from "pg";
import { Agent, setGlobalDispatcher } from "undici";
import { z } from "zod";
import { concretenessPer100, wordCount } from "./eval-runner.ts";
import { EVAL_MATRIX } from "./eval-matrix.config.ts";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
} from "./shared.ts";

// Same timeout posture as eval; extraction on 25k-word portfolios exceeds
// undici's default headers timeout.
setGlobalDispatcher(
  new Agent({
    headersTimeout: 600_000,
    bodyTimeout: 600_000,
    keepAliveTimeout: 600_000,
    connectTimeout: 30_000,
  }),
);

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "AI_GATEWAY_API_KEY not set. Add to apps/web/.env.local and re-run.",
  );
  process.exit(1);
}

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const MODEL_ID = "anthropic/claude-sonnet-4-5";

type RubricCriterium = {
  id: string;
  werkprocesId: string;
  werkprocesTitel: string;
  title: string;
  omschrijving: string;
};

type RubricContext = {
  profielId: string;
  profielTitel: string;
  niveauRang: number;
  criteria: RubricCriterium[];
};

async function loadRubricFlat(profielTitel: string): Promise<RubricContext> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const res = await client.query<{
      profielId: string;
      profielTitel: string;
      niveauRang: number;
      werkprocesId: string | null;
      werkprocesTitel: string | null;
      criteriumId: string | null;
      criteriumTitel: string | null;
      omschrijving: string | null;
    }>(
      `
      SELECT
        kp.id AS "profielId",
        kp.titel AS "profielTitel",
        n.rang AS "niveauRang",
        wp.id AS "werkprocesId",
        wp.titel AS "werkprocesTitel",
        bc.id AS "criteriumId",
        bc.title AS "criteriumTitel",
        bc.omschrijving AS omschrijving
      FROM kss.kwalificatieprofiel kp
      JOIN kss.niveau n ON n.id = kp.niveau_id
      LEFT JOIN kss.kerntaak kt ON kt.kwalificatieprofiel_id = kp.id
      LEFT JOIN kss.werkproces wp ON wp.kerntaak_id = kt.id
      LEFT JOIN kss.beoordelingscriterium bc ON bc.werkproces_id = wp.id
      WHERE kp.titel = $1
      ORDER BY kt.rang NULLS LAST, wp.rang NULLS LAST, bc.rang NULLS LAST
      `,
      [profielTitel],
    );

    if (res.rows.length === 0) {
      throw new Error(`Profiel not found: ${profielTitel}`);
    }

    const first = res.rows[0]!;
    const criteria: RubricCriterium[] = [];
    for (const row of res.rows) {
      if (!row.werkprocesId || !row.criteriumId) continue;
      criteria.push({
        id: row.criteriumId,
        werkprocesId: row.werkprocesId,
        werkprocesTitel: row.werkprocesTitel ?? "",
        title: row.criteriumTitel ?? "",
        omschrijving: row.omschrijving ?? "",
      });
    }

    return {
      profielId: first.profielId,
      profielTitel: first.profielTitel,
      niveauRang: first.niveauRang,
      criteria,
    };
  } finally {
    await client.end();
  }
}

const GoldenPairsSchema = z.object({
  pairs: z
    .array(
      z.object({
        criteriumId: z.string().uuid(),
        goldenBewijs: z.string().min(80),
      }),
    )
    .min(0)
    .max(300),
});

async function extractPairs(args: {
  portfolioText: string;
  rubric: RubricContext;
}): Promise<Array<{ criteriumId: string; werkprocesId: string; bewijs: string }>> {
  const { portfolioText, rubric } = args;

  const criteriaList = rubric.criteria
    .map(
      (c) =>
        `- werkproces "${c.werkprocesTitel}" / criterium "${c.title}" (id: ${c.id}): ${c.omschrijving}`,
    )
    .join("\n");

  const { object } = await generateObject({
    model: gateway(MODEL_ID),
    schema: GoldenPairsSchema,
    system: `Je ontleedt een Nederlands PvB-portfolio in (criterium, bewijs) paren.

Voor elk criterium uit de rubriek waar de portfolio-tekst direct naar toe werkt, knip je de bewijs-paragraaf eruit en koppel je die aan het criteriumId.

REGELS:
- Gebruik alleen bewijs dat letterlijk uit de portfolio komt. Geen samenvatting, geen parafrase.
- Één criterium kan maximaal één bewijs-blok hebben. Kies de meest representatieve passage.
- Als een criterium niet wordt gedekt, sla het over. Dus NIET verplicht om voor elk criterium iets te leveren.
- Bewijs-lengte: minimaal 80 woorden, ideaal 200-500.
- criteriumId moet letterlijk een van de id's uit de rubriek zijn.`,
    prompt: `Rubriek:\n${criteriaList}\n\nPortfolio-tekst:\n---\n${portfolioText}\n---\n\nOntleed in (criteriumId, goldenBewijs) paren.`,
    temperature: 0,
  });

  const validCriteriumIds = new Set(rubric.criteria.map((c) => c.id));
  const criteriumToWerkproces = new Map(
    rubric.criteria.map((c) => [c.id, c.werkprocesId]),
  );

  return object.pairs
    .filter((p) => validCriteriumIds.has(p.criteriumId))
    .map((p) => ({
      criteriumId: p.criteriumId,
      werkprocesId: criteriumToWerkproces.get(p.criteriumId)!,
      bewijs: p.goldenBewijs,
    }));
}

function sha256(text: string): string {
  return createHash("sha256").update(text).digest("hex");
}

type MatrixEntry = (typeof EVAL_MATRIX)[number];

async function ingestOne(entry: MatrixEntry): Promise<{
  skipped: boolean;
  reason?: string;
  sourceId?: string;
  chunkCount?: number;
}> {
  // Load anonymized portfolio
  let portfolio: AnonymizedPortfolio;
  try {
    portfolio = JSON.parse(
      readFileSync(join(ANONYMIZED_DIR, entry.portfolio), "utf8"),
    ) as AnonymizedPortfolio;
  } catch (e) {
    return {
      skipped: true,
      reason: `Could not read ${entry.portfolio}: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Load rubric
  let rubric: RubricContext;
  try {
    rubric = await loadRubricFlat(entry.profielTitel);
  } catch (e) {
    return {
      skipped: true,
      reason: e instanceof Error ? e.message : String(e),
    };
  }
  if (rubric.criteria.length === 0) {
    return {
      skipped: true,
      reason: `Rubric for "${entry.profielTitel}" has 0 criteria (stub).`,
    };
  }

  const sourceHash = sha256(
    `${entry.profielTitel}\n---\n${portfolio.anonymizedText}`,
  );
  const sourceIdentifier = `seed:${entry.portfolio.replace(/\.json$/, "")}`;

  // Extract pairs
  console.log(
    `  extracting pairs: ${entry.portfolio} vs ${rubric.profielTitel}...`,
  );
  const startExtract = Date.now();
  const pairs = await extractPairs({
    portfolioText: portfolio.anonymizedText,
    rubric,
  });
  console.log(
    `  extracted ${pairs.length} pairs in ${((Date.now() - startExtract) / 1000).toFixed(1)}s`,
  );

  if (pairs.length === 0) {
    return {
      skipped: true,
      reason: "No pairs extracted — portfolio may not match the profiel rubric.",
    };
  }

  // Compute quality score per pair (concreteness proxy, same metric the eval uses)
  const chunks = pairs.map((p) => ({
    content: p.bewijs,
    wordCount: wordCount(p.bewijs),
    qualityScore: concretenessPer100(p.bewijs),
    criteriumId: p.criteriumId,
    werkprocesId: p.werkprocesId,
    metadata: {
      kandidaat_source: entry.portfolio,
      note: entry.note ?? null,
    } as Record<string, unknown>,
  }));

  // Upsert into DB via core model
  const result = await AiCorpus.upsertSourceWithChunks({
    source: {
      domain: "pvb_portfolio",
      sourceIdentifier,
      sourceHash,
      content: portfolio.anonymizedText,
      consentLevel: "seed",
      contributedByUserId: null,
      profielId: rubric.profielId,
      niveauRang: rubric.niveauRang,
      metadata: {
        original_filename: entry.portfolio,
        note: entry.note ?? null,
        anonymization_method: portfolio.anonymizationMethod,
        ingested_from: "corpus:ingest-seed",
      },
      charCount: portfolio.charCount,
      pageCount: portfolio.pageCount,
    },
    chunks,
  });

  return {
    skipped: false,
    sourceId: result.sourceId,
    chunkCount: result.chunkCount,
    reason: result.inserted ? undefined : "source_hash already present",
  };
}

// ---- Run ----

console.log(
  `Ingest seed corpus: ${EVAL_MATRIX.length} matrix entries → ai_corpus (domain=pvb_portfolio, consent=seed)`,
);

await withDatabase({ connectionString: PGURI }, async () => {
  let total = 0;
  let inserted = 0;
  let skipped = 0;
  let chunks = 0;

  // Sequential. Extraction is LLM-heavy but not parallel-safe due to gateway
  // rate limits; we ingest once, not often, so speed isn't critical.
  for (const entry of EVAL_MATRIX) {
    total += 1;
    console.log(
      `\n[${total}/${EVAL_MATRIX.length}] ${entry.portfolio} (${entry.profielTitel})`,
    );
    try {
      const result = await ingestOne(entry);
      if (result.skipped) {
        skipped += 1;
        console.log(`  SKIPPED: ${result.reason}`);
      } else if (result.reason) {
        console.log(`  (already ingested, source_hash matched) sourceId=${result.sourceId}`);
      } else {
        inserted += 1;
        chunks += result.chunkCount ?? 0;
        console.log(
          `  ✓ inserted source=${result.sourceId} chunks=${result.chunkCount}`,
        );
      }
    } catch (e) {
      skipped += 1;
      const reason = e instanceof Error ? e.message : String(e);
      console.error(`  ERROR: ${reason}`);
    }
  }

  console.log(
    `\nDone. ${inserted} new sources, ${chunks} total chunks, ${skipped} skipped/failed.`,
  );
});
