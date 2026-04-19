// Polishes a single paragraph from the anonymized corpus into a safe few-shot
// example. Second-pass LLM scrub (strict): any remaining proper noun, ID,
// specific location, or OCR artifact gets tokenised or cleaned up. The source
// paragraph may still have residual PII that the corpus-wide pass missed; this
// script is where each few-shot snippet gets individually hardened before
// being injected into a prompt that ships to Anthropic on every user request.
//
// Usage:
//   node --env-file-if-exists=.env.local --experimental-strip-types \
//     apps/web/scripts/corpus/pick-fewshot.ts <file.json> <paragraphIndex> [outFile]
//
// Example:
//   node --env-file-if-exists=.env.local --experimental-strip-types \
//     apps/web/scripts/corpus/pick-fewshot.ts 4.4_boris.json 14

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gateway } from "@ai-sdk/gateway";
import { generateObject } from "ai";
import { z } from "zod";
import {
  ANONYMIZED_DIR,
  type AnonymizedPortfolio,
  CORPUS_ROOT,
} from "./shared.ts";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

const [, , fileArg, idxArg, outFileArg] = process.argv;

if (!fileArg || idxArg === undefined) {
  console.error(
    "Usage: pick-fewshot.ts <file.json> <paragraphIndex> [outFile]",
  );
  process.exit(1);
}

if (!process.env.AI_GATEWAY_API_KEY) {
  console.error(
    "AI_GATEWAY_API_KEY not set. Add to apps/web/.env.local and re-run.",
  );
  process.exit(1);
}

const portfolio = JSON.parse(
  readFileSync(join(ANONYMIZED_DIR, fileArg), "utf8"),
) as AnonymizedPortfolio;

const paragraphs = portfolio.anonymizedText
  .split("\n\n")
  .map((p) => p.trim())
  .filter(Boolean);

const idx = Number(idxArg);
if (!Number.isInteger(idx) || idx < 0 || idx >= paragraphs.length) {
  console.error(
    `Invalid index ${idxArg} (file has ${paragraphs.length} paragraphs).`,
  );
  process.exit(1);
}

const source = paragraphs[idx];
if (!source) {
  console.error(`No paragraph at index ${idx}.`);
  process.exit(1);
}

const PolishSchema = z.object({
  polished: z.string().min(200),
  remainingRisks: z
    .array(
      z.object({
        text: z.string(),
        category: z.enum([
          "name",
          "location",
          "vereniging",
          "date",
          "id_number",
          "specific_situation",
          "other",
        ]),
        action: z.enum(["replaced", "kept", "flagged_for_review"]),
      }),
    )
    .max(50),
  suitabilityScore: z.number().int().min(0).max(10),
  suitabilityReason: z.string(),
});

const SYSTEM = `Je polijst een paragraaf uit een echt portfolio tot een safe few-shot voorbeeld dat we in een productie-systeemprompt injecteren.

SCRUB-REGELS (strikt):
- Elke overgebleven voornaam, achternaam of initialen → [KANDIDAAT]
- Elke overgebleven plaatsnaam → [LOCATIE]
- Elke overgebleven verenigingsnaam, zeilschool, opleiding, bedrijf → [VERENIGING]
- Elke volledige datum of jaartal → [DATUM]
- Elk identificerend ID-nummer (zoals "12064403") → [ID]
- Specifieke combinaties (naam + situatie + datum) die samen herleidbaar zijn → parafraseer om identificatie onmogelijk te maken

POETS-REGELS:
- Verwijder OCR-artefacten: dubbele spaties, losse paginanummers aan het begin, afgebroken woorden
- Behoud de stem, de structuur, de concrete details (boot-types, weer, sport-jargon, aantallen, STAR-elementen)
- Geen em-dashes. Gebruik komma's of punten.
- De polished tekst moet zelfstandig leesbaar zijn als een enkel bewijs-voorbeeld

RISICO-OPSOMMING:
- Lijst elk ding dat je hebt vervangen of waar je over twijfelt
- "replaced" = je hebt het vervangen met een token
- "kept" = je hebt het bewust gelaten (watersport-jargon, CWO, Dart-16, bft-waarden, boot-types)
- "flagged_for_review" = je weet het niet zeker; menselijke beoordeling nodig

GESCHIKTHEID:
- Score 0-10 hoe geschikt deze paragraaf is als few-shot bewijs-voorbeeld na polijsten
- 10 = concrete situatie, ik-vorm, past tense, geen meta-coda, heldere STAR, voldoende lengte
- 0 = niet bruikbaar (inhoudsopgave, CV-achtig, teveel gefragmenteerd)`;

const { object } = await generateObject({
  model: gateway("anthropic/claude-sonnet-4-5"),
  schema: PolishSchema,
  system: SYSTEM,
  prompt: `Bron-paragraaf (uit ${fileArg} paragraph #${idx}):\n\n---\n${source}\n---\n\nPolijst tot een safe few-shot voorbeeld.`,
  temperature: 0.1,
});

const fewShotDir = join(CORPUS_ROOT, "few-shot");
mkdirSync(fewShotDir, { recursive: true });

const outName =
  outFileArg ?? `${fileArg.replace(/\.json$/, "")}-p${idx}.md`;
const outPath = join(fewShotDir, outName);

const body = `# Few-shot candidate: ${fileArg} · para #${idx}

**Suitability:** ${object.suitabilityScore}/10 — ${object.suitabilityReason}

**Source length:** ${source.split(/\s+/).length} words
**Polished length:** ${object.polished.split(/\s+/).length} words

## Polished

${object.polished}

## Remaining risks

${
  object.remainingRisks.length === 0
    ? "_(none flagged by the model — still worth a human eyeball)_"
    : object.remainingRisks
        .map((r) => `- **${r.category}** (${r.action}): \`${r.text}\``)
        .join("\n")
}

## Source (anonymized corpus, for reference)

${source}
`;

writeFileSync(outPath, body);
console.log(`Wrote ${outPath}`);
console.log(`  Suitability: ${object.suitabilityScore}/10`);
console.log(`  Risks flagged: ${object.remainingRisks.length}`);
console.log(`  flagged_for_review: ${object.remainingRisks.filter((r) => r.action === "flagged_for_review").length}`);
