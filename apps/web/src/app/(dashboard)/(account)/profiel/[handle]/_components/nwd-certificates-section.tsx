import { Suspense } from "react";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle } from "~/lib/nwd";
import { NWDCertificates } from "./certificates";

async function NWDCertificatesContent({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return (
    <Suspense
      fallback={
        <GridList>
          <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
          <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse [animation-delay:300ms]" />
        </GridList>
      }
    >
      <NWDCertificates
        personId={person.id}
        noResults={
          <Text className="mb-2 italic">
            Je hebt nog geen NWD-diploma's behaald. Klopt dit niet? Neem dan
            contact op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar je de cursus hebt gevolgd.
          </Text>
        }
      />
    </Suspense>
  );
}

export default function NWDCertificatesSection(props: {
  params: Promise<{ handle: string }>;
}) {
  return (
    <div className={`${gridContainer} lg:col-span-2 mb-6`}>
      <StackedLayoutCard className="mb-3">
        <Subheading>Jouw NWD-diploma's</Subheading>
        <Text>
          Hieronder vind je een overzicht van de NWD-diploma's die je hebt
          behaald. Klik ze aan en leer meer over je diploma en vier het succes
          nog een keer! Mis je een diploma? Neem dan contact op met de{" "}
          <TextLink href="/vaarlocaties" target="_blank">
            vaarlocatie
          </TextLink>{" "}
          waar je de cursus hebt gevolgd.
        </Text>
      </StackedLayoutCard>
      <Suspense
        fallback={
          <GridList>
            <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
            <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse delay-500" />
          </GridList>
        }
      >
        <NWDCertificatesContent {...props} />
      </Suspense>
    </div>
  );
}
