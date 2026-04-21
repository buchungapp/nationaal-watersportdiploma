import "server-only";
import { AiCorpus, Leercoach } from "@nawadi/core";
import { tool } from "ai";
import { z } from "zod";
import type { ChatScope } from "./chat-context";
import { loadLeercoachRubric, resolveCriteriumWithinScope } from "./rubric";

// Max size of a draft the coach can save in one tool call. 40k chars
// is roughly 15-20 pages of portfolio prose — well above the real-
// world ceiling (~12 pages) but bounded so a malformed call can't
// blow up the DB row or downstream exports.
const MAX_DRAFT_CONTENT_CHARS = 40_000;

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
  /** Required by the artefact tools + setPhase. */
  chatId: string;
};

// Minimal context for Q&A-sessies — no profiel-bound tools apply, so
// the only thing the factory needs is userId + chatId (for future
// user-context / KB-search tools that don't require a profiel).
type QAToolContext = {
  userId: string;
  chatId: string;
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
    .max(30)
    .default(12)
    .describe(
      "Aantal fragmenten uit de eerdere portfolio's van de kandidaat. De retrieval verdeelt dit budget round-robin over al hun uploads (eerst één fragment uit ieder portfolio, dan een tweede, etc.), dus vraag gerust 10–15 als je meerdere portfolio's wilt vergelijken. Grens is 30.",
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
        richting: "instructeur" | "leercoach" | "pvb_beoordelaar" | null;
        matchQuality: "profiel" | "richting" | "other";
        sourceRef: string;
      }>;
    }
  | { ok: false; reason: string };

export function createSearchPriorPortfolioTool(context: ToolContext) {
  return tool({
    description: [
      "Haalt fragmenten op uit eerdere PvB-portfolio's die DEZE kandidaat zelf heeft geüpload (bijvoorbeeld hun niveau 3 of 4 portfolio).",
      "Retrieval is NIET hard gefilterd op scope: je krijgt álle uploads van deze kandidaat terug, gesorteerd van tight-match naar loose-match. Elk fragment heeft een `matchQuality`:",
      "• 'profiel' = exact dezelfde kwalificatieprofiel als deze chat — behandel als directe bewijs-inspiratie.",
      "• 'richting' = zelfde richting, ander niveau — content is meestal nog inhoudelijk relevant, gebruik voor groei-vragen ('toen schreef je X, hoe denk je er nu over?').",
      "• 'other' = andere richting (bv. instructeur-portfolio in een leercoach-sessie) — de INHOUD is níét topical voor dit profiel; GEBRUIK HET WEL voor observaties over schrijfstijl, reflectievermogen en manier van denken. Zeg expliciet dat het uit een andere richting komt.",
      "Roep deze tool aan zodra de kandidaat refereert aan hun eigen eerder werk — ook een kort bericht als 'ik heb al een portfolio' of 'kijk er eens naar' is genoeg. Niet eerst vragen, niet eerst het upload-proces uitleggen: gewoon ophalen.",
      "De fragmenten zijn al geanonimiseerd. Vat samen in je eigen woorden en stel een vervolgvraag die past bij het matchQuality-niveau.",
      "Alleen als er letterlijk niks geüpload is (empty reactie) wijs je ze door naar het 📎-knopje.",
    ].join(" "),
    inputSchema: searchPriorPortfolioInputSchema,
    execute: async (input): Promise<SearchPriorPortfolioOutput> => {
      // Load the rubric so we know this chat's richting. Retrieval uses
      // it purely for sort-order + matchQuality tagging — never as a
      // hard filter. Even cross-richting uploads surface (and the LLM
      // sees a matchQuality="other" tag telling it to use them for
      // style/voice only).
      const rubric = await loadLeercoachRubric(context.profielId);

      const chunks = await AiCorpus.getUserPriorChunks({
        userId: context.userId,
        maxResults: input.maxResults,
        scopeProfielId: context.profielId,
        scopeRichting: rubric?.richting,
      });

      if (chunks.length === 0) {
        return {
          ok: false,
          reason:
            "deze kandidaat heeft nog geen eerdere portfolio's geüpload — vraag ze om een PDF toe te voegen via het 📎-knopje boven het chatvenster",
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
          richting: c.richting,
          matchQuality: c.matchQuality,
          sourceRef: c.sourceIdentifier,
        })),
      };
    },
  });
}

