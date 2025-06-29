import { Suspense } from "react";
import { SWRConfig, unstable_serialize } from "swr";
import { Heading } from "~/app/(dashboard)/_components/heading";
import {
  listCountries,
  listPersonsForLocationWithPagination,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import CreatePvbForm from "./_components/create-pvb-form";

async function CreatePvbContent(props: {
  params: Promise<{ location: string }>;
}) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  // Fetch required data for the form
  const countries = await listCountries();

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
      <CreatePvbForm locationId={location.id} countries={countries} />
    </SWRConfig>
  );
}

export default function Page(props: {
  params: Promise<{ location: string }>;
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
          <CreatePvbContent params={props.params} />
        </Suspense>
      </div>
    </>
  );
}
