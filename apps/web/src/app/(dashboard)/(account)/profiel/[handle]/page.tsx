import { Text } from "~/app/(dashboard)/_components/text";

import { after } from "next/server";
import Balancer from "react-wrap-balancer";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { Locations } from "./_components/locations";
import { Logbook } from "./_components/logbook/logbook";
import { News } from "./_components/news";
import { Personalia } from "./_components/person/personalia";
import ProgressSection from "./_components/progress/progress";
import { Socials } from "./_components/socials";
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
    <div>
      <div className="sm:mb-6 max-sm:px-3 order-1 lg:order-none lg:col-start-1 lg:row-start-1">
        <Welcome params={props.params} />
        <Text>
          <Balancer>
            Welkom bij jouw digitale watersportcentrum. Volg hier je voortgang
            binnen het Nationaal Watersportdiploma (NWD) en je andere
            watersportactiviteiten. Beheer je meerdere personen met dit
            e-mailadres? Selecteer dan een andere persoon via de menubalk.
          </Balancer>
        </Text>
      </div>

      <div className="mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="lg:col-start-3 lg:row-end-1 flex flex-col gap-2">
          <Personalia params={props.params} />
        </div>

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 flex flex-col gap-2">
          <Locations />

          <ProgressSection params={props.params} />

          <WatersportCertificatesSection
            params={props.params}
            searchParams={props.searchParams}
          />

          <Logbook params={props.params} searchParams={props.searchParams} />
        </div>

        <div className="flex flex-col gap-2">
          <News />

          <Socials />
        </div>
      </div>
    </div>
  );
}
