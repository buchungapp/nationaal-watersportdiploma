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

import { showNewWaterSportCertificates } from "~/lib/flags";
import NWDCertificatesSection from "./_components/nwd-certificates-section";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
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
}) {
  if (!(await showNewWaterSportCertificates())) {
    return await PageWithoutNewWaterSportCertificates(props);
  }

  const params = await props.params;
  const [user, person] = await Promise.all([
    getUserOrThrow(),
    getPersonByHandle(params.handle),
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
    <div className="mx-auto grid max-w-3xl grid-cols-1 grid-rows-1 items-start gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
      <div className="mt-4 lg:col-span-3">
        <Heading>Welkom {person.firstName}!</Heading>
        <Text>
          Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
          overige certificaten. Ook kan je hier je personalia wijzigen.
        </Text>
      </div>

      <div className="lg:col-start-3 lg:row-start-2 lg:row-span-3">
        <div className="flex items-center justify-between">
          <Subheading>Personalia</Subheading>
          <Suspense
            fallback={
              <div className="animate-pulse size-9 bg-slate-200 rounded-lg -my-1.5" />
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
      {/* <div className="lg:col-span-2">Logboek</div> */}
    </div>
  );
}
