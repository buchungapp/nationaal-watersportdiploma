import {
  FEW_SHOT_EXAMPLES,
  type FewShotExample,
  renderFewShotFragment,
} from "./few-shot.ts";
import type { Question, WerkprocesDraft } from "./schemas";
import type { RubricTree } from "./types";

function richtingLabelFor(
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar",
): string {
  switch (richting) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB-beoordelaar";
  }
}

// Shared voice across both prompts. Dutch, no em dashes, no ChatGPT tells.
const VOICE_RULES = `SCHRIJFSTIJL:
- Schrijf in het Nederlands.
- Schrijf in de eerste persoon (ik).
- Klink als een praktijkmens, niet als een AI. Gewone woorden, korte zinnen, geen opsmuk.
- Geen em-dashes (—). Gebruik komma's, punten of haakjes.
- Vermijd clichés zoals 'cruciaal', 'essentieel', 'in de praktijk'.
- Geen marketing-taal, geen overdreven lof over jezelf of anderen.`;

export function buildQuestionsPrompt(tree: RubricTree): {
  system: string;
  user: string;
} {
  const system = `Je helpt een kandidaat een Proeve-van-Bekwaamheid (PvB) portfolio schrijven voor NOC*NSF-kwalificatie ${richtingLabelFor(tree.richting)} niveau ${tree.niveauRang}.

Jouw taak: formuleer open vragen die de kandidaat helpen concrete, authentieke praktijkvoorbeelden op te halen uit het eigen werk. Per vraag richt je je op één werkproces; waar criteria nauw verwant zijn mag één vraag meerdere criteria dekken.

${VOICE_RULES}

REGELS VRAGEN:
- Per werkproces 1 tot 3 vragen, in totaal 6 tot 12 vragen (geen 30; dit is de sandbox-validatie, niet de volle flow).
- Elke vraag vraagt om één concrete situatie. Geen "wat vind je van...", wel "beschrijf een specifieke keer dat...".
- Noem waar logisch de STAR-elementen: Situatie, Taak, Actie, Resultaat.
- Geen jargon dat niet in de rubriek zelf staat. Schrijf taal die een instructeur op een vereniging herkent.`;

  const werkprocesBlocks = tree.werkprocessen
    .map((wp) => {
      const criteria = wp.criteria
        .map((c) => `  - [${c.id}] ${c.title}: ${c.omschrijving}`)
        .join("\n");
      return `WERKPROCES ${wp.rang}: ${wp.titel}
ID: ${wp.id}
Resultaat: ${wp.resultaat}
Criteria:
${criteria}`;
    })
    .join("\n\n");

  const user = `Kwalificatie: ${tree.profielTitel}

De rubriek:

${werkprocesBlocks}

Genereer nu de vragen. Voor elke vraag: geef de werkprocesId (uuid), de werkprocesTitel, de array van criteriumIds (uuid) die de vraag dekt, en de promptzin voor de kandidaat. Gebruik de ID's letterlijk zoals ze hierboven staan. Verzin geen nieuwe id's.`;

  return { system, user };
}

export type AnswerInput = {
  questionId: string;
  werkprocesId: string;
  criteriumIds: string[];
  prompt: string;
  answer: string;
};

export type RetrievedChunkForPrompt = {
  content: string;
  wordCount: number;
  qualityScore: number | null;
  sourceIdentifier: string;
};

