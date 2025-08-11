import type { User } from "@nawadi/core";
import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { ActionButtons } from "./action-button";

export async function PersonaliaContent({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  const person = await personPromise;

  return (
    <DescriptionList>
      <DescriptionTerm>NWD-ID</DescriptionTerm>
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
        {person.dateOfBirth ? (
          <>
            {dayjs(person.dateOfBirth).format("DD-MM-YYYY")}{" "}
            <span className="font-normal text-zinc-500">
              ({dayjs().diff(dayjs(person.dateOfBirth), "years")} jaar)
            </span>
          </>
        ) : (
          "-"
        )}
      </DescriptionDetails>

      <DescriptionTerm>Geboorteplaats</DescriptionTerm>
      <DescriptionDetails>{person.birthCity ?? "-"}</DescriptionDetails>

      <DescriptionTerm>Geboorteland</DescriptionTerm>
      <DescriptionDetails>
        {person.birthCountry?.name ?? "-"}
      </DescriptionDetails>

      <DescriptionTerm>E-mailadres</DescriptionTerm>
      <DescriptionDetails>{person.email ?? "-"}</DescriptionDetails>
    </DescriptionList>
  );
}

export async function Personalia({
  personPromise,
}: { personPromise: Promise<User.Person.$schema.Person> }) {
  return (
    <StackedLayoutCard>
      <div className="flex justify-between items-center mb-3">
        <Subheading>Personalia</Subheading>
      </div>
      <Suspense
        fallback={
          <DescriptionList>
            <DescriptionTerm>NWD-ID</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Voornaam</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Tussenvoegsel</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Achternaam</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Geboortedatum</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Geboorteplaats</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>Geboorteland</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>

            <DescriptionTerm>E-mailadres</DescriptionTerm>
            <DescriptionDetails>
              <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
            </DescriptionDetails>
          </DescriptionList>
        }
      >
        <PersonaliaContent personPromise={personPromise} />
      </Suspense>
      <Divider className="my-4" />
      <div className="flex justify-end">
        <ActionButtons personPromise={personPromise} />
      </div>
    </StackedLayoutCard>
  );
}
