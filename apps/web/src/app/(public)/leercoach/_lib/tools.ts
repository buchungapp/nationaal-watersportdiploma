import "server-only";
import { AiCorpus } from "@nawadi/core";
import { tool } from "ai";
import { z } from "zod";
import type { ChatScope } from "./chat-context";
import { loadLeercoachRubric, resolveCriteriumWithinScope } from "./rubric";

// Tool factory: returns a Tool instance bound to a specific chat context.
// Factory pattern (not a bare `export const tool()`) mirrors
// vercel/ai-chatbot's createDocument / editDocument tools — the tool
// needs the chat's profielId, scope, and userId to resolve criterium
// references and to apply per-user visibility filtering.
//
// Tools are re-created per request. No shared state; nothing leaks
// between chats or users.

type ToolContext = {
  profielId: string;
  scope: ChatScope;
  userId: string;
};

const searchBewijsExamplesInputSchema = z.object({
  werkprocesRang: z
    .number()
    .int()
    .min(1)
    .describe(
      "De rang (volgnummer) van het werkproces binnen het profiel van deze chat, zoals weergegeven in de rubriek in je system prompt (bv. 1 voor 'Werkproces 1: …'). Moet binnen de scope van deze chat vallen.",
    ),
  criteriumRang: z
    .number()
    .int()
    .min(1)
    .describe(
      "De rang van het beoordelingscriterium binnen het werkproces, zoals weergegeven in het rubriek-blok (bv. 2 voor '[2] Motiveert cursisten').",
    ),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(3)
    .default(2)
    .describe(
      "Aantal voorbeeld-fragmenten om terug te krijgen. Houd klein (1-2) om de context-window niet te vullen; vraag alleen om 3 als het echt nodig is.",
    ),
});

type SearchBewijsExamplesOutput =
  | {
      ok: true;
      werkprocesTitel: string;
      criteriumTitel: string;
      examples: Array<{
        content: string;
        wordCount: number;
        concretenessScore: number | null;
        sourceRef: string;
      }>;
    }
  | { ok: false; reason: string };

export function createSearchBewijsExamplesTool(context: ToolContext) {
  return tool({
    description: [
      "Zoekt geanonimiseerde voorbeeld-fragmenten uit eerder geslaagde PvB-portfolio's voor een specifiek criterium van het huidige profiel.",
      "Gebruik alleen wanneer de kandidaat expliciet vraagt om een voorbeeld, of wanneer ze vastlopen en een concreet aanknopingspunt nodig hebben.",
      "Vat de voorbeelden altijd samen in je eigen woorden — citeer niet verbatim.",
      "De fragmenten zijn uit andere kandidaten; maak duidelijk dat het inspiratie is, geen sjabloon.",
    ].join(" "),
    inputSchema: searchBewijsExamplesInputSchema,
    execute: async (input): Promise<SearchBewijsExamplesOutput> => {
      const rubric = await loadLeercoachRubric(context.profielId);
      if (!rubric) {
        return { ok: false, reason: "profiel kon niet geladen worden" };
      }

      const resolved = resolveCriteriumWithinScope({
        rubric,
        scope: context.scope,
        werkprocesRang: input.werkprocesRang,
        criteriumRang: input.criteriumRang,
      });
      if (!resolved) {
        return {
          ok: false,
          reason: `geen criterium gevonden op werkproces ${input.werkprocesRang}, criterium ${input.criteriumRang} binnen de scope van deze chat`,
        };
      }

      const chunks = await AiCorpus.getChunksForCriterium({
        criteriumId: resolved.criterium.id,
        maxResults: input.maxResults,
        forUserId: context.userId,
      });

      if (chunks.length === 0) {
        return {
          ok: false,
          reason: `geen voorbeelden beschikbaar voor dit criterium (corpus heeft er nog geen voor '${resolved.criterium.title}')`,
        };
      }

      return {
        ok: true,
        werkprocesTitel: resolved.werkproces.titel,
        criteriumTitel: resolved.criterium.title,
        examples: chunks.map((c) => ({
          content: c.content,
          wordCount: c.wordCount,
          concretenessScore: c.qualityScore,
          sourceRef: c.sourceIdentifier,
        })),
      };
    },
  });
}

// ---- searchPriorPortfolio ----

const searchPriorPortfolioInputSchema = z.object({
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe(
      "Aantal fragmenten uit de eerdere portfolio('s) van de kandidaat. Houd bescheiden (3-5) zodat de context niet explodeert.",
    ),
});

type SearchPriorPortfolioOutput =
  | {
      ok: true;
      totalSources: number;
      fragments: Array<{
        content: string;
        wordCount: number;
        niveauRang: number | null;
        sourceRef: string;
      }>;
    }
  | { ok: false; reason: string };

export function createSearchPriorPortfolioTool(context: ToolContext) {
  return tool({
    description: [
      "Haalt fragmenten op uit eerdere PvB-portfolio's die DEZE kandidaat zelf heeft geüpload (bijvoorbeeld hun niveau 3 of 4 portfolio).",
      "Gebruik deze tool als de kandidaat verwijst naar eerder werk, of als ze aangeven dat ze al ervaring hebben die relevant is voor het huidige criterium.",
      "De fragmenten zijn al geanonimiseerd. Vat samen in je eigen woorden en stel daarna een vervolgvraag over hoe hun denken geëvolueerd is naar dit niveau.",
      "Roep deze tool NIET aan als de kandidaat nog niks heeft geüpload (check eerst of ze ernaar verwezen hebben).",
    ].join(" "),
    inputSchema: searchPriorPortfolioInputSchema,
    execute: async (input): Promise<SearchPriorPortfolioOutput> => {
      const chunks = await AiCorpus.getUserPriorChunks({
        userId: context.userId,
        maxResults: input.maxResults,
      });

      if (chunks.length === 0) {
        return {
          ok: false,
          reason:
            "deze kandidaat heeft nog geen eerdere portfolio's geüpload — vraag ze eerst om dat te doen via /leercoach/prior-portfolios",
        };
      }

      const uniqueSources = new Set(chunks.map((c) => c.sourceId));

      return {
        ok: true,
        totalSources: uniqueSources.size,
        fragments: chunks.map((c) => ({
          content: c.content,
          wordCount: c.wordCount,
          niveauRang: c.niveauRang,
          sourceRef: c.sourceIdentifier,
        })),
      };
    },
  });
}

/**
 * Build the full tools object for a chat. Adding more tools later
 * (proposeBewijsDraft, etc.) extends this record.
 *
 * Tool availability can depend on context: searchPriorPortfolio only
 * makes sense if the user has prior portfolios uploaded. For now we
 * always expose it and let the tool itself return a helpful "nothing
 * uploaded yet" message — simpler than conditional tool construction.
 */
export function buildLeercoachTools(context: ToolContext) {
  return {
    searchBewijsExamples: createSearchBewijsExamplesTool(context),
    searchPriorPortfolio: createSearchPriorPortfolioTool(context),
  };
}

export type LeercoachTools = ReturnType<typeof buildLeercoachTools>;