// ---- listArtefacten + readArtefact ----
//
// Chat-scoped artefacten: material the kandidaat uploaded inside THIS
// chat (opleidingsplannen, WhatsApp screenshots, e-mails, notities).
// Two-tool pattern so the model first sees *what's there* (cheap,
// summary-only) and then drills in with a query if useful — avoids
// blowing the context window on a 50-page doc upfront.

const listArtefactenInputSchema = z.object({});

type ListArtefactenOutput =
  | {
      ok: true;
      totalArtefacten: number;
      artefacten: Array<{
        artefactId: string;
        label: string;
        artefactType: "pdf" | "docx" | "text" | "image";
        summary: string;
        chunkCount: number;
      }>;
    }
  | { ok: false; reason: string };

export function createListArtefactenTool(context: ToolContext) {
  return tool({
    description: [
      "Geeft een korte lijst van artefacten die DEZE kandidaat in deze chat heeft geüpload: opleidingsplannen, screenshots van WhatsApp-gesprekken, e-mails, notities, foto's van whiteboards, enzovoort.",
      "Elk item heeft een label, een kort samenvattend zinnetje, en een type (pdf/docx/text/image). Je ziet de inhoud NIET — gebruik daarna `readArtefact` om chunks op te halen.",
      "Roep deze tool aan zodra de kandidaat verwijst naar eigen materiaal ('kijk eens naar mijn opleidingsplan', 'ik heb een screenshot van het gesprek met Mark', 'hier is mijn e-mail aan de locatie'). Niet eerst vragen, niet eerst uitleggen: gewoon kijken wat er is.",
      "Advertiseer NIET proactief dat deze tool bestaat — begin niet een nieuwe sessie met 'je hebt 3 artefacten'. Wacht tot de kandidaat ernaar verwijst.",
      "Als de lijst leeg is, zeg dat er nog niks is geüpload en wijs ze naar 'Materiaal toevoegen' onder het chatvenster.",
    ].join(" "),
    inputSchema: listArtefactenInputSchema,
    execute: async (): Promise<ListArtefactenOutput> => {
      const rows = await AiCorpus.listArtefactsForChat({
        chatId: context.chatId,
        userId: context.userId,
      });
      return {
        ok: true,
        totalArtefacten: rows.length,
        artefacten: rows.map((r) => ({
          artefactId: r.artefactId,
          label: r.label,
          artefactType: r.artefactType,
          summary: r.summary,
          chunkCount: r.chunkCount,
        })),
      };
    },
  });
}

const readArtefactInputSchema = z.object({
  artefactId: z
    .string()
    .uuid()
    .describe(
      "De artefactId uit een eerder `listArtefacten`-antwoord. Raad er niet naar — roep eerst listArtefacten aan.",
    ),
  query: z
    .string()
    .trim()
    .min(1)
    .max(200)
    .optional()
    .describe(
      "Optioneel: korte zoekterm om binnen dit artefact te narrowen (bv. 'instructeursopleiding', 'Mark', 'kerntaak 4.1'). Zonder query krijg je de eerste fragmenten in volgorde.",
    ),
  maxResults: z
    .number()
    .int()
    .min(1)
    .max(20)
    .default(6)
    .describe(
      "Aantal fragmenten om terug te krijgen. Houd bescheiden; vraag meer in een volgende call als nodig.",
    ),
});

type ReadArtefactOutput =
  | {
      ok: true;
      artefactId: string;
      label: string;
      artefactType: "pdf" | "docx" | "text" | "image";
      summary: string;
      totalChunks: number;
      returnedChunks: number;
      fragments: Array<{
        content: string;
        wordCount: number;
      }>;
    }
  | { ok: false; reason: string };

