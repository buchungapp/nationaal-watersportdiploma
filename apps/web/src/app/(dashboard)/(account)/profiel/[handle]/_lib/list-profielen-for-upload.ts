import "server-only";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";

// Flat list of all KSS kwalificatieprofielen that have at least one
// portfolio-type assessment, plus their portfolio-relevant kerntaken.
//
// Used by every surface where the kandidaat picks "which profile is
// this about?":
//   - /profiel/[handle]/portfolios (upload dialog's profiel picker)
//   - /profiel/[handle]/leercoach/chat/[id] (same dialog, seeded with
//     the current chat's profielId)
//   - /profiel/[handle]/leercoach/portfolio/nieuw (portfolio scope picker)
//
// Filtering rules:
//   1. A `kerntaakOnderdeel` has `type: "portfolio" | "praktijk"`. A
//      kerntaak that carries NO portfolio-onderdelen is praktijk-only
//      — there's no bewijs to write, so we drop it.
//   2. A profiel that, after rule (1), has zero kerntaken left is
//      portfolio-irrelevant and drops out entirely (e.g. "Wal/waterhulp 1"
//      is praktijk-only).
//
// Kerntaken come back with the portfolio-relevant subset; the picker
// uses them for the scope sub-picker on N4/N5. When this grows past
// the "one walk per render" cost we'll push the filter into a
// dedicated core helper.

export type ProfielForUpload = {
  id: string;
  titel: string;
  richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
};

export async function listProfielenForUpload(): Promise<ProfielForUpload[]> {
  const niveaus = await listKssNiveaus();
  const grouped = await Promise.all(
    niveaus.map(async (niveau) => {
      const profielen = await listKssKwalificatieprofielenWithOnderdelen(
        niveau.id,
      );
      return profielen
        .map((p) => {
          const portfolioKerntaken = p.kerntaken.filter((k) =>
            k.onderdelen.some((o) => o.type === "portfolio"),
          );
          return {
            id: p.id,
            titel: p.titel,
            richting: p.richting as ProfielForUpload["richting"],
            niveauRang: niveau.rang,
            kerntaken: portfolioKerntaken.map((k) => ({
              id: k.id,
              titel: k.titel,
              rang: k.rang ?? 0,
            })),
          };
        })
        .filter((p) => p.kerntaken.length > 0);
    }),
  );
  return grouped.flat();
}
