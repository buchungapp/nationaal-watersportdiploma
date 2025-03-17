import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  gridContainer,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { AddCertificate } from "./certificate/add-certificate";
import { Certificates } from "./certificates";

export default async function WatersportCertificatesSection({
  person,
}: {
  person: {
    id: string;
  };
}) {
  return (
    <div className={`${gridContainer} lg:col-span-3`}>
      <div className="flex justify-between items-center mb-2 w-full">
        <Subheading>Jouw Watersportcertificaten</Subheading>
        <AddCertificate className="-my-1.5" personId={person.id} />
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
            <li className="hidden sm:block bg-slate-200 rounded-xl w-full h-107 sm:h-78.5 animate-pulse delay-500" />
          </GridList>
        }
      >
        <Certificates
          personId={person.id}
          noResults={
            <Text className="italic">
              We hebben geen watersport certificaten voor jou kunnen vinden.
            </Text>
          }
        />
      </Suspense>
    </div>
  );
}
