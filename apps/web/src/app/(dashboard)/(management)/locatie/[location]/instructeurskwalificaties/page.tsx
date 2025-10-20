import { KSS } from "@nawadi/core";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCourses,
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { KwalificatiesTable } from "./_components/kwalificaties-table";

export default function InstructeurskwalificatiesPage(props: {
  params: Promise<{ location: string }>;
}) {
  return (
    <>
      <Heading>Instructeurskwalificaties</Heading>
      <Suspense fallback={null}>
        <KwalificatiesTableWrapper
          locationHandle={props.params.then((p) => p.location)}
        />
      </Suspense>
    </>
  );
}

async function KwalificatiesTableWrapper({
  locationHandle,
}: {
  locationHandle: Promise<string>;
}) {
  const location = await retrieveLocationByHandle(await locationHandle);

  // Fetch instructors, courses, and kwalificaties in parallel
  const [instructors, allCourses, kwalificaties] = await Promise.all([
    listPersonsForLocationWithPagination(location.id, {
      filter: { actorType: "instructor" },
      limit: 1000, // Get all instructors
    }),
    listCourses("consument"),
    KSS.Kwalificaties.listHighestKwalificatiePerCourseAndRichting({
      filter: {
        locationId: location.id,
      },
    }),
  ]);

  return (
    <KwalificatiesTable
      instructors={instructors.items}
      courses={allCourses}
      kwalificaties={kwalificaties}
      locationHandle={location.handle}
    />
  );
}