export function createReadArtefactTool(context: ToolContext) {
  return tool({
    description: [
      "Leest fragmenten uit één specifiek artefact. Geef `artefactId` uit een eerdere listArtefacten-call; optioneel met een `query` om te narrowen.",
      "Vat samen in je eigen woorden. Citeer alleen korte stukjes verbatim tussen aanhalingstekens als het écht toegevoegde waarde heeft.",
      "Als het artefact veel chunks heeft (totalChunks groot), overweeg een gerichte `query` i.p.v. alles door te lezen.",
    ].join(" "),
    inputSchema: readArtefactInputSchema,
    execute: async (input): Promise<ReadArtefactOutput> => {
      const result = await AiCorpus.getArtefactChunks({
        artefactId: input.artefactId,
        userId: context.userId,
        query: input.query,
        maxResults: input.maxResults,
      });
      if (result.chunks.length === 0) {
        return {
          ok: false,
          reason:
            "Artefact niet gevonden of leeg. Roep listArtefacten aan om te zien welke id's beschikbaar zijn.",
        };
      }
      return {
        ok: true,
        artefactId: result.artefactId,
        label: result.label,
        artefactType: result.artefactType,
        summary: result.summary,
        totalChunks: result.totalChunks,
        returnedChunks: result.chunks.length,
        fragments: result.chunks.map((c) => ({
          content: c.content,
          wordCount: c.wordCount,
        })),
      };
    },
  });
}

// ---- setPhase ----
//
// Shifts the chat's workflow phase. The model calls this both when
// it decides a transition is warranted (e.g. enough STAR material
// on the table to start drafting) and when it agrees with a user's
// request to move. Phase only changes via this tool — never directly
// from the UI — so the model always has a chance to push back.

const setPhaseInputSchema = z.object({
  phase: z
    .enum(["verkennen", "ordenen", "concept", "verfijnen"])
    .describe(
      "De nieuwe fase. Volgorde: verkennen → ordenen → concept → verfijnen. Terugschakelen mag altijd.",
    ),
});

type SetPhaseOutput = {
  ok: true;
  phase: "verkennen" | "ordenen" | "concept" | "verfijnen";
};

export function createSetPhaseTool(context: ToolContext) {
  return tool({
    description: [
      "Schakelt de chat naar een andere workflow-fase.",
      "Roep aan wanneer je zelf besluit dat de huidige fase zijn werk heeft gedaan (bv. genoeg STAR-materiaal verzameld → van verkennen naar ordenen; een STAR-compleet verhaal voor een werkproces → van ordenen naar concept; concept geschreven → naar verfijnen).",
      "Roep OOK aan wanneer je instemt met een verzoek van de kandidaat ('laten we naar concept'). Als je denkt dat ze te vroeg zijn: roep NIET aan, blijf in huidige fase en leg specifiek uit wat je nog mist.",
      "Terugschakelen (bv. concept → ordenen) gaat zonder weerstand — zeg 'oké, waar wil je op terugkomen?' en call de tool.",
      "Na de tool-call: begin meteen het gedrag van de nieuwe fase in dezelfde turn (niet wachten tot volgende beurt).",
    ].join(" "),
    inputSchema: setPhaseInputSchema,
    execute: async (input): Promise<SetPhaseOutput> => {
      await Leercoach.Chat.updatePhase({
        chatId: context.chatId,
        userId: context.userId,
        phase: input.phase,
      });
      // No cache to invalidate — the chat page's `getById` reads the
      // row fresh on every server render. The client sentinel in
      // ChatShell calls `router.refresh()` after each streamed
      // response, which re-runs the server component and picks up
      // the new phase.
      return { ok: true, phase: input.phase };
    },
  });
}

