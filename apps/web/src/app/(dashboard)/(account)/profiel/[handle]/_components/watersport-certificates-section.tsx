import type { User } from "@nawadi/core";
import { Suspense } from "react";
import Balancer from "react-wrap-balancer";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { AnimatedWave } from "~/app/_components/animated-wave";
import { AddCertificate } from "./external-certificate/add-certificate";
import { ExternalCertificatesList } from "./external-certificate/certificates-list";

interface WatersportCertificatesProps {
  personPromise: Promise<User.Person.$schema.Person>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function WatersportCertificatesContent({
  personPromise,
  searchParams,
}: WatersportCertificatesProps) {
  const person = await personPromise;

  return (
    <ExternalCertificatesList
      searchParams={searchParams}
      personId={person.id}
      whenResults={
        <div className="my-2">
          <Suspense fallback={<AddCertificateButtonFallback />}>
            <AddCertificateButton personPromise={personPromise} />
          </Suspense>
        </div>
      }
      noResults={
        <div className="relative bg-zinc-50/50 mt-2 pb-2 border-2 border-zinc-200 border-dashed rounded-md overflow-hidden">
          <div className="flex flex-col items-center mx-auto px-2 sm:px-4 pt-6 pb-10 max-w-lg text-center">
            <div className="space-y-2">
              <div>
                <Heading>
                  <Balancer>
                    Je hebt nog geen aanvullende watersportcertificaten
                    opgeslagen.
                  </Balancer>
                </Heading>
              </div>
            </div>

            <div className="my-6">
              <AddCertificateButton personPromise={personPromise} />
            </div>

            <Text>
              Wil je meer weten over deze functionaliteit?{" "}
              <TextLink
                href="/help/artikel/aanvullende-vaardigheden-opslaan-in-jouw-nwd"
                target="_blank"
              >
                Bezoek onze hulppagina.
              </TextLink>
            </Text>
          </div>
          <AnimatedWave textColorClassName="text-zinc-600" />
        </div>
      }
    />
  );
}

function AddCertificateButtonFallback() {
  return <div className="bg-slate-200 rounded-lg w-40.5 h-9 animate-pulse" />;
}

async function AddCertificateButton({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;

  return <AddCertificate className="" personId={person.id} />;
}

export default function WatersportCertificatesSection(
  props: WatersportCertificatesProps,
) {
  return (
    <StackedLayoutCardDisclosure
      className={gridContainer}
      defaultOpen
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Aanvullende vaardigheden</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            Je kan deze sectie gebruiken om jouw watersport gerelateerde zaken -
            zoals je vaarbewijs, navigatie diploma’s of buitenlandse bewijzen -
            bij elkaar te verzamelen!
          </Text>
        </>
      }
    >
      <Suspense
        fallback={
          <>
            <div className="my-2">
              <AddCertificateButtonFallback />
            </div>
            <GridList>
              <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
            </GridList>
          </>
        }
      >
        <WatersportCertificatesContent {...props} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
