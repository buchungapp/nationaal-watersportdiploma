import { Suspense } from "react";
import dayjs from "~/lib/dayjs";
import {
  getUserOrThrow,
  listLocationsWherePrimaryPersonHasManagementRole,
  listPersonsForUser,
} from "~/lib/nwd";
import { Avatar } from "../../_components/avatar";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "../../_components/description-list";
import { Divider } from "../../_components/divider";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "../../_components/grid-list";
import { Heading, Subheading } from "../../_components/heading";
import { Code, Text, TextLink } from "../../_components/text";

async function Persons() {
  const persons = await listPersonsForUser();

  return (
    <div className="my-6">
      <Subheading>Personen die jij beheert</Subheading>
      <Divider className="mt-2 mb-4" />
      {persons.length > 0 ? (
        <GridList>
          {persons.map((person) => (
            <GridListItem key={person.id}>
              <GridListHeader href={`/profiel/${person.handle}`}>
                <Avatar
                  square
                  initials={person.firstName.slice(0, 2)}
                  className="size-8 bg-zinc-900 text-white"
                />
                <div className="text-sm font-medium leading-6 text-slate-900">
                  {[person.firstName, person.lastNamePrefix, person.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </div>
              </GridListHeader>
              <DescriptionList className="px-6">
                <DescriptionTerm>NWD-id</DescriptionTerm>
                <DescriptionDetails>
                  <Code>{person.handle}</Code>
                </DescriptionDetails>

                <DescriptionTerm>Geboortedatum</DescriptionTerm>
                <DescriptionDetails>
                  {person.dateOfBirth
                    ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
                    : null}
                </DescriptionDetails>
              </DescriptionList>
            </GridListItem>
          ))}
        </GridList>
      ) : (
        <>
          <Text className="italic">
            Er zijn nog geen personen aan jouw account gekoppeld. Neem contact
            op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar de cursus is gevolgd.
          </Text>
        </>
      )}
    </div>
  );
}

async function InstructionLocations() {
  const locations =
    await listLocationsWherePrimaryPersonHasManagementRole().catch(() => []);

  if (locations.length < 1) return null;

  return (
    <div className="mt-10">
      <Subheading>Vaarlocaties waar jij lesgeeft</Subheading>
      <Divider className="mt-2 mb-4" />
      <GridList>
        {locations.map((location) => (
          <GridListItem key={location.id}>
            <GridListHeader href={`/locatie/${location.handle}/cohorten`}>
              <Avatar
                square
                initials={location.name?.slice(0, 2)}
                className="size-8 bg-zinc-900 text-white"
              />
              <div className="text-sm font-medium leading-6 text-slate-900">
                {location.name}
              </div>
            </GridListHeader>
          </GridListItem>
        ))}
      </GridList>
    </div>
  );
}

export default async function Page() {
  const user = await getUserOrThrow();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Heading>Welkom{user.displayName ? ` ${user.displayName}` : ""}!</Heading>

      <Text>
        Welkom in jouw NWD-omgeving. Op deze pagina vind je de cursisten die aan
        jouw account zijn gekoppeld. Zie je hier niet de cursisten die je
        verwacht? Neem dan contact op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar de cursus is gevolgd.
      </Text>
      <Persons />

      <Suspense fallback={null}>
        <InstructionLocations />
      </Suspense>
    </div>
  );
}
