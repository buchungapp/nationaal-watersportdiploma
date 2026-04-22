// Outline v2: refine the wrapper-section descriptions (voorwoord, zeil_cv,
// inleiding, context, reflectie, bijlagen) using what we've ingested from the
// real corpus. pvb_werkproces sections are rubric-driven and stay untouched.
//
// Per profiel, we:
//   1. Load all seed-consent sources belonging to that profiel from ai_corpus.
//   2. Load the current (highest-version) outline template.
//   3. LLM call: read the corpus texts, observe what real kandidaten put in
//      voorwoord / zeil_cv / etc, and rewrite those section descriptions with
//      empirical guidance (typical length observed, common content patterns,
//      recurring bijlagen types, what reflectie tends to look like).
//   4. Merge refined wrappers with unchanged pvb_werkproces sections.
//   5. Upsert as a new version (bumps v1 → v2).
//
// Sequential by design — we share gateway capacity with the matrix runner.
//
// Run:
//   pnpm -C apps/web corpus:refine-outline-templates

import { gateway } from "@ai-sdk/gateway";
import { AiCorpus, withDatabase } from "@nawadi/core";
import { generateObject } from "ai";
import pg from "pg";
import { Agent, setGlobalDispatcher } from "undici";
import { z } from "zod";

setGlobalDispatcher(
  new Agent({
    headersTimeout: 600_000,
    bodyTimeout: 600_000,
    keepAliveTimeout: 600_000,
    connectTimeout: 30_000,
  }),
);

const PGURI =
  process.env.PGURI ??
  "postgresql://postgres:postgres@127.0.0.1:54322/postgres";

const MODEL_ID = "anthropic/claude-sonnet-4-5";

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error("AI_GATEWAY_API_KEY not set.");
  process.exit(1);
}

type ProfielRow = {
  id: string;
  titel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveauRang: number;
};

type SourceText = {
  sourceIdentifier: string;
  content: string;
  charCount: number;
};

async function loadProfielenWithSources(): Promise<
  Array<ProfielRow & { sources: SourceText[] }>
> {
  const client = new pg.Client({ connectionString: PGURI });
  await client.connect();
  try {
    const profielenRes = await client.query<ProfielRow>(
      `
      SELECT kp.id, kp.titel, kp.richting, n.rang AS "niveauRang"
      FROM kss.kwalificatieprofiel kp
      JOIN kss.niveau n ON n.id = kp.niveau_id
      WHERE EXISTS (
        SELECT 1 FROM kss.kerntaak kt WHERE kt.kwalificatieprofiel_id = kp.id
      )
      ORDER BY kp.richting, n.rang
      `,
    );

    const out: Array<ProfielRow & { sources: SourceText[] }> = [];
    for (const profiel of profielenRes.rows) {
      const sourcesRes = await client.query<SourceText>(
        `
        SELECT source_identifier AS "sourceIdentifier",
               content,
               char_count AS "charCount"
        FROM ai_corpus.source
        WHERE domain = 'pvb_portfolio'
          AND consent_level = 'seed'
          AND revoked_at IS NULL
          AND profiel_id = $1
        `,
        [profiel.id],
      );
      out.push({ ...profiel, sources: sourcesRes.rows });
    }
    return out;
  } finally {
    await client.end();
  }
}

// The LLM returns refined descriptions for wrapper sections only, keyed by
// `ordinal`. We merge back into the full section list.
const RefinedSectionSchema = z.object({
  ordinal: z.number().int(),
  descriptionRefined: z.string().min(40),
  targetWordCountMin: z.number().int().nullable(),
  targetWordCountMax: z.number().int().nullable(),
  observedPattern: z
    .string()
    .describe(
      "One-sentence summary of what real kandidaten actually did in this section across the corpus.",
    ),
});

const RefinementOutputSchema = z.object({
  refinements: z.array(RefinedSectionSchema),
});

const WRAPPER_KINDS = new Set([
  "voorwoord",
  "zeil_cv",
  "inleiding",
  "context",
  "reflectie",
  "bijlagen",
]);

// ---- Run ----

console.log("Refining outline template wrapper sections from corpus...");

