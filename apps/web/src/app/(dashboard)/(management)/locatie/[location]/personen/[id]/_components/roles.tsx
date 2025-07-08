import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  getPersonById,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { RoleToggleCheckbox } from "./role-checkbox";

type RolesProps = {
  params: Promise<{
    location: string;
    id: string;
  }>;
};

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
      "Algemeen beheer van de locatie, kan alle locatiegegevens inzien en aanpassen, kan PvB's aanvragen en kwalificaties inzien.",
  },
] as const;

async function RolesContent(props: RolesProps) {
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

  const [person, rolesForUser, rolesInLocation, location] = await Promise.all([
    retrievePersonPromise,
    retrieveLocationPromise.then((location) =>
      listRolesForLocation(location.id),
    ),
    retrievePersonPromise.then(async (person) => {
      const location = await retrieveLocationPromise;

      return listRolesForLocation(location.id, person.id);
    }),
    retrieveLocationPromise,
  ]);

  const isLocationAdmin = rolesForUser.includes("location_admin");
  if (!isLocationAdmin) return null;

  return (
    <>
      <div className="lg:col-start-3">
        <div>
          <Subheading>Rollen</Subheading>
          <Divider className="mt-2 mb-4" />
          <Text>
            Geef de rollen aan die deze persoon heeft binnen de locatie.{" "}
            <Strong>
              Als er geen rollen meer zijn aangevinkt, wordt de persoon uit de
              locatie verwijderd!
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
  );
}

export function Roles(props: RolesProps) {
  return (
    <Suspense fallback={null}>
      <RolesContent {...props} />
    </Suspense>
  );
}
