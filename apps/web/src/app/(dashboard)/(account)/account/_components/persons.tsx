import { Suspense } from "react";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "~/app/(dashboard)/_components/grid-list";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Code, Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { listPersonsForUser } from "~/lib/nwd";

async function PersonsList() {
  const persons = await listPersonsForUser();

  return persons.length > 0 ? (
    <GridList>
      {persons.map((person) => (
        <GridListItem key={person.id}>
          <GridListHeader href={`/profiel/${person.handle}`}>
            <Avatar
              square
              initials={person.firstName.slice(0, 2)}
              className="bg-zinc-900 size-8 text-white"
            />
            <div className="font-medium text-slate-900 text-sm leading-6">
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
        Er zijn nog geen personen aan jouw account gekoppeld. Neem contact op
        met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar de cursus is gevolgd.
      </Text>
    </>
  );
}

function PersonsListFallback() {
  return (
    <GridList>
      <GridListItem>
        <GridListHeader href="#">
          <Avatar
            square
            initials={"..."}
            className="bg-zinc-900 size-8 text-white"
          />
          <div className="bg-zinc-300 rounded w-32 h-6 animate-pulse" />
        </GridListHeader>
        <DescriptionList className="px-6">
          <DescriptionTerm>NWD-id</DescriptionTerm>
          <DescriptionDetails>
            <div className="bg-gray-200 rounded w-24 h-5 animate-pulse [animation-delay:150ms]" />
          </DescriptionDetails>

          <DescriptionTerm>Geboortedatum</DescriptionTerm>
          <DescriptionDetails>
            <div className="bg-gray-200 rounded w-20 h-5 animate-pulse [animation-delay:300ms]" />
          </DescriptionDetails>
        </DescriptionList>
      </GridListItem>
    </GridList>
  );
}

export function Persons() {
  return (
    <div className="my-6">
      <Subheading>Personen die jij beheert</Subheading>
      <Divider className="mt-2 mb-4" />
      <Suspense fallback={<PersonsListFallback />}>
        <PersonsList />
      </Suspense>
    </div>
  );
}
