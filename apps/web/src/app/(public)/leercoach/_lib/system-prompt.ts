import "server-only";
import {
  listKssBeoordelingscriteriaByWerkprocesId,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
  listKssWerkprocessenByKerntaakId,
} from "~/lib/nwd";
import type { ChatScope } from "./chat-context";

// Flat rubric shape tailored for the leercoach system prompt. Intentionally
// not reusing the sandbox's RubricTree type so we don't couple the
// leercoach to code that will retire in P5 when the sandbox is removed.
type LeercoachRubric = {
  profielTitel: string;
  niveauRang: number;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  werkprocessen: Array<{
    id: string;
    kerntaakId: string;
    kerntaakCode: string;
    kerntaakTitel: string;
    rang: number;
    titel: string;
    resultaat: string;
    criteria: Array<{
      id: string;
      rang: number;
      title: string;
      omschrijving: string;
    }>;
  }>;
};

// Load the full rubric for a profiel, with kerntaakCode + kerntaakTitel
// duplicated onto each werkproces so scope filtering + prompt formatting
// don't require a second lookup.
async function loadLeercoachRubric(
  profielId: string,
): Promise<LeercoachRubric | null> {
  const niveaus = await listKssNiveaus();
  for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    const match = profielen.find((p) => p.id === profielId);
    if (!match) continue;

    const werkprocessenNested = await Promise.all(
      match.kerntaken.map(async (kt) => {
        const wps = await listKssWerkprocessenByKerntaakId(kt.id);
        return wps.map((wp) => ({
          wp,
          kerntaakCode: String(kt.rang ?? ""),
          kerntaakTitel: kt.titel,
        }));
      }),
    );
    const werkprocessenFlat = werkprocessenNested.flat();

    const werkprocessen = await Promise.all(
      werkprocessenFlat.map(async ({ wp, kerntaakCode, kerntaakTitel }) => {
        const criteria = await listKssBeoordelingscriteriaByWerkprocesId(
          wp.id,
        );
        return {
          id: wp.id,
          kerntaakId: wp.kerntaakId,
          kerntaakCode,
          kerntaakTitel,
          rang: wp.rang ?? 0,
          titel: wp.titel,
          resultaat: wp.resultaat,
          criteria: criteria
            .map((c) => ({
              id: c.id,
              rang: c.rang ?? 0,
              title: c.title,
              omschrijving: c.omschrijving,
            }))
            .sort((a, b) => a.rang - b.rang),
        };
      }),
    );

    return {
      profielTitel: match.titel,
      niveauRang: niveau.rang,
      richting: match.richting,
      werkprocessen: werkprocessen.sort((a, b) => a.rang - b.rang),
    };
  }
  return null;
}

function filterWerkprocessenByScope<T extends { kerntaakCode: string }>(
  werkprocessen: T[],
  scope: ChatScope,
): T[] {
  switch (scope.type) {
    case "full_profiel":
      return werkprocessen;
    case "kerntaak":
      return werkprocessen.filter(
        (wp) => wp.kerntaakCode === scope.kerntaakCode,
      );
    case "kerntaken":
      return werkprocessen.filter((wp) =>
        scope.kerntaakCodes.includes(wp.kerntaakCode),
      );
  }
}

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
