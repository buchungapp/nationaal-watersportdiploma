import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCountries,
  listCourses,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import CreatePvbForm from "./_components/create-pvb-form";

async function CreatePvbContent(props: {
  params: Promise<{ location: string }>;
  searchParams: Promise<{ niveau?: string }>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const location = await retrieveLocationByHandle(params.location);

  // Fetch required data for the form
  const [countries, niveausResult, coursesResult] = await Promise.all([
    listCountries(),
    listKssNiveaus(),
    listCourses("consument"),
  ]);

  // Transform courses to match the expected interface (filter out nulls)
  const niveaus = niveausResult.filter(
    (niveau): niveau is typeof niveau & { rang: number } => niveau.rang < 4,
  );
  const courses = coursesResult
    .filter(
      (course): course is typeof course & { title: string } =>
        course.title !== null,
    )
    .map((course) => ({
      id: course.id,
      title: course.title,
    }));

  // Fetch kwalificatieprofielen if niveau is selected
  let kwalificatieprofielen: Awaited<
    ReturnType<typeof listKssKwalificatieprofielenWithOnderdelen>
  > = [];
  if (searchParams.niveau) {
    try {
      kwalificatieprofielen = await listKssKwalificatieprofielenWithOnderdelen(
        searchParams.niveau,
      );
    } catch (error) {
      console.error("Failed to load kwalificatieprofielen:", error);
      // Continue without kwalificatieprofielen
    }
  }

  return (
    <SWRConfig
      value={{
        fallback: {
          [unstable_serialize([
            "allPersons",
            location.id,
            "?actorType=instructor",
          ])]: listPersonsForLocationWithPagination(location.id, {
            filter: {
              actorType: "instructor",
            },
            limit: 25,
          }),
          [unstable_serialize([
            "allPersons",
            location.id,
            "?actorType=pvb_beoordelaar",
          ])]: listPersonsForLocationWithPagination(location.id, {
            filter: {
              actorType: "pvb_beoordelaar",
            },
            limit: 25,
          }),
        },
      }}
    >
      <CreatePvbForm
        locationId={location.id}
        countries={countries}
        niveaus={niveaus}
        courses={courses}
        kwalificatieprofielen={kwalificatieprofielen}
        selectedNiveauId={searchParams.niveau || ""}
      />
    </SWRConfig>
  );
}

export default function Page(props: {
  params: Promise<{ location: string }>;
  searchParams: Promise<{ niveau?: string }>;
}) {
  return (
    <>
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="sm:flex-1 max-sm:w-full">
          <Heading>Nieuwe PvB aanvragen</Heading>
          <p className="mt-2 text-zinc-600">
            Maak meerdere PvB aanvragen tegelijk aan voor verschillende
            kandidaten.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <Suspense fallback={<div>Laden...</div>}>
          <CreatePvbContent
            params={props.params}
            searchParams={props.searchParams}
          />
        </Suspense>
      </div>
    </>
  );
}
