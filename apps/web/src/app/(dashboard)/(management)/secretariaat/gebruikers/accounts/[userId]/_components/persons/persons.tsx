import { Suspense } from "react";
import { AddPersonButton } from "~/app/(dashboard)/(account)/account/_components/add-person-button";
import { PersonsList } from "~/app/(dashboard)/(account)/account/_components/persons";
import { PersonsListFallback } from "~/app/(dashboard)/(account)/account/_components/persons";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { gridContainer } from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import { type getUserById, listCountries } from "~/lib/nwd";
import { PersonActions } from "./person-actions";

export async function PersonsContent({
  userPromise,
}: { userPromise: ReturnType<typeof getUserById> }) {
  const user = await userPromise;

  return (
    <PersonsList
      userId={user.authUserId}
      link={(person) => `/secretariaat/gebruikers/${person.id}`}
      actions={(person) => (
        <div className="flex items-center gap-2">
          {person.isPrimary ? <Badge color="green">Hoofdprofiel</Badge> : null}
          <PersonActions userId={user.authUserId} person={person} />
        </div>
      )}
    />
  );
}

export async function Persons({
  userPromise,
}: {
  userPromise: ReturnType<typeof getUserById>;
}) {
  const countriesPromise = listCountries();

  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      className={gridContainer}
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <Subheading>Gekoppelde profielen</Subheading>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            De volgende personen zijn aan dit account gekoppeld. Klik op een
            naam om de persoon te bekijken.
          </Text>
        </>
      }
    >
      <div className="my-4">
        <AddPersonButton
          countriesPromise={countriesPromise}
          userPromise={userPromise}
        />
      </div>

      <Suspense fallback={<PersonsListFallback />}>
        <PersonsContent userPromise={userPromise} />
      </Suspense>
    </StackedLayoutCardDisclosure>
  );
}
