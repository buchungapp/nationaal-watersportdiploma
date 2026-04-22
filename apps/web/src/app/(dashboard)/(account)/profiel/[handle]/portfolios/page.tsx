import { AiCorpus } from "@nawadi/core";
import type { Metadata } from "next";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { listProfielenForUpload } from "../_lib/list-profielen-for-upload";
import { requireInstructorPerson } from "../_lib/require-instructor-person";
import { PortfolioDropZone } from "./_components/PortfolioDropZone";
import { PortfolioList } from "./_components/PortfolioList";

export const metadata: Metadata = {
  title: "Eerdere portfolio's",
  robots: { index: false, follow: false },
};

// Management view for previously-uploaded PvB portfolios.
//
// Two upload entry points, both going through the same server action +
// the same shared PortfolioUploadDialog:
//   1. Primary: inline 📎 button inside a leercoach chat session
//   2. Secondary (this page): drag-and-drop / click-to-select
//
// Gated to active instructor-ish persons via requireInstructorPerson.
// Uploaded portfolios are user-scoped (consent_level="user_only" +
// contributedByUserId), not person-scoped — role check here just
// controls who can SEE the surface.
export default async function PortfoliosPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const { user } = await requireInstructorPerson(handle);

  const [priors, profielen] = await Promise.all([
    AiCorpus.listUserPriorSources({ userId: user.authUserId }),
    listProfielenForUpload(),
  ]);
  const hasExistingUploads = priors.length > 0;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <TextLink href={`/profiel/${handle}`} className="text-sm">
          ← Terug naar profiel
        </TextLink>
        <Heading>Jouw eerdere portfolio's</Heading>
        <Text className="max-w-prose">
          Hier zie je wat je eerder hebt geüpload. Voeg een nieuwe toe door een
          PDF op het drop-veld hieronder te slepen, of upload tijdens een
          leercoach-sessie via de{" "}
          <span className="font-mono text-xs">
            📎 Eerder portfolio uploaden
          </span>
          -knop boven het invoerveld.
        </Text>
      </div>

      {hasExistingUploads ? (
        <section className="flex flex-col gap-4">
          <Heading level={2} className="!text-xl">
            Opgeslagen ({priors.length})
          </Heading>
          <PortfolioList
            handle={handle}
            priors={priors}
            profielen={profielen}
          />
          <PortfolioDropZone
            handle={handle}
            profielen={profielen}
            hasExistingUploads={true}
          />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <PortfolioDropZone
            handle={handle}
            profielen={profielen}
            hasExistingUploads={false}
          />
        </section>
      )}
    </div>
  );
}