await withDatabase({ connectionString: PGURI }, async () => {
  const profielen = await loadProfielenWithSources();
  console.log(`Found ${profielen.length} populated profielen.`);

  let totalRefined = 0;
  let totalSkipped = 0;

  for (const profiel of profielen) {
    if (profiel.sources.length === 0) {
      console.log(
        `  ⏭ ${profiel.titel}: no ingested sources — skipping (wrapper descriptions remain v1 deterministic).`,
      );
      totalSkipped += 1;
      continue;
    }

    const current = await AiCorpus.getOutlineTemplate({
      profielId: profiel.id,
    });
    if (!current) {
      console.log(
        `  ⏭ ${profiel.titel}: no outline template — run corpus:build-outline-templates first.`,
      );
      totalSkipped += 1;
      continue;
    }

    const wrapperSections = current.sections.filter((sec) =>
      WRAPPER_KINDS.has(sec.kind),
    );

    if (wrapperSections.length === 0) {
      console.log(
        `  ⏭ ${profiel.titel}: no wrapper sections in template (unexpected).`,
      );
      totalSkipped += 1;
      continue;
    }

    // Bound the corpus payload. Long portfolios can blow the context.
    const corpusBlocks = profiel.sources
      .map(
        (s, i) =>
          `--- PORTFOLIO ${i + 1} (${s.sourceIdentifier}, ${s.charCount} chars) ---\n${s.content}\n--- END PORTFOLIO ${i + 1} ---`,
      )
      .join("\n\n");

    const wrapperDescriptions = wrapperSections
      .map(
        (sec) =>
          `- ordinal=${sec.ordinal}, kind=${sec.kind}, title="${sec.title}", huidige beschrijving: "${sec.description.replace(/\n/g, " ")}"`,
      )
      .join("\n");

    console.log(
      `  ▶ ${profiel.titel}: ${profiel.sources.length} sources (${profiel.sources.reduce((s, x) => s + x.charCount, 0)} chars) · ${wrapperSections.length} wrapper sections to refine...`,
    );

    const start = Date.now();

    const { object } = await generateObject({
      model: gateway(MODEL_ID),
      schema: RefinementOutputSchema,
      system: `Je analyseert echte, geslaagde PvB-portfolio's uit het NWD-corpus en verfijnt de beschrijvingen van de wrapper-secties (niet-rubriek-gedreven secties) van een outline-template. Doel: een kandidaat die dit voor het eerst schrijft krijgt concrete, empirisch-onderbouwde guidance over wat er in elk blok hoort.

WERKWIJZE:
- Lees alle portfolio's voor dit profiel.
- Voor elke wrapper-sectie (ordinal hieronder): beschrijf in 2-5 zinnen Nederlands wat ECHTE kandidaten in dit blok opschrijven. Observaties, geen preken.
- Vermeld concrete patronen die je in het corpus ziet: soorten bijlagen die meestal terugkomen, of reflectie-paragrafen met specifieke feedback-citaten beginnen, of voorwoorden met een persoonlijke anekdote openen, etc.
- Geef een realistische richtlengte (min, max in woorden) gebaseerd op wat je observeert. NIET uit je duim zuigen: meet aan de corpusvoorbeelden.
- Als een sectie in de corpusvoorbeelden ontbreekt of extreem varieert, zeg dat eerlijk in de description.

SCHRIJFSTIJL:
- Nederlands.
- Concreet en concreet. Geen "het is belangrijk om..." of "probeer te..."; wel "echte portfolio's openen meestal met een voorwoord van 300-450 woorden waarin..."
- Geen em-dashes.
- Geen AI-vocabulaire ('cruciaal', 'essentieel').

REGELS:
- Output per wrapper-sectie: ordinal (letterlijk hieronder), descriptionRefined (nieuwe tekst), targetWordCountMin + targetWordCountMax (bijgesteld aan observatie), observedPattern (één zin samenvatting).
- Behandel ALLEEN de ordinale waarden die hieronder staan. Andere secties niet aanraken.`,
      prompt: `PROFIEL: ${profiel.titel} (${profiel.richting} niveau ${profiel.niveauRang})

Wrapper-secties om te verfijnen:
${wrapperDescriptions}

Corpus (${profiel.sources.length} echte anonieme portfolio's voor dit profiel):

${corpusBlocks}

Verfijn nu de beschrijvingen van bovenstaande wrapper-secties op basis van wat je in deze portfolio's ziet.`,
      temperature: 0.2,
    });

    // Merge back: take all sections from current template, apply refinements
    // where ordinal matches a wrapper section we asked about.
    const refinementByOrdinal = new Map(
      object.refinements.map((r) => [r.ordinal, r]),
    );

    const wrapperOrdinals = new Set(wrapperSections.map((s) => s.ordinal));
    let appliedCount = 0;
    const mergedSections = current.sections.map((sec) => {
      if (!wrapperOrdinals.has(sec.ordinal)) return sec;
      const refinement = refinementByOrdinal.get(sec.ordinal);
      if (!refinement) return sec; // model didn't emit — keep original
      appliedCount += 1;
      return {
        ...sec,
        description: refinement.descriptionRefined,
        targetWordCountMin: refinement.targetWordCountMin,
        targetWordCountMax: refinement.targetWordCountMax,
      };
    });

    const elapsedMs = Date.now() - start;

    const result = await AiCorpus.upsertOutlineTemplate({
      profielId: profiel.id,
      sections: mergedSections,
      notes: {
        generator: "scripts/corpus/refine-outline-templates.ts",
        strategy: "llm-refined-wrappers-from-corpus",
        based_on_version: current.version,
        refined_section_count: appliedCount,
        source_count: profiel.sources.length,
        total_corpus_chars: profiel.sources.reduce(
          (s, x) => s + x.charCount,
          0,
        ),
        observed_patterns: Object.fromEntries(
          object.refinements.map((r) => [r.ordinal, r.observedPattern]),
        ),
        elapsed_ms: elapsedMs,
      },
    });

    console.log(
      `  ✓ ${profiel.titel} → v${result.version} (${appliedCount}/${wrapperSections.length} wrappers refined in ${(elapsedMs / 1000).toFixed(1)}s)`,
    );
    totalRefined += 1;
  }

  console.log(
    `\nDone. ${totalRefined} profielen refined, ${totalSkipped} skipped.`,
  );
});
