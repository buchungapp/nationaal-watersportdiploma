import { Text } from "~/app/(dashboard)/_components/text";
import { PersonCohortProgress } from "./_components/cohort-progress";

import { after } from "next/server";
import { showNewWaterSportCertificates } from "~/lib/flags";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { Logbook } from "./_components/logbook/logbook";
import NWDCertificatesSection from "./_components/nwd-certificates-section";
import { Personalia } from "./_components/person/personalia";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
import { Welcome } from "./_components/welcome";
import PageWithoutNewWaterSportCertificates from "./old-page";

export default async function Page(props: {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (!(await showNewWaterSportCertificates())) {
    return await PageWithoutNewWaterSportCertificates(props);
  }

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
    <div className="items-start gap-x-8 gap-y-16 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 lg:max-w-none max-w-3xl">
      <div className="lg:col-span-3 mt-4">
        <Welcome params={props.params} />
        <Text>
          Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
          overige certificaten. Ook kan je hier je personalia wijzigen.
        </Text>
      </div>

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
