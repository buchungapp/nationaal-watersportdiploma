import { after } from "next/server";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { getPersonByHandle, getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { Locations } from "./_components/locations";
import { Logbook } from "./_components/logbook/logbook";
import { News } from "./_components/news";
import { Personalia } from "./_components/person/personalia";
import ProgressSection from "./_components/progress/progress";
import { Socials } from "./_components/socials";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
import { Welcome } from "./_components/welcome";

export default function Page(props: {
  params: Promise<{
    handle: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const personPromise = (async () => {
    const { handle } = await props.params;

    const person = await getPersonByHandle(handle);

    return person;
  })();

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
      <div className="mx-auto max-w-2xl lg:max-w-none lg:mx-0">
        <Welcome params={props.params} />
        <Text className="max-w-prose">
          In je digitale watersportcentrum.{" "}
          <TextLink href="/help/artikel/personenbeheer" target="_blank">
            Leer meer over personenbeheer
          </TextLink>
        </Text>
      </div>

      <div className="mt-2 mx-auto grid max-w-2xl grid-cols-1 grid-rows-1 items-start gap-2 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        <div className="order-2 lg:order-none lg:col-start-3 lg:row-end-1 flex flex-col gap-2">
          <Locations personPromise={personPromise} />

          <Personalia personPromise={personPromise} />
        </div>

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 order-3 lg:order-none flex flex-col gap-2">
          <ProgressSection personPromise={personPromise} />

          <WatersportCertificatesSection
            personPromise={personPromise}
            searchParams={props.searchParams}
          />

          <Logbook
            personPromise={personPromise}
            searchParams={props.searchParams}
          />
        </div>

        <div className="order-4 lg:order-none lg:col-start-3 flex flex-col gap-2">
          <News />

          <Socials />
        </div>
      </div>
    </div>
  );
}
