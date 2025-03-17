import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { NWDCertificates } from "./certificates";

export default async function NWDCertificatesSection({
  person,
}: {
  person: {
    id: string;
  };
}) {
  return (
    <div className={`${gridContainer} lg:col-span-2`}>
      <Subheading>Jouw NWD-diploma's</Subheading>
      <Text>
        Hieronder vind je een overzicht van de NWD-diploma's die je hebt
        behaald. Klik ze aan en leer meer over je diploma en vier het succes nog
        een keer! Mis je een diploma? Neem dan contact op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar je de cursus hebt gevolgd.
      </Text>
      <Divider className="mt-2 mb-4" />
      <Suspense
        fallback={
          <GridList>
            <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
            <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse delay-500" />
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
    </div>
  );
}
