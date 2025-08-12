import { AcademicCapIcon } from "@heroicons/react/24/outline";
import { KSS, type User } from "@nawadi/core";
import { Suspense } from "react";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { listCourses } from "~/lib/nwd";
import { KwalificatiesTable } from "./kwalificaties-table";

async function KwalificatiesContent({
  personPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
}) {
  const person = await personPromise;

  const [kwalificaties, courses] = await Promise.all([
    KSS.Kwalificaties.listHighestKwalificatiePerCourseAndRichting({
      filter: {
        personId: person.id,
      },
    }),
    listCourses("consument"),
  ]);

  return (
    <>
      {kwalificaties.length > 0 ? (
        <KwalificatiesTable kwalificaties={kwalificaties} courses={courses} />
      ) : (
        <div className="py-6 text-center">
          <AcademicCapIcon className="mx-auto size-10 text-gray-400" />
          <Text className="mt-1.5 text-gray-600 dark:text-gray-400 text-sm">
            Geen kwalificaties gevonden.
          </Text>
        </div>
      )}
    </>
  );
}

function KwalificatiesFallback() {
  return (
    <KwalificatiesTable kwalificaties={[]} courses={[]} placeholderRows={1} />
  );
}

export function Kwalificaties({
  personPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
}) {
  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Jouw kwalificaties</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>De kwalificaties die je hebt behaald.</Text>
        </>
      }
    >
      <Suspense fallback={<KwalificatiesFallback />}>
        <KwalificatiesContent personPromise={personPromise} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
