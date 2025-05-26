import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-v2";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, listCountries } from "~/lib/nwd";
import { EditDetails } from "./action-buttons";

async function ActionButton({
  params,
}: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const [person, countries] = await Promise.all([
    getPersonByHandle(handle),
    listCountries(),
  ]);

  return <EditDetails person={person} countries={countries} />;
}

async function PersonaliaContent({
  params,
}: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const person = await getPersonByHandle(handle);

  return (
    <DescriptionList>
      <DescriptionTerm>NWD-ID</DescriptionTerm>
      <DescriptionDetails>{person.handle}</DescriptionDetails>

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
    </DescriptionList>
  );
}

export async function Personalia({
  params,
}: { params: Promise<{ handle: string }> }) {
  return (
    <StackedLayoutCard>
      <Subheading className="mb-3">Personalia</Subheading>
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
          </DescriptionList>
        }
      >
        <PersonaliaContent params={params} />
      </Suspense>

      <Divider className="my-4" />

      <div className="flex justify-end">
        <Suspense
          fallback={
            <span className="block bg-gray-200 rounded w-32 h-6 animate-pulse" />
          }
        >
          <ActionButton params={params} />
        </Suspense>
      </div>
    </StackedLayoutCard>
  );
}
