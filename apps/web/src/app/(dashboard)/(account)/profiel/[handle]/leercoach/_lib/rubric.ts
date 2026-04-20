import "server-only";
import {
  listKssBeoordelingscriteriaByWerkprocesId,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
  listKssWerkprocessenByKerntaakId,
} from "~/lib/nwd";
import type { ChatScope } from "./chat-context";

// Shared rubric types + loader + scope filter for the leercoach.
// Used by both the system-prompt builder (renders the rubric into the
// model's context) and the searchBewijsExamples tool (resolves
// werkprocesRang + criteriumRang → criteriumId so we can query
// ai_corpus).
//
// Intentionally not reusing the sandbox's RubricTree type so we don't
// couple the leercoach to code that will retire in P5.

export type LeercoachRubric = {
  profielTitel: string;
  niveauRang: number;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  werkprocessen: LeercoachWerkproces[];
};

export type LeercoachWerkproces = {
  id: string;
  kerntaakId: string;
  kerntaakCode: string;
  kerntaakTitel: string;
  rang: number;
  titel: string;
  resultaat: string;
  criteria: LeercoachCriterium[];
};

export type LeercoachCriterium = {
  id: string;
  rang: number;
  title: string;
  omschrijving: string;
};

/**
 * Load the full rubric for a profiel. Each werkproces gets its
 * kerntaakCode + kerntaakTitel duplicated inline so scope filtering +
 * prompt formatting don't need a second lookup.
 *
 * Returns null when the profiel can't be resolved — callers should
 * degrade gracefully (empty system prompt rubric, tool returns "profiel
 * onbekend").
 */
export async function loadLeercoachRubric(
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
        } satisfies LeercoachWerkproces;
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

/**
 * Filter werkprocessen down to the ones that are in scope for this chat:
 *   - full_profiel: all
 *   - kerntaak: only the werkprocessen of the single kerntaak
 *   - kerntaken: only the werkprocessen of those kerntaken
 */
export function filterWerkprocessenByScope<
  T extends { kerntaakCode: string },
>(werkprocessen: T[], scope: ChatScope): T[] {
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

/**
 * Resolve a (werkprocesRang, criteriumRang) pair to the concrete
 * criteriumId UUID. Respects scope so a tool can't retrieve examples for
 * a werkproces that's outside the chat's focus.
 *
 * Returns the resolved ids plus human-readable labels so tool output
 * doesn't need a second round trip to render.
 */
export function resolveCriteriumWithinScope(input: {
  rubric: LeercoachRubric;
  scope: ChatScope;
  werkprocesRang: number;
  criteriumRang: number;
}): {
  werkproces: LeercoachWerkproces;
  criterium: LeercoachCriterium;
} | null {
  const scoped = filterWerkprocessenByScope(input.rubric.werkprocessen, input.scope);
  const werkproces = scoped.find((w) => w.rang === input.werkprocesRang);
  if (!werkproces) return null;
  const criterium = werkproces.criteria.find(
    (c) => c.rang === input.criteriumRang,
  );
  if (!criterium) return null;
  return { werkproces, criterium };
}
