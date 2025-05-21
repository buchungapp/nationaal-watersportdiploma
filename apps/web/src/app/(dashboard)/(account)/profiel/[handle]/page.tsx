import { Text } from "~/app/(dashboard)/_components/text";
import { PersonCohortProgress } from "./_components/cohort-progress";

import { after } from "next/server";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { Logbook } from "./_components/logbook/logbook";
import NWDCertificatesSection from "./_components/nwd-certificates-section";
import { Personalia } from "./_components/person/personalia";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
import { Welcome } from "./_components/welcome";

export default async function Page(props: {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  after(async () => {
    const user = await getUserOrThrow();

    posthog.capture({
      distinctId: user.authUserId,
      event: "viewed_profile",
      properties: {
        $set: { email: user.email, displayName: user.displayName },
      },
    });

    await posthog.shutdown();
  });

  return (
    <div className="items-start gap-3 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 lg:max-w-none max-w-3xl">
      <StackedLayoutCard className="lg:col-span-3 mb-6 lg:mb-0">
        <Welcome params={props.params} />
        <Text>
          Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
          overige certificaten. Ook kan je hier je personalia wijzigen.
        </Text>
      </StackedLayoutCard>

      <Personalia params={props.params} />

      <PersonCohortProgress params={props.params} />

      <NWDCertificatesSection params={props.params} />
      <WatersportCertificatesSection
        params={props.params}
        searchParams={props.searchParams}
      />

      <Logbook params={props.params} searchParams={props.searchParams} />
    </div>
  );
}