// ---- Portfolio draft tools ----
//
// Two tools that give the coach structured access to the kandidaat's
// portfolio document (distinct from chat messages):
//
//   readDraft()            — return the current latest version's
//                            content + metadata.
//   saveDraft({ content,
//               changeNote? }) — commit a new version, attributed to
//                                the coach, linked back to the chat
//                                message that produced it.
//
// The coach is expected to call readDraft BEFORE producing a revised
// portfolio, so it's revising the authoritative state rather than a
// stale snapshot that might not match what the user last saw. It
// calls saveDraft AFTER producing the revision — chat then shows a
// compact "Versie N opgeslagen" card instead of the giant blockquote
// pattern we had pre-portfolio-model.

type PortfolioToolContext = ToolContext & {
  /**
   * Active portfolio id for this chat. Resolved server-side before
   * the tool is built; null when the chat predates the portfolio
   * model (shouldn't happen for new chats). When null, save/read
   * both return graceful "no portfolio attached" errors instead of
   * crashing the stream.
   */
  portfolioId: string | null;
  /**
   * Message id currently being produced by the coach. Threaded
   * through to `created_by_message_id` on the new version so the
   * version timeline links back to the chat turn. Provided by the
   * chat route's per-turn context; null if not yet known.
   */
  currentMessageId: string | null;
};

const saveDraftInputSchema = z.object({
  content: z
    .string()
    .min(1)
    .max(MAX_DRAFT_CONTENT_CHARS)
    .describe(
      "Volledige markdown-tekst van de nieuwe draftversie. Dit is het HELE portfolio-document zoals het er nu uit ziet — geen delta, geen patch. Gebruik markdown (headings, lijsten, blockquotes) zodat de editor het goed kan renderen.",
    ),
  changeNote: z
    .string()
    .max(500)
    .optional()
    .describe(
      "Korte samenvatting (max 1-2 zinnen) van wat er veranderd is ten opzichte van de vorige versie. Toont in de history-sidebar naast deze versie. Bijvoorbeeld: 'Kerntaak 5.3 herschreven in eerste persoon, inleiding ingekort'.",
    ),
});

type SaveDraftOutput =
  | {
      ok: true;
      versionId: string;
      versionNumber: number;
      contentLength: number;
      skippedNoOp: boolean;
    }
  | { ok: false; reason: string };

