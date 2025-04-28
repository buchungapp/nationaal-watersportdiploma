import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, getUserOrThrow, listCountries } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { EditDetails } from "./_components/action-buttons";
import { PersonCohortProgress } from "./_components/cohort-progress";

import { showNewLogBook, showNewWaterSportCertificates } from "~/lib/flags";
import { Logbook } from "./_components/logbook/logbook";
import NWDCertificatesSection from "./_components/nwd-certificates-section";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
import { pageParamsCache } from "./_searchParams";
import PageWithoutNewWaterSportCertificates from "./old-page";

async function ActionButton({ handle }: { handle: string }) {
  const [person, countries] = await Promise.all([
    getPersonByHandle(handle),
    listCountries(),
  ]);

  return <EditDetails person={person} countries={countries} />;
}

export default async function Page(props: {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await showNewWaterSportCertificates())) {
    return await PageWithoutNewWaterSportCertificates(props);
  }

  // Kick-off the flag evaluation
  const showLogBook = showNewLogBook();

  const params = await props.params;
  const [user, person] = await Promise.all([
    getUserOrThrow(),
    getPersonByHandle(params.handle),
    pageParamsCache.parse(props.searchParams),
  ]);

  posthog.capture({
    distinctId: user.authUserId,
    event: "viewed_profile",
    properties: {
      $set: { email: user.email, displayName: user.displayName },
    },
  });

  await posthog.shutdown();

  return (
    <div className="items-start gap-x-8 gap-y-16 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 lg:max-w-none max-w-3xl">
      <div className="lg:col-span-3 mt-4">
        <Heading>Welkom {person.firstName}!</Heading>
        <Text>
          Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
          overige certificaten. Ook kan je hier je personalia wijzigen.
        </Text>
      </div>

      <div className="lg:col-start-3 lg:row-start-2">
        <div className="flex justify-between items-center">
          <Subheading>Personalia</Subheading>
          <Suspense
            fallback={
              <div className="bg-slate-200 -my-1.5 rounded-lg size-9 animate-pulse" />
            }
          >
            <ActionButton handle={params.handle} />
          </Suspense>
        </div>
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
        </DescriptionList>
      </div>

      <PersonCohortProgress
        person={{
          id: person.id,
          handle: person.handle,
        }}
      />

      <NWDCertificatesSection person={person} />
      <WatersportCertificatesSection person={person} />

      {(await showLogBook) ? <Logbook person={person} /> : null}
    </div>
  );
}
