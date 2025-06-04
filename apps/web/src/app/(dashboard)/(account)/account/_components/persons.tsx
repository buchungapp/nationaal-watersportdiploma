import { clsx } from "clsx";
import Link from "next/link";
import { Suspense } from "react";
import Balancer from "react-wrap-balancer";
import { Avatar } from "~/app/(dashboard)/_components/avatar";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import {
  GridList,
  GridListItem,
  GridListItemDisclosure,
  GridListItemHeader,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { AnimatedWave } from "~/app/_components/animated-wave";
import { listCountries, listPersonsForUser } from "~/lib/nwd";
import { PersonaliaContent } from "../../profiel/[handle]/_components/person/personalia";
import { AddPersonButton } from "./add-person-button";
import { PersonActions } from "./persons-client";

async function PersonsList() {
  const persons = await listPersonsForUser();

  return persons.length > 0 ? (
    <GridList>
      {persons
        .sort((a) => (a.isPrimary ? -1 : 1))
        .map((person, itemIndex) => (
          <GridListItem key={person.id} className="!border-sky-200">
            <header
              className={clsx(
                "flex justify-between relative items-center sm:items-start -mt-3",
                "p-2 sm:p-4 pb-8 sm:pb-12",
                "bg-sky-50/50",
              )}
            >
              <Link
                href={`/profiel/${person.handle}`}
                className="flex items-center gap-3.5"
              >
                <Avatar
                  square
                  initials={person.firstName.slice(0, 2)}
                  className="bg-sky-800 size-6 text-white"
                />
                <div className="font-semibold text-sky-950 text-lg/normal">
                  {[person.firstName, person.lastNamePrefix, person.lastName]
                    .filter(Boolean)
                    .join(" ")}
                </div>
              </Link>
              <div className="shrink-0">
                <PersonActions person={person} />
              </div>
              <AnimatedWave
                offset={itemIndex * -30}
                spacing={3 * itemIndex}
                textColorClassName="text-branding-light"
              />
            </header>

            <div className="px-2 sm:px-4">
              <GridListItemDisclosure
                header="Persoonlijke informatie"
                defaultOpen={true}
              >
                <PersonaliaContent personPromise={Promise.resolve(person)} />
              </GridListItemDisclosure>
            </div>
          </GridListItem>
        ))}
    </GridList>
  ) : (
    <div className="relative border-dashed border-2 rounded-md overflow-hidden pb-2 bg-zinc-50/50 border-zinc-200">
      <div className="flex flex-col items-center text-center px-2 sm:px-4 pt-6 pb-10 max-w-lg mx-auto">
        <div className="space-y-2">
          <div>
            <Heading>
              <Balancer>
                Er zijn nog geen profielen aan jouw account gekoppeld.
              </Balancer>
            </Heading>
          </div>
        </div>

        <div className="my-6">
          <AddPersonButton countriesPromise={listCountries()} />
        </div>

        <Text>
          Voeg een profiel toe om alle functies van het Nationaal
          Watersportdiploma platform te kunnen gebruiken. <br />
          <TextLink href="/help/artikel/personenbeheer" target="_blank">
            Lees hier meer over personenbeheer.
          </TextLink>
        </Text>
      </div>
      <AnimatedWave textColorClassName="text-zinc-600" />
    </div>
  );
}

function PersonsListFallback() {
  return (
    <GridList>
      <GridListItem className="bg-white">
        <GridListItemHeader>
          <Avatar
            square
            initials={"..."}
            className="bg-zinc-900 size-6 text-white"
          />
          <div className="bg-gray-200 rounded w-32 h-6 animate-pulse" />
        </GridListItemHeader>
        <DescriptionList>
          <DescriptionTerm>NWD-id</DescriptionTerm>
          <DescriptionDetails>
            <div className="bg-gray-200 rounded w-24 h-5 animate-pulse [animation-delay:300ms]" />
          </DescriptionDetails>

          <DescriptionTerm>Geboortedatum</DescriptionTerm>
          <DescriptionDetails>
            <div className="bg-gray-200 rounded w-20 h-5 animate-pulse [animation-delay:600ms]" />
          </DescriptionDetails>
        </DescriptionList>
      </GridListItem>
    </GridList>
  );
}

export function Persons() {
  // Start the promise early but don't await it
  const countriesPromise = listCountries();

  return (
    <div>
      <StackedLayoutCard className="mb-3">
        <div className="flex justify-between items-start gap-x-2.5">
          <div className="flex flex-col">
            <Subheading>Gekoppelde profielen</Subheading>
            <Text>
              De volgende personen zijn aan jouw account gekoppeld. Klik op een
              naam om de profielpagina te bekijken.
            </Text>
          </div>
          <AddPersonButton countriesPromise={countriesPromise} />
        </div>
        <div className="mt-4">
          <Suspense fallback={<PersonsListFallback />}>
            <PersonsList />
          </Suspense>
        </div>

        <div className="bg-yellow-50 p-4 rounded-md mt-4">
          <p className="text-sm text-yellow-700">
            Zie je niet alle personen die je verwacht, of juist teveel?{" "}
            <Link
              href="/help/artikel/personenbeheer"
              target="_blank"
              className="font-medium text-yellow-700 underline hover:text-yellow-600"
            >
              Lees hier waarom en hoe je dit kunt oplossen
            </Link>
            .
          </p>
        </div>
      </StackedLayoutCard>
    </div>
  );
}