export function createSaveDraftTool(context: PortfolioToolContext) {
  return tool({
    description: [
      "Slaat een nieuwe versie van het portfolio-document op en attribueert die aan jou (de coach).",
      "Roep aan NA het produceren van een volledige draft of herziening in de concept- of verfijnfase — dus niet per werkproces, maar voor het hele document in één keer.",
      "Vermijd mini-versies bij losse voorbeelden of coaching; die horen in de chat zelf, niet als draft-commit.",
      "De UI toont een compacte 'Versie N opgeslagen' kaart in de chat; de kandidaat kan de nieuwe versie direct in de docpane openen.",
    ].join(" "),
    inputSchema: saveDraftInputSchema,
    execute: async (input): Promise<SaveDraftOutput> => {
      if (!context.portfolioId) {
        return {
          ok: false,
          reason:
            "Geen portfolio aan deze chat gekoppeld. Dit is een legacy-chat die nog geen docmodel heeft.",
        };
      }
      try {
        const { versionId, created } = await Leercoach.Portfolio.saveVersion({
          portfolioId: context.portfolioId,
          userId: context.userId,
          content: input.content,
          createdBy: "coach",
          createdByMessageId: context.currentMessageId ?? undefined,
          changeNote: input.changeNote,
        });
        // Approximate "version number" for the card: count how many
        // versions the portfolio has now. Not a stable identifier —
        // UI shows it as "versie 4" for human reference; actual
        // permalinks use versionId.
        const versions = await Leercoach.Portfolio.listVersions({
          portfolioId: context.portfolioId,
          userId: context.userId,
          limit: 100,
        });
        return {
          ok: true,
          versionId,
          versionNumber: versions.length,
          contentLength: input.content.length,
          skippedNoOp: !created,
        };
      } catch (err) {
        return {
          ok: false,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
    },
  });
}

const readDraftInputSchema = z.object({
  // No arguments — the tool implicitly reads the current latest
  // version of the attached portfolio. Kept as a structured schema
  // (empty object) instead of `z.void()` so the JSON-schema export
  // matches the other tools.
});

type ReadDraftOutput =
  | {
      ok: true;
      hasDraft: boolean;
      versionId: string | null;
      versionNumber: number;
      createdBy: "coach" | "user" | "imported" | null;
      createdAt: string | null;
      content: string;
      contentLength: number;
    }
  | { ok: false; reason: string };

export function createReadDraftTool(context: PortfolioToolContext) {
  return tool({
    description: [
      "Haalt de laatste versie van het portfolio-document op zoals de kandidaat het nu ziet (inclusief eventuele edits van de kandidaat zelf).",
      "Roep PROACTIEF aan in de concept- of verfijnfase voordat je een herziening schrijft — zo bouw je voort op wat er nu staat, niet op een verouderde versie.",
      "Output bevat de volledige markdown-tekst + metadata (wie de laatste versie schreef: coach of user).",
    ].join(" "),
    inputSchema: readDraftInputSchema,
    execute: async (): Promise<ReadDraftOutput> => {
      if (!context.portfolioId) {
        return {
          ok: false,
          reason:
            "Geen portfolio aan deze chat gekoppeld. Dit is een legacy-chat die nog geen docmodel heeft.",
        };
      }
      try {
        const portfolio = await Leercoach.Portfolio.getById({
          portfolioId: context.portfolioId,
          userId: context.userId,
        });
        if (!portfolio) {
          return {
            ok: false,
            reason: "Portfolio niet gevonden.",
          };
        }
        if (!portfolio.currentVersionId) {
          return {
            ok: true,
            hasDraft: false,
            versionId: null,
            versionNumber: 0,
            createdBy: null,
            createdAt: null,
            content: "",
            contentLength: 0,
          };
        }
        const version = await Leercoach.Portfolio.getVersionById({
          versionId: portfolio.currentVersionId,
          userId: context.userId,
        });
        if (!version) {
          return {
            ok: false,
            reason: "Versie niet gevonden.",
          };
        }
        const versions = await Leercoach.Portfolio.listVersions({
          portfolioId: context.portfolioId,
          userId: context.userId,
          limit: 100,
        });
        return {
          ok: true,
          hasDraft: true,
          versionId: version.versionId,
          versionNumber: versions.length,
          createdBy: version.createdBy,
          createdAt: version.createdAt,
          content: version.content,
          contentLength: version.content.length,
        };
      } catch (err) {
        return {
          ok: false,
          reason: err instanceof Error ? err.message : String(err),
        };
      }
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
export function buildLeercoachTools(
  context: ToolContext & {
    portfolioId: string | null;
    currentMessageId: string | null;
  },
) {
  return {
    searchBewijsExamples: createSearchBewijsExamplesTool(context),
    searchPriorPortfolio: createSearchPriorPortfolioTool(context),
    listArtefacten: createListArtefactenTool(context),
    readArtefact: createReadArtefactTool(context),
    setPhase: createSetPhaseTool(context),
    readDraft: createReadDraftTool(context),
    saveDraft: createSaveDraftTool(context),
  };
}

// Tool set for Q&A-sessies. Currently empty — new KSS/diplomalijn/KB
// tools land here in a follow-up step. Returns the same shape as
// buildLeercoachTools so callers can destructure/spread uniformly,
// but with none of the portfolio-bound tools. Kept as a separate
// function (rather than a null-branching buildLeercoachTools) so
// type narrowing at call sites is explicit.
export function buildQATools(_context: QAToolContext) {
  return {} as const;
}

export type LeercoachTools = ReturnType<typeof buildLeercoachTools>;
export type QATools = ReturnType<typeof buildQATools>;
