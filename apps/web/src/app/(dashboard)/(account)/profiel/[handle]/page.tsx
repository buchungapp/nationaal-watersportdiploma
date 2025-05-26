import { Text } from "~/app/(dashboard)/_components/text";

import { after } from "next/server";
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
    <div className="gap-2 grid grid-cols-1 lg:grid-cols-[2fr_1fr] mx-auto lg:mx-0 lg:max-w-none max-w-3xl">
      <div className="sm:mb-6 max-sm:px-2">
        <Welcome params={props.params} />
        <Text>
          Welkom bij jouw digitale watersportcentrum. Volg hier je voortgang
          binnen het Nationaal Watersportdiploma (NWD) en je andere
          watersportactiviteiten. Beheer je meerdere personen met dit
          e-mailadres? Selecteer dan een andere persoon via de menubalk.
        </Text>
      </div>
      <div className="gap-2 grid grid-cols-1 row-start-3 lg:row-start-2 h-fit">
        <ProgressSection params={props.params} />

        <News className="sm:hidden" />

        <WatersportCertificatesSection
          params={props.params}
          searchParams={props.searchParams}
        />

        <Logbook params={props.params} searchParams={props.searchParams} />

        <Socials className="sm:hidden" />
      </div>
      <div className="gap-2 grid grid-cols-1 row-start-2 h-fit">
        <Locations />
        <Personalia params={props.params} />
        <News className="max-sm:hidden" />
        <Socials className="max-sm:hidden" />
      </div>
    </div>
  );
}
