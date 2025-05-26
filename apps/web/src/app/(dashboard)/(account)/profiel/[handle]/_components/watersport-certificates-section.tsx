import { Suspense } from "react";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle } from "~/lib/nwd";
import { AddCertificate } from "./external-certificate/add-certificate";
import { ExternalCertificatesList } from "./external-certificate/certificates-list";

interface WatersportCertificatesProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function WatersportCertificatesContent({
  params,
  searchParams,
}: WatersportCertificatesProps) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return (
    <ExternalCertificatesList
      searchParams={searchParams}
      personId={person.id}
      noResults={
        <Text className="italic">
          We hebben geen watersport certificaten voor jou kunnen vinden.
        </Text>
      }
    />
  );
}

async function AddCertificateButton({
  params,
}: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return <AddCertificate className="" personId={person.id} />;
}

export default function WatersportCertificatesSection(
  props: WatersportCertificatesProps,
) {
  return (
    <StackedLayoutCardDisclosure
      className={gridContainer}
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Overige watersportcertificaten</Subheading>
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
      <div className="my-2">
        <Suspense
          fallback={
            <div className="bg-slate-200 rounded-lg w-40.5 h-9 animate-pulse" />
          }
        >
          <AddCertificateButton params={props.params} />
        </Suspense>
      </div>
      <Suspense
        fallback={
          <GridList>
            <li className="bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse" />
            <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse [animation-delay:300ms]" />
            <li className="hidden lg:block bg-slate-200 rounded-xl w-full h-107 lg:h-78.5 animate-pulse [animation-delay:600ms]" />
          </GridList>
        }
      >
        <WatersportCertificatesContent {...props} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
