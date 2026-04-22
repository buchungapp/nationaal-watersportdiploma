import { KSS } from "@nawadi/core";
import type { Metadata } from "next";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { listProfielenForUpload } from "../../../_lib/list-profielen-for-upload";
import { requireInstructorPerson } from "../../../_lib/require-instructor-person";
import { NewChatForm } from "../../_components/NewChatForm";
import { requireLeercoachEnabled } from "../../_lib/require-leercoach-enabled";

export const metadata: Metadata = {
  title: "Nieuw portfolio · leercoach",
  robots: { index: false, follow: false },
};

// Profiel + scope selector (Q1 rule):
//   - N3 kandidaten always work the whole profiel (picker auto-skips)
//   - N4 and N5 pick: whole profiel | kerntaak | kerntaken
// Server component loads the profielen + kerntaken so the client
// picker can render the kerntaak list inline without an extra roundtrip.
export default async function NewPortfolioPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  await requireLeercoachEnabled();
  await requireInstructorPerson(handle);

  // Shared loader: only profielen with at least one portfolio-kerntaak
  // surface here (praktijk-only qualifications like Wal/waterhulp 1 are
  // filtered out — there's no portfolio to write for them). Instructie-
  // groepen are loaded alongside so the picker can filter by richting
  // client-side; no filter at fetch time because the list is tiny
  // (~4 rows today) and shipping it once avoids a second server
  // round-trip when the user changes profiel mid-flow.
  const [profielen, instructieGroepen] = await Promise.all([
    listProfielenForUpload().then((rows) =>
      rows.sort((a, b) => {
        if (a.richting !== b.richting) {
          return (
            { instructeur: 0, leercoach: 1, pvb_beoordelaar: 2 }[a.richting] -
            { instructeur: 0, leercoach: 1, pvb_beoordelaar: 2 }[b.richting]
          );
        }
        return a.niveauRang - b.niveauRang;
      }),
    ),
    KSS.InstructieGroep.list({ filter: {} }),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <TextLink href={`/profiel/${handle}/leercoach`} className="text-sm">
          ← Terug naar leercoach
        </TextLink>
        <Heading>Nieuw portfolio-traject</Heading>
        <Text className="max-w-prose">
          Kies het kwalificatieprofiel waar je aan gaat werken. Op niveau 4 en 5
          mag je kiezen of je je hele profiel doorloopt of je op één kerntaak
          richt. Je kunt later altijd meer sessies aan hetzelfde portfolio
          koppelen.
        </Text>
      </div>

      <NewChatForm
        handle={handle}
        profielen={profielen}
        instructieGroepen={instructieGroepen}
      />
    </div>
  );
}