export function buildDraftPrompt(args: {
  tree: RubricTree;
  werkprocesId: string;
  answers: AnswerInput[];
  questions: Question[];
  /**
   * Per-criterium reference chunks from the ai_corpus (Stage B). Keyed by
   * criteriumId. Each chunk is an anonymised bewijs paragraph from a
   * different, passing portfolio. Injected into the user portion of the
   * prompt as "inspiration for concreteness."
   */
  retrievedChunks?: Map<string, RetrievedChunkForPrompt[]>;
  /**
   * How to frame the retrieved chunks in the prompt.
   * - "strict" (default): firm anti-copy framing.
   * - "loose": explicitly permits borrowing structural patterns while
   *   prohibiting specific situations/names.
   */
  retrievalFraming?: "strict" | "loose";
  /**
   * Where retrieval chunks land in the prompt.
   * - "inspiration" (default): user-prompt inspiration block (current Stage B).
   * - "fewshot": retrieved chunks replace the hand-picked few-shot examples in
   *   the SYSTEM prompt. Padded with FEW_SHOT_EXAMPLES when fewer than 3
   *   chunks are returned. Tests the hypothesis that retrieval fails as
   *   inspiration because the model treats system-prompt examples as "how to
   *   write" while treating user-prompt inspiration as "material to distance
   *   from." In fewshot mode, the user-prompt inspiration block is suppressed.
   */
  retrievalMode?: "inspiration" | "fewshot";
  /**
   * Extra content appended to the SYSTEM prompt (before REGELS). Used for
   * per-kandidaat context like prior-portfolio voice profile (experimental
   * Stage F direction). Not for per-criterium retrieval — that's
   * `retrievedChunks`, which goes into the user prompt.
   */
  systemPromptExtra?: string;
}): { system: string; user: string } {
  const {
    tree,
    werkprocesId,
    answers,
    questions,
    retrievedChunks,
    retrievalFraming = "strict",
    retrievalMode = "inspiration",
    systemPromptExtra,
  } = args;

  const werkproces = tree.werkprocessen.find((w) => w.id === werkprocesId);
  if (!werkproces) {
    throw new Error(`Werkproces ${werkprocesId} niet gevonden in rubric tree.`);
  }

  // Stage B fewshot mode: build a dynamic few-shot set from retrieved chunks
  // for this werkproces. Dedup by (sourceIdentifier + content prefix) so the
  // same chunk retrieved for multiple criteria doesn't repeat. Sort by
  // qualityScore descending, take top 3, pad with hand-picked FEW_SHOT_EXAMPLES
  // so we never ship fewer than 3 few-shot slots.
  const dynamicFewShotExamples: FewShotExample[] | null = (() => {
    if (retrievalMode !== "fewshot") return null;
    if (!retrievedChunks || retrievedChunks.size === 0)
      return FEW_SHOT_EXAMPLES;
    const dedupKey = (chunk: RetrievedChunkForPrompt) =>
      `${chunk.sourceIdentifier}::${chunk.content.slice(0, 80)}`;
    const seen = new Set<string>();
    const flattened: Array<{
      chunk: RetrievedChunkForPrompt;
      criteriumId: string;
    }> = [];
    for (const [criteriumId, chunks] of retrievedChunks.entries()) {
      for (const chunk of chunks) {
        const key = dedupKey(chunk);
        if (seen.has(key)) continue;
        seen.add(key);
        flattened.push({ chunk, criteriumId });
      }
    }
    flattened.sort((a, b) => {
      const sa = a.chunk.qualityScore ?? -1;
      const sb = b.chunk.qualityScore ?? -1;
      return sb - sa;
    });
    const retrievedExamples: FewShotExample[] = flattened
      .slice(0, 3)
      .map(({ chunk, criteriumId }) => {
        const criterium = werkproces.criteria.find((c) => c.id === criteriumId);
        return {
          source: chunk.sourceIdentifier,
          teaches: criterium
            ? `Criterium-dichtheid voor "${criterium.title}" (${chunk.wordCount}w, concreetheid ${chunk.qualityScore ?? "—"})`
            : `Portfolio-bewijs (${chunk.wordCount}w)`,
          text: chunk.content,
        };
      });
    // Pad with hand-picked examples when retrieval returned <3.
    const needed = 3 - retrievedExamples.length;
    const padded =
      needed > 0
        ? [...retrievedExamples, ...FEW_SHOT_EXAMPLES.slice(0, needed)]
        : retrievedExamples;
    return padded;
  })();

  const fewShotFragment = renderFewShotFragment(
    dynamicFewShotExamples ? { examples: dynamicFewShotExamples } : undefined,
  );

  const system = `Je schrijft bewijs-paragrafen voor een PvB-portfolio, ${richtingLabelFor(tree.richting)} niveau ${tree.niveauRang}.

Dit is één werkproces uit het portfolio. Je schrijft per beoordelingscriterium één paragraaf bewijs, geformuleerd als de kandidaat zelf.

${VOICE_RULES}

REGELS BEWIJS:
- GEEN VERZINSELS. Elke specifieke situatie, datum, aantal, cursist-moment, wind-conditie of plek die je in het bewijs noemt, moet letterlijk in de antwoorden van de kandidaat terug te vinden zijn. Als je een detail wilt noemen dat niet in de antwoorden staat: laat het weg. Liever een korter bewijs dat klopt, dan een lang bewijs dat deels verzonnen is.
- LAAT DE LENGTE VOLGEN UIT DE INHOUD, niet uit een streefgetal. Echte PvB-bewijzen variëren sterk in lengte (van 80 tot 500+ woorden). Een kandidaat die drie concrete dingen vertelde, levert een korter bewijs op dan een kandidaat die zeven dingen vertelde. Niet padden om indrukwekkender te lijken; padding leest beoordelaars direct als AI-output.
- Koppel wat de kandidaat deed expliciet aan het criterium zonder het criterium letterlijk te citeren.
- Vermijd dat paragrafen op elkaar lijken. Elk criterium krijgt zijn eigen concrete situatie waar mogelijk.
- Schrijf in de ik-vorm, verleden tijd voor afgeronde situaties.
- Geen meta-coda. Schrijf niet 'Dit laat zien dat ik...' of 'Hiermee heb ik aangetoond dat...' aan het einde van een paragraaf. Laat het bewijs voor zichzelf spreken.

${fewShotFragment}${systemPromptExtra ? `\n\n${systemPromptExtra}` : ""}`;

  const criteriaList = werkproces.criteria
    .map(
      (c) => `- criteriumId: ${c.id}
  criteriumTitel: ${c.title}
  omschrijving: ${c.omschrijving}`,
    )
    .join("\n");

  const relevantAnswers = answers.filter(
    (a) => a.werkprocesId === werkprocesId,
  );
  const extraAnswers = answers.filter((a) => a.werkprocesId !== werkprocesId);

  const relevantAnswerBlocks = relevantAnswers
    .map((a) => {
      const question = questions.find((q) => q.id === a.questionId);
      return `Vraag (direct voor dit werkproces): ${question?.prompt ?? a.prompt}
Antwoord: ${a.answer.trim() || "(geen antwoord gegeven)"}`;
    })
    .join("\n\n");

  // Include other answers as light context — a kandidaat's story often spans
  // werkprocessen. The LLM picks up useful detail without copying it literally.
  const extraAnswerBlocks = extraAnswers.length
    ? `\n\nOverige antwoorden van de kandidaat (alleen context, niet letterlijk overnemen):
${extraAnswers
  .map((a) => {
    const question = questions.find((q) => q.id === a.questionId);
    return `- ${question?.prompt ?? a.prompt}\n  -> ${a.answer.trim() || "(geen antwoord)"}`;
  })
  .join("\n")}`
    : "";

  // Per-criterium inspiration from the ai_corpus. These are real bewijs
  // paragraphs written by OTHER kandidaten for the SAME criterium. Use them
  // to calibrate the target level of concreteness per criterium. Strict
  // framing discourages content reuse. Suppressed when retrievalMode="fewshot"
  // — in that mode the retrieved chunks already surface as system-prompt
  // few-shot examples and duplicating them here would swamp the user prompt.
  const inspirationBlocks =
    retrievalMode === "inspiration" &&
    retrievedChunks &&
    retrievedChunks.size > 0
      ? (() => {
          const perCriteriumEntries: string[] = [];
          for (const c of werkproces.criteria) {
            const chunks = retrievedChunks.get(c.id) ?? [];
            if (chunks.length === 0) continue;
            const blocks = chunks
              .map(
                (chunk, i) =>
                  `  Voorbeeld ${i + 1} (bron: ${chunk.sourceIdentifier}, ${chunk.wordCount} woorden):\n  "${chunk.content.replace(/\n/g, "\n  ")}"`,
              )
              .join("\n\n");
            perCriteriumEntries.push(
              `Criterium "${c.title}" (id: ${c.id}):\n${blocks}`,
            );
          }
          if (perCriteriumEntries.length === 0) return "";
          const header =
            retrievalFraming === "loose"
              ? `\n\nHier staan echte, geanonimiseerde bewijs-fragmenten voor deze criteria, geschreven door andere kandidaten. Gebruik ze als STIJL-ANKER:
- Neem de dichtheid van concrete details over (hoeveel specifieke weken, boot-types, wind-condities, cursist-situaties ze per alinea noemen).
- Neem de zinsstructuur en het ritme over (afwisseling korte/lange zinnen, hoe ze STAR impliciet weven).
- Neem het register over: ik-vorm, verleden tijd, zonder meta-coda.

NIET overnemen: de SPECIFIEKE situaties zelf (die horen bij de andere kandidaat), namen, plekken, data. Jouw bewijs gaat over wat de huidige kandidaat heeft verteld in de antwoorden hieronder — niet over wat in deze voorbeelden staat. Je mag wel hetzelfde NIVEAU van concreetheid laten zien, zolang de details uit de antwoorden komen.

`
              : `\n\nInspiratie uit echte portfolio's (geanonimiseerd, andere kandidaten) per criterium.
GEBRUIK voor CONCREETHEID en lengte-kalibratie, NIET om specifieke situaties of inhoud over te nemen. Jouw bewijs moet over de situaties van DEZE kandidaat gaan; deze voorbeelden zijn alleen referentie voor hoe dicht/concreet echt bewijs schrijft.

`;
          return `${header}${perCriteriumEntries.join("\n\n")}`;
        })()
      : "";

  const user = `Werkproces ${werkproces.rang}: ${werkproces.titel}
werkprocesId: ${werkproces.id}
Resultaat: ${werkproces.resultaat}

Criteria voor dit werkproces:
${criteriaList}

Antwoorden van de kandidaat over dit werkproces:

${relevantAnswerBlocks || "(geen directe antwoorden; baseer je op de context hieronder)"}${extraAnswerBlocks}${inspirationBlocks}

Schrijf nu bewijs per criterium. Gebruik de id's en titels letterlijk zoals hierboven. Retourneer werkprocesId en werkprocesTitel exact zoals hierboven.`;

  return { system, user };
}

