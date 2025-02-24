import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { AddCertificate } from "./add-certificate/add-certificate";
import { Certificates } from "./certificates";

export default async function WatersportCertificatesSection({
  person,
}: {
  person: {
    id: string;
  };
}) {
  return (
    <div className="lg:col-span-2">
      <div className="w-full flex justify-between items-center mb-2">
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
          <div className="animate-pulse h-67 w-87 bg-slate-200 rounded-xl -my-1.5" />
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
