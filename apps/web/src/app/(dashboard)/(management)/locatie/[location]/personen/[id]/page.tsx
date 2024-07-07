import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import dayjs from "dayjs";
import { notFound } from "next/navigation";
import {
  CheckboxField,
  CheckboxGroup,
} from "~/app/(dashboard)/_components/checkbox";

import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Description, Label } from "~/app/(dashboard)/_components/fieldset";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { Strong, Text } from "~/app/(dashboard)/_components/text";
import {
  getPersonById,
  listRolesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ChangeEmail } from "./_components/action-buttons";
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
  const retrievePersonPromise = retrieveLocationPromise.then((location) =>
    getPersonById(params.id, location.id),
  );

  const [person, rolesInLocation, location] = await Promise.all([
    retrievePersonPromise,
    retrievePersonPromise.then(async (person) => {
      const location = await retrieveLocationPromise;

      return listRolesForLocation(location.id, person.id);
    }),
    retrieveLocationPromise,
  ]);

  if (!person) {
    notFound();
  }

  return (
    <>
      <div className="max-lg:hidden">
        <Link
          href={`/locatie/${params.location}/personen`}
          className="inline-flex items-center gap-2 text-sm/6 text-zinc-500 dark:text-zinc-400"
        >
          <ChevronLeftIcon className="size-4 fill-zinc-400 dark:fill-zinc-500" />
          Personen
        </Link>
      </div>

      <div className="mt-4 lg:mt-8 flex flex-wrap justify-between gap-x-6">
        <div className="flex items-center gap-4">
          <Heading>
            {[person.firstName, person.lastNamePrefix, person.lastName]
              .filter(Boolean)
              .join(" ")}
          </Heading>
        </div>
        <div>
          <ChangeEmail personId={person.id} locationId={location.id} />
        </div>
      </div>

      <div className="mt-12">
        <Subheading>Samenvatting</Subheading>
        <Divider className="mt-4" />
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

          <DescriptionTerm>E-mail</DescriptionTerm>
          <DescriptionDetails>{person.email ?? "-"}</DescriptionDetails>
        </DescriptionList>
      </div>

      <div className="mt-12">
        <Subheading>Rollen</Subheading>
        <Divider className="my-4" />
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
    </>
  );
}