// Serialise the full draft back to a flat plain-text format users can paste
// anywhere (Word, Docs, email). Markdown-style headings because every target
// renders them cleanly as plain text.
export function draftToPlainText(
  drafts: WerkprocesDraft[],
  profielTitel: string,
): string {
  const header = `# Portfolio ${profielTitel}\n(Concept gegenereerd met de NWD portfolio-helper sandbox. Controleer en bewerk voordat je dit indient.)\n`;
  const body = drafts
    .sort((a, b) => a.werkprocesTitel.localeCompare(b.werkprocesTitel))
    .map((wp) => {
      const criteria = wp.criteria
        .map((c) => `### ${c.criteriumTitel}\n\n${c.bewijs.trim()}\n`)
        .join("\n");
      return `## ${wp.werkprocesTitel}\n\n${criteria}`;
    })
    .join("\n");
  return `${header}\n${body}`;
}

export function werkprocesToPlainText(wp: WerkprocesDraft): string {
  const criteria = wp.criteria
    .map((c) => `### ${c.criteriumTitel}\n\n${c.bewijs.trim()}\n`)
    .join("\n");
  return `## ${wp.werkprocesTitel}\n\n${criteria}`;
}

// Render the full portfolio as plain text using the outline template as the
// skeleton. AI-generated sections (pvb_werkproces) are filled with their
// bewijs; user-written sections show a placeholder block with the description
// and target word count, clearly marked so the kandidaat knows what to write.
//
// This is what the kandidaat copies out at the end. It's the shape a
// beoordelaar expects: voorwoord → personalia → inleiding → werkprocessen →
// reflectie → bijlagen, not just a pile of bewijs paragraphs.
export function draftWithOutlineToPlainText(args: {
  outline: {
    profielTitel: string;
    niveauRang: number;
    sections: Array<{
      ordinal: number;
      kind: string;
      title: string;
      description: string;
      targetWordCountMin: number | null;
      targetWordCountMax: number | null;
      filledBy: "user" | "ai" | "rubric_driven";
      werkprocesId: string | null;
    }>;
  };
  drafts: WerkprocesDraft[];
}): string {
  const draftByWerkprocesId = new Map(
    args.drafts.map((d) => [d.werkprocesId, d]),
  );

  const header = `# Portfolio ${args.outline.profielTitel}\n(Concept gegenereerd met de NWD portfolio-helper sandbox. Controleer en bewerk voordat je dit indient.)\n`;

  const sortedSections = [...args.outline.sections].sort(
    (a, b) => a.ordinal - b.ordinal,
  );

  const body = sortedSections
    .map((section) => {
      if (section.kind === "pvb_werkproces" && section.werkprocesId) {
        const draft = draftByWerkprocesId.get(section.werkprocesId);
        if (draft) {
          const criteria = draft.criteria
            .map((c) => `### ${c.criteriumTitel}\n\n${c.bewijs.trim()}\n`)
            .join("\n");
          return `## ${section.title}\n\n${criteria}`;
        }
        // No draft for this werkproces (user skipped it) — still show the
        // section heading + a note.
        return `## ${section.title}\n\n_[Nog geen bewijs gegenereerd voor dit werkproces. Je kunt dit overslaan als je deze kerntaak niet doet, of terugkeren en vragen beantwoorden.]_\n`;
      }

      // User-written section: title + description + placeholder block with
      // word-count guidance.
      const range = (() => {
        const min = section.targetWordCountMin;
        const max = section.targetWordCountMax;
        if (min === null && max === null) return "";
        if (min !== null && max !== null)
          return ` (richtlengte: ${min}–${max} woorden)`;
        if (min !== null) return ` (minimaal ${min} woorden)`;
        if (max !== null) return ` (maximaal ${max} woorden)`;
        return "";
      })();

      const placeholder = `_Hier komt je eigen tekst${range}._\n\n> ${section.description.replace(/\n/g, "\n> ")}\n\n[JOUW TEKST HIER]\n`;
      return `## ${section.title}\n\n${placeholder}`;
    })
    .join("\n");

  return `${header}\n${body}`;
}
