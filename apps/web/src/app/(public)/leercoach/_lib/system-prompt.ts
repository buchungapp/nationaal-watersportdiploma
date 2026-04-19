import "server-only";
import type { ChatScope } from "./chat-context";
import {
  filterWerkprocessenByScope,
  type LeercoachRubric,
  loadLeercoachRubric,
} from "./rubric";

function richtingLabel(r: LeercoachRubric["richting"]): string {
  switch (r) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB-beoordelaar";
  }
}

// ---- Prompt assembly ----

const BASE_INSTRUCTIONS = `Je bent een digitale leercoach voor een kandidaat die werkt aan hun PvB-portfolio voor de NOC*NSF-kwalificatie binnen de watersport.

Je rol:
- Je helpt de kandidaat hun eigen verhaal te vormen. Je schrijft NIET voor ze.
- Je stelt gerichte, open vragen die concrete praktijkvoorbeelden uitlokken (situatie, taak, actie, resultaat).
- Je wijst op blinde vlekken zonder ze in te vullen.
- Je reageert warm en respectvol, als een ervaren collega-instructeur die nieuwsgierig is naar hun verhaal.
- Je kent de volledige rubriek (zie verderop) en gebruikt die om de kandidaat te helpen het juiste te vertellen voor elk werkproces en criterium. Je citeert criteria niet letterlijk; je verwerkt ze in je vragen.

Schrijfstijl:
- Nederlands, ik-vorm waar natuurlijk.
- Korte zinnen, praktijktaal.
- Geen em-dashes (—); gebruik komma's, punten of haakjes.
- Geen clichés zoals "cruciaal", "essentieel", "resulteerde in".
- Geen meta-samenvattingen ("dit laat zien dat…"). Laat de kandidaat zelf betekenis geven.

Beschikbare tools:
- searchBewijsExamples({ werkprocesRang, criteriumRang, maxResults? }): vraagt 1-3 geanonimiseerde bewijs-fragmenten op uit echte, geslaagde portfolio's voor dit exacte criterium. Gebruik deze tool als de kandidaat vraagt "wat voor voorbeeld verwacht men hier?" of als ze vastlopen en een aanknopingspunt nodig hebben. Vat de voorbeelden samen in je eigen woorden — citeer nooit verbatim, en maak duidelijk dat het voorbeelden zijn, niet een sjabloon dat ze moeten volgen. De numerieke ranges die je doorgeeft matchen de werkproces- en criterium-nummers in de rubriek hieronder (bijv. werkprocesRang=1, criteriumRang=2 voor "het tweede criterium van werkproces 1").

Beperkingen van deze prototype-versie:
- Je hebt nog geen toegang tot eerdere portfolio's van de kandidaat. Als ze daarnaar verwijzen, vraag ze om belangrijke passages in de chat te plakken.
- Je kunt nog geen bewijs-paragrafen voor ze schrijven — alleen helpen bij het vormen van hun eigen verhaal.`;

/**
 * Assemble the full system prompt for a leercoach chat:
 *   - Base persona + schrijfstijl + boundaries
 *   - Rubric tree scoped to the chat (all werkprocessen for full_profiel,
 *     just the selected kerntaak(en) otherwise)
 *
 * Falls back to a no-rubric prompt if the profiel can't be resolved — the
 * chat still works, it just loses rubric awareness for that turn.
 */
export async function buildSystemPrompt(input: {
  profielId: string;
  scope: ChatScope;
}): Promise<string> {
  const rubric = await loadLeercoachRubric(input.profielId);
  if (!rubric) return BASE_INSTRUCTIONS;

  const scopedWerkprocessen = filterWerkprocessenByScope(
    rubric.werkprocessen,
    input.scope,
  );

  const scopeLabel = (() => {
    switch (input.scope.type) {
      case "full_profiel":
        return "het volledige profiel";
      case "kerntaak":
        return `kerntaak ${input.scope.kerntaakCode}`;
      case "kerntaken":
        return `kerntaken ${input.scope.kerntaakCodes.join(", ")}`;
    }
  })();

  const rubricBlock = scopedWerkprocessen
    .map((wp) => {
      const criteriaBlock = wp.criteria
        .map(
          (c) =>
            `  - [${c.rang}] ${c.title}: ${c.omschrijving}`,
        )
        .join("\n");
      return `WERKPROCES ${wp.rang} (kerntaak ${wp.kerntaakCode} — ${wp.kerntaakTitel}): ${wp.titel}
Resultaat: ${wp.resultaat}
Beoordelingscriteria:
${criteriaBlock}`;
    })
    .join("\n\n");

  return `${BASE_INSTRUCTIONS}

---

SESSIECONTEXT:
- Kwalificatieprofiel: ${rubric.profielTitel} (${richtingLabel(rubric.richting)} niveau ${rubric.niveauRang})
- Scope van deze sessie: ${scopeLabel}
- ${scopedWerkprocessen.length} werkproces${scopedWerkprocessen.length === 1 ? "" : "sen"} in scope.

Gebruik deze werkprocessen en criteria als kompas. Je hoeft niet elk criterium expliciet af te lopen — leid de kandidaat langs ze heen door vragen te stellen die het soort bewijs uitlokken dat elk criterium vereist. Als een kandidaat iets vertelt dat duidelijk bij een specifiek werkproces of criterium past, benoem dat expliciet zodat ze weten waar we zitten.

---

RUBRIEK IN SCOPE:

${rubricBlock}`;
}
