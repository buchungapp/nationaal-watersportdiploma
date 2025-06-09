import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  getPersonById,
  listCountries,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ChangeEmail, EditDetails } from "./action-buttons";

type EditPersonProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

async function EditPersonContent(props: EditPersonProps) {
  const params = await props.params;
  const retrieveLocationPromise = retrieveLocationByHandle(params.location);
  const retrievePersonPromise = retrieveLocationPromise.then(
    async (location) => {
      const person = await getPersonById(params.id, location.id);

      if (!person) {
        notFound();
      }

      return person;
    },
  );

  const [person, rolesForUser, location, countries] = await Promise.all([
    retrievePersonPromise,
    retrieveLocationPromise.then((location) =>
      listRolesForLocation(location.id),
    ),
    retrieveLocationPromise,
    listCountries(),
  ]);

  const isLocationAdmin = rolesForUser.includes("location_admin");
  if (!isLocationAdmin) return null;

  return (
    <div className="flex gap-4">
      <EditDetails
        person={{
          id: person.id,
          firstName: person.firstName,
          lastNamePrefix: person.lastNamePrefix,
          lastName: person.lastName,
          dateOfBirth: person.dateOfBirth,
          birthCity: person.birthCity,
          birthCountry: person.birthCountry,
        }}
        locationId={location.id}
        countries={countries}
      />
      <ChangeEmail personId={person.id} locationId={location.id} />
    </div>
  );
}

export function EditPerson(props: EditPersonProps) {
  return (
    <Suspense
      fallback={
        <div className="flex gap-4">
          <span className="block bg-gray-200 rounded-md w-38 h-9 animate-pulse" />
          <span className="block bg-gray-200 rounded-md w-34 h-9 animate-pulse" />
        </div>
      }
    >
      <EditPersonContent {...props} />
    </Suspense>
  );
}
