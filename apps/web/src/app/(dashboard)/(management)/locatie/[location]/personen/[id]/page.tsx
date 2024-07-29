import { notFound } from "next/navigation";
import {
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import dayjs from "~/lib/dayjs";

import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import {
  ExternalCertificates,
  NWDCertificates,
} from "~/app/(dashboard)/_components/nwd/certificates";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  getPersonById,
  listCountries,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ChangeEmail, EditDetails } from "./_components/action-buttons";
import { RoleToggleCheckbox } from "./_components/role-checkbox";

const ROLES = [
  {
    type: "student",
    label: "Cursist",
    description: "Kan toegevoegd worden aan cohorten.",
  },
  {
    type: "instructor",
    label: "Instructeur",
    description:
      "Geeft lessen, kan toegevoegd worden aan cohorten en kan de diplomalijn inzien.",
  },
  {
    type: "location_admin",
    label: "Locatiebeheerder",
    description:
      "Algemeen beheer van de locatie, kan alle locatiegegevens inzien en aanpassen.",
  },
] as const;

export default async function Page({
  params,
}: {
  params: {
    location: string;
    id: string;
  };
}) {
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

  const [person, rolesForUser, rolesInLocation, location, countries] =
    await Promise.all([
      retrievePersonPromise,
      retrieveLocationPromise.then((location) =>
        listRolesForLocation(location.id),
      ),
      retrievePersonPromise.then(async (person) => {
        const location = await retrieveLocationPromise;

        return listRolesForLocation(location.id, person.id);
      }),
      retrieveLocationPromise,
      listCountries(),
    ]);

  if (!person) {
    notFound();
  }

  const {
    firstName,
    lastNamePrefix,
    lastName,
    dateOfBirth,
    birthCity,
    birthCountry,
  } = person;

  const isLocationAdmin = rolesForUser.includes("location_admin");
  const isStudentOrInstructor = rolesInLocation.some((role) =>
    ["student", "instructor"].includes(role),
  );

  return (
    <>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Terug</RouterPreviousButton>
      </div>

      <div className="mt-4 lg:mt-8 flex flex-wrap justify-between gap-x-6">
        <div className="flex items-center gap-4">
          <Heading>
            {[person.firstName, person.lastNamePrefix, person.lastName]
              .filter(Boolean)
              .join(" ")}
          </Heading>
        </div>
        {isLocationAdmin ? (
          <div className="flex gap-4">
            <EditDetails
              person={{
                id: person.id,
                firstName,
                lastNamePrefix,
                lastName,
                dateOfBirth,
                birthCity,
                birthCountry,
              }}
              locationId={location.id}
              countries={countries}
            />
            <ChangeEmail personId={person.id} locationId={location.id} />
          </div>
        ) : null}
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div>
            <Subheading>Samenvatting</Subheading>
            <Divider className="mt-2 mb-4" />
            <DescriptionList>
              <DescriptionTerm>Voornaam</DescriptionTerm>
              <DescriptionDetails>{person.firstName}</DescriptionDetails>

              <DescriptionTerm>Tussenvoegsel</DescriptionTerm>
              <DescriptionDetails>
                {person.lastNamePrefix ?? "-"}
              </DescriptionDetails>

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
          </div>

          {isStudentOrInstructor ? (
            <>
              <div className="mt-8">
                <Subheading>NWD-diploma's</Subheading>
                <Divider className="mt-2 mb-4" />
                <Suspense>
                  <NWDCertificates
                    personId={person.id}
                    locationId={location.id}
                    noResults={
                      <Text className="italic">
                        Geen NWD-diploma's kunnen vinden.
                      </Text>
                    }
                  />
                </Suspense>
              </div>

              <div className="mt-8">
                <Subheading>Overige certificaten</Subheading>
                <Divider className="mt-2 mb-4" />
                <Suspense>
                  <ExternalCertificates
                    personId={person.id}
                    locationId={location.id}
                    noResults={
                      <Text className="italic">
                        Geen overige certificaten kunnen vinden.
                      </Text>
                    }
                  />
                </Suspense>
              </div>
            </>
          ) : null}
        </div>

        {isLocationAdmin ? (
          <>
            <div className="lg:col-start-3">
              <div>
                <Subheading>Rollen</Subheading>
                <Divider className="mt-2 mb-4" />
                <Text>
                  Geef de rollen aan die deze persoon heeft binnen de locatie.{" "}
                  <Strong>
                    Als er geen rollen meer zijn aangevinkt, wordt de persoon
                    uit de locatie verwijderd!
                  </Strong>
                </Text>
                <CheckboxGroup className="mt-4">
                  {ROLES.map((role) => (
                    <CheckboxField key={role.type}>
                      <RoleToggleCheckbox
                        roles={rolesInLocation}
                        type={role.type}
                        locationId={location.id}
                        personId={person.id}
                      />
                      <Label>{role.label}</Label>
                      <Description>{role.description}</Description>
                    </CheckboxField>
                  ))}
                </CheckboxGroup>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
