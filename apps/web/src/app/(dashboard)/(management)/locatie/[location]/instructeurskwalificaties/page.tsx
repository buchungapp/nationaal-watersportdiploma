import { KSS } from "@nawadi/core";
import { Suspense } from "react";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCourses,
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { KwalificatiesTable } from "./_components/kwalificaties-table";

export default async function InstructeurskwalificatiesPage(props: {
  params: Promise<{ location: string }>;
}) {
  const params = await props.params;

  return (
    <div className="mx-auto max-w-7xl">
      <Heading>Instructeurskwalificaties</Heading>
      <Suspense fallback={null}>
        <KwalificatiesTableWrapper locationHandle={params.location} />
      </Suspense>
    </div>
  );
}

async function KwalificatiesTableWrapper({
  locationHandle,
}: {
  locationHandle: string;
}) {
  const location = await retrieveLocationByHandle(locationHandle);

  // Fetch all instructors for the location
  const instructors = await listPersonsForLocationWithPagination(location.id, {
    filter: { actorType: "instructor" },
    limit: 1000, // Get all instructors
  });

  // Fetch all courses
  const allCourses = await listCourses("consument");

  // Get the highest qualifications for all instructors at this location
  const kwalificaties =
    await KSS.Kwalificaties.listHighestKwalificatiePerCourseAndRichting({
      filter: {
        locationId: location.id,
      },
    });

  return (
    <KwalificatiesTable
      instructors={instructors.items}
      courses={allCourses}
      kwalificaties={kwalificaties}
      locationHandle={locationHandle}
    />
  );
}
