import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import { NewChatForm } from "../_components/NewChatForm";

export const metadata = {
  title: "Nieuwe leercoach-sessie",
  robots: { index: false, follow: false },
};

// Profiel + scope selector. Per Q1 decision (leercoach-pivot.md):
// - N3 always works on the whole profiel
// - N4 and N5 can pick: whole profiel OR a specific kerntaak OR a bundle
//   of kerntaken
//
// Server component loads the full profiel list with their kerntaken so the
// client picker can render kerntaak choices inline for N4/N5 selections.
export default async function NewLeercoachSessionPage() {
  const niveaus = await listKssNiveaus();
  const grouped = await Promise.all(
    niveaus.map(async (niveau) => {
      const profielen = await listKssKwalificatieprofielenWithOnderdelen(
        niveau.id,
      );
      return profielen.map((p) => ({
        id: p.id,
        titel: p.titel,
        richting: p.richting as "instructeur" | "leercoach" | "pvb_beoordelaar",
        niveauRang: niveau.rang,
        kerntaken: p.kerntaken.map((k) => ({
          id: k.id,
          titel: k.titel,
          rang: k.rang ?? 0,
        })),
      }));
    }),
  );

  const profielen = grouped.flat().sort((a, b) => {
    if (a.richting !== b.richting) {
      return (
        { instructeur: 0, leercoach: 1, pvb_beoordelaar: 2 }[a.richting] -
        { instructeur: 0, leercoach: 1, pvb_beoordelaar: 2 }[b.richting]
      );
    }
    return a.niveauRang - b.niveauRang;
  });

  return (
    <main className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Nieuwe sessie</h1>
        <p className="mt-2 max-w-2xl text-slate-700">
          Kies het kwalificatieprofiel waar je aan werkt. Op niveau 4 en 5 mag
          je kiezen of je je hele profiel doorloopt of je op één kerntaak
          richt.
        </p>
      </header>

      <NewChatForm profielen={profielen} />
    </main>
  );
}
