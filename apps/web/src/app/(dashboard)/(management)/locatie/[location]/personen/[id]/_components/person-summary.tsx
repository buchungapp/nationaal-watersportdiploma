import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import {
  getPersonByIdForLocation,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

type PersonSummaryProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

async function PersonSummaryContent(props: PersonSummaryProps) {
  const params = await props.params;
  const retrieveLocationPromise = retrieveLocationByHandle(params.location);
  const retrievePersonPromise = retrieveLocationPromise.then(
    async (location) => {
      const person = await getPersonByIdForLocation(params.id, location.id);

      if (!person) {
        notFound();
      }

      return person;
    },
  );

  const [person, rolesForUser] = await Promise.all([
    retrievePersonPromise,
    retrieveLocationPromise.then((location) =>
      listRolesForLocation(location.id),
    ),
  ]);

  const isLocationAdmin = rolesForUser.includes("location_admin");

  return (
    <DescriptionList>
      <DescriptionTerm>NWD-id</DescriptionTerm>
      <DescriptionDetails>
        <Code>{person.handle}</Code>
      </DescriptionDetails>

      <DescriptionTerm>Voornaam</DescriptionTerm>
      <DescriptionDetails>{person.firstName}</DescriptionDetails>

      <DescriptionTerm>Tussenvoegsel</DescriptionTerm>
      <DescriptionDetails>{person.lastNamePrefix ?? "-"}</DescriptionDetails>

      <DescriptionTerm>Achternaam</DescriptionTerm>
      <DescriptionDetails>{person.lastName ?? "-"}</DescriptionDetails>

      <DescriptionTerm>Geboortedatum</DescriptionTerm>
      <DescriptionDetails>
        {person.dateOfBirth
          ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
          : "-"}
      </DescriptionDetails>

      <DescriptionTerm>Geboorteplaats</DescriptionTerm>
      <DescriptionDetails>{person.birthCity ?? "-"}</DescriptionDetails>

      <DescriptionTerm>Geboorteland</DescriptionTerm>
      <DescriptionDetails>
        {person.birthCountry?.name ?? "-"}
      </DescriptionDetails>

      {isLocationAdmin ? (
        <>
          <DescriptionTerm>E-mail</DescriptionTerm>
          <DescriptionDetails>{person.email ?? "-"}</DescriptionDetails>
        </>
      ) : null}
    </DescriptionList>
  );
}

export function PersonSummaryFallback() {
  return (
    <DescriptionList>
      <DescriptionTerm>Voornaam</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-32 h-4.25 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Tussenvoegsel</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-24 h-4.25 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Achternaam</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-40 h-4.25 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Geboortedatum</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-28 h-4.25 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Geboorteplaats</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-36 h-4.25 animate-pulse" />
      </DescriptionDetails>

      <DescriptionTerm>Geboorteland</DescriptionTerm>
      <DescriptionDetails>
        <span className="inline-block bg-gray-200 rounded w-32 h-4.25 animate-pulse" />
      </DescriptionDetails>
    </DescriptionList>
  );
}

export function PersonSummary(props: PersonSummaryProps) {
  return (
    <Suspense fallback={<PersonSummaryFallback />}>
      <PersonSummaryContent {...props} />
    </Suspense>
  );
}
