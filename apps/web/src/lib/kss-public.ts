import { KSS, withSupabaseClient } from "@nawadi/core";
import "server-only";
import { cacheLife } from "next/cache";
import { supabaseConfig } from "./nwd";

export type PublicRichting = "instructeur" | "leercoach" | "pvb_beoordelaar";

export type PublicKssCriterium = {
  id: string;
  title: string;
  omschrijving: string;
  rang: number;
};

export type PublicKssWerkproces = {
  id: string;
  titel: string;
  resultaat: string;
  rang: number;
  onderdeelTypes: Array<"portfolio" | "praktijk">;
  beoordelingscriteria: PublicKssCriterium[];
};

export type PublicKssOnderdeel = {
  id: string;
  type: "portfolio" | "praktijk";
  werkprocesIds: string[];
};

export type PublicKssKerntaak = {
  id: string;
  titel: string;
  type: "verplicht" | "facultatief";
  rang: number | null;
  onderdelen: PublicKssOnderdeel[];
  werkprocessen: PublicKssWerkproces[];
};

export type PublicKssProfiel = {
  id: string;
  titel: string;
  richting: PublicRichting;
  niveau: { id: string; rang: number };
  kerntaken: PublicKssKerntaak[];
};

async function withCtx<T>(cb: () => Promise<T>): Promise<T> {
  return withSupabaseClient(supabaseConfig, cb);
}

// Full KSS tree for a given niveau (optionally filtered by richting).
// Composed from core queries; runs ~1 + N + N*M queries in parallel.
// Safe to call from public pages — no auth needed, service-role under the hood.
export const getPublicKssTree = async ({
  rang,
  richting,
}: {
  rang: number;
  richting?: PublicRichting;
}): Promise<PublicKssProfiel[]> => {
  "use cache";
  cacheLife("days");

  return withCtx(async () => {
    const niveaus = await KSS.Kwalificatieprofiel.listNiveaus();
    const niveau = niveaus.find((n) => n.rang === rang);
    if (!niveau) return [];

    const profielen = await KSS.Kwalificatieprofiel.listWithOnderdelen({
      niveauId: niveau.id,
      richting,
    });

    const enrichedProfielen = await Promise.all(
      profielen.map(async (profiel) => {
        const kerntaken = await Promise.all(
          profiel.kerntaken.map(async (kerntaak) => {
            const [werkprocessen, onderdelenWithWps] = await Promise.all([
              KSS.Kwalificatieprofiel.listWerkprocessen({
                kerntaakId: kerntaak.id,
              }),
              Promise.all(
                kerntaak.onderdelen.map(async (onderdeel) => {
                  const wps =
                    await KSS.Kwalificatieprofiel.listWerkprocessenByOnderdeel(
                      {
                        kerntaakOnderdeelId: onderdeel.id,
                      },
                    );
                  return {
                    id: onderdeel.id,
                    type: onderdeel.type,
                    werkprocesIds: wps.map((w) => w.id),
                  };
                }),
              ),
            ]);

            const wpToOnderdeelTypes = new Map<
              string,
              Array<"portfolio" | "praktijk">
            >();
            for (const onderdeel of onderdelenWithWps) {
              for (const wpId of onderdeel.werkprocesIds) {
                const existing = wpToOnderdeelTypes.get(wpId) ?? [];
                if (!existing.includes(onderdeel.type)) {
                  existing.push(onderdeel.type);
                }
                wpToOnderdeelTypes.set(wpId, existing);
              }
            }

            const werkprocessenWithCriteria = await Promise.all(
              werkprocessen.map(async (wp) => {
                const criteria =
                  await KSS.Kwalificatieprofiel.listBeoordelingscriteria({
                    werkprocesId: wp.id,
                  });
                return {
                  id: wp.id,
                  titel: wp.titel,
                  resultaat: wp.resultaat,
                  rang: wp.rang,
                  onderdeelTypes: wpToOnderdeelTypes.get(wp.id) ?? [],
                  beoordelingscriteria: criteria.map((c) => ({
                    id: c.id,
                    title: c.title,
                    omschrijving: c.omschrijving,
                    rang: c.rang,
                  })),
                };
              }),
            );

            werkprocessenWithCriteria.sort((a, b) => a.rang - b.rang);

            return {
              id: kerntaak.id,
              titel: kerntaak.titel,
              type: kerntaak.type,
              rang: kerntaak.rang,
              onderdelen: onderdelenWithWps,
              werkprocessen: werkprocessenWithCriteria,
            };
          }),
        );

        return {
          id: profiel.id,
          titel: profiel.titel,
          richting: profiel.richting,
          niveau: profiel.niveau,
          kerntaken,
        };
      }),
    );

    return enrichedProfielen;
  });
};

// Instructiegroepen with their courses — for the /instructiegroepen page (P6).
export const listPublicInstructiegroepenWithCourses = async (
  richting: PublicRichting = "instructeur",
) => {
  "use cache";
  cacheLife("days");

  return withCtx(async () => {
    const rows = await KSS.InstructieGroep.listWithCourses({
      filter: { richting },
    });
    return rows;
  });
};
