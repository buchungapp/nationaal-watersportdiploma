import "server-only";
import {
  listKssBeoordelingscriteriaByWerkprocesId,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
  listKssWerkprocessenByKerntaakId,
} from "~/lib/nwd";
import type { ProfielSummary, RubricTree, RubricWerkproces } from "./types";

// Re-export types so existing imports of `./rubric` type names keep working
// on the server side. Client components must import from `./types` directly
// to avoid pulling the server stack across the RSC boundary.
export type {
  ProfielSummary,
  Richting,
  RubricCriterium,
  RubricTree,
  RubricWerkproces,
} from "./types";

// List every kwalificatieprofiel that has at least one werkproces.
// Phase 1 does not apply the full data-health gate from the CEO plan — it just
// hides obvious stubs so the sandbox doesn't offer empty shells.
export async function listSelectableProfielen(): Promise<ProfielSummary[]> {
  const niveaus = await listKssNiveaus();

  const grouped = await Promise.all(
    niveaus.map(async (niveau) => {
      const profielen = await listKssKwalificatieprofielenWithOnderdelen(
        niveau.id,
      );
      return profielen.map((p) => ({
        id: p.id,
        titel: p.titel,
        richting: p.richting,
        niveauRang: niveau.rang,
        kerntaakIds: p.kerntaken.map((k) => k.id),
      }));
    }),
  );

  const flat = grouped.flat();

  // Count werkprocessen per profiel so we can filter out stubs.
  const summaries = await Promise.all(
    flat.map(async (p) => {
      const werkprocesLists = await Promise.all(
        p.kerntaakIds.map((kerntaakId) =>
          listKssWerkprocessenByKerntaakId(kerntaakId),
        ),
      );
      const werkprocesCount = werkprocesLists.reduce(
        (sum, list) => sum + list.length,
        0,
      );
      return {
        id: p.id,
        titel: p.titel,
        richting: p.richting,
        niveauRang: p.niveauRang,
        werkprocesCount,
      };
    }),
  );

  return summaries
    .filter((p) => p.werkprocesCount > 0)
    .sort((a, b) => {
      if (a.richting !== b.richting) {
        return richtingOrder[a.richting] - richtingOrder[b.richting];
      }
      return a.niveauRang - b.niveauRang;
    });
}

const richtingOrder = {
  instructeur: 0,
  leercoach: 1,
  pvb_beoordelaar: 2,
} as const;

// Load the full rubric tree for one kwalificatieprofiel, sorted by werkproces rang.
export async function loadRubricTree(profielId: string): Promise<RubricTree> {
  const niveaus = await listKssNiveaus();

  // Find the profiel by scanning every niveau — no byId helper is no-auth exposed.
  const niveauProfielPairs = await Promise.all(
    niveaus.map(async (niveau) => {
      const profielen = await listKssKwalificatieprofielenWithOnderdelen(
        niveau.id,
      );
      return { niveau, profielen };
    }),
  );

  for (const { niveau, profielen } of niveauProfielPairs) {
    const match = profielen.find((p) => p.id === profielId);
    if (!match) continue;

    const werkprocessenNested = await Promise.all(
      match.kerntaken.map((kt) => listKssWerkprocessenByKerntaakId(kt.id)),
    );

    const werkprocessenFlat = werkprocessenNested.flat();

    const werkprocessen = await Promise.all(
      werkprocessenFlat.map(async (wp) => {
        const criteria = await listKssBeoordelingscriteriaByWerkprocesId(wp.id);
        const rubricWp: RubricWerkproces = {
          id: wp.id,
          kerntaakId: wp.kerntaakId,
          titel: wp.titel,
          resultaat: wp.resultaat,
          rang: wp.rang,
          criteria: criteria
            .map((c) => ({
              id: c.id,
              title: c.title,
              omschrijving: c.omschrijving,
              rang: c.rang,
            }))
            .sort((a, b) => a.rang - b.rang),
        };
        return rubricWp;
      }),
    );

    return {
      profielId: match.id,
      profielTitel: match.titel,
      richting: match.richting,
      niveauRang: niveau.rang,
      werkprocessen: werkprocessen.sort((a, b) => a.rang - b.rang),
    };
  }

  throw new Error(`Kwalificatieprofiel ${profielId} niet gevonden.`);
}
