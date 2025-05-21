import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle } from "~/lib/nwd";
import { AddCertificate } from "./certificate/add-certificate";
import { Certificates } from "./certificates";

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
    <Certificates
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

  return <AddCertificate className="-my-1.5" personId={person.id} />;
}

export default function WatersportCertificatesSection(
  props: WatersportCertificatesProps,
) {
  return (
    <StackedLayoutCard className={`${gridContainer} lg:col-span-3`}>
      <div className="flex justify-between items-center mb-2 w-full">
        <Subheading>Jouw Watersportcertificaten</Subheading>
        <Suspense
          fallback={
            <div className="bg-slate-200 -my-1.5 rounded-lg w-40.5 h-9 animate-pulse" />
          }
        >
          <AddCertificateButton params={props.params} />
        </Suspense>
      </div>
      <Text>
        Hieronder vind je een overzicht van alle Watersportcertificaten die je
        hebt behaald.
      </Text>
      <Divider className="mt-2 mb-4" />
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
    </StackedLayoutCard>
  );
}
