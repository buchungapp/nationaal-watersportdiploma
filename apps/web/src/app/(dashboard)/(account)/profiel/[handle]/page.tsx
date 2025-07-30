import type { User } from "@nawadi/core";
import { after } from "next/server";
import { Suspense } from "react";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  getPersonByHandle,
  getUserOrThrow,
  listActiveActorTypesForPerson,
} from "~/lib/nwd";
import posthog from "~/lib/posthog";
import type { DashboardView } from "./_components/dashboard-toggle";
import { Locations } from "./_components/locations";
import { Logbook } from "./_components/logbook/logbook";
import { News } from "./_components/news";
import { Personalia } from "./_components/person/personalia";
import ProgressSection from "./_components/progress/progress";
import PvbOverviewSection from "./_components/pvb/pvb-overview";
import { Socials } from "./_components/socials";
import WatersportCertificatesSection from "./_components/watersport-certificates-section";
import { Welcome } from "./_components/welcome";

type DashboardProps = {
  personPromise: Promise<User.Person.$schema.Person>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function InstructorDashboard({ personPromise, searchParams }: DashboardProps) {
  return (
    <>
      <div className="flex flex-col gap-2 order-3 lg:order-none lg:col-start-3 lg:row-end-1">
        <Personalia personPromise={personPromise} />
      </div>

      <div className="flex flex-col gap-2 order-2 lg:order-none lg:col-span-2 lg:row-span-2 lg:row-end-2">
        <Locations personPromise={personPromise} />

        <PvbOverviewSection personPromise={personPromise} />
      </div>

      <div className="flex flex-col gap-2 order-4 lg:order-none lg:col-start-3">
        <News categories={["consument", "achterban", "vereniging"]} />

        <Socials />
      </div>
    </>
  );
}

function StudentDashboard({ personPromise, searchParams }: DashboardProps) {
  return (
    <>
      <div className="flex flex-col gap-2 order-2 lg:order-none lg:col-start-3 lg:row-end-1">
        <Personalia personPromise={personPromise} />
      </div>

      <div className="flex flex-col gap-2 order-3 lg:order-none lg:col-span-2 lg:row-span-2 lg:row-end-2">
        <ProgressSection
          personPromise={personPromise}
          description="Bekijk je diploma's, hoe je ervoor staat met je opleidingen, en hoe
            het gaat met je huidige cursus."
        />

        <WatersportCertificatesSection
          personPromise={personPromise}
          searchParams={searchParams}
        />

        <Logbook personPromise={personPromise} searchParams={searchParams} />
      </div>

      <div className="flex flex-col gap-2 order-4 lg:order-none lg:col-start-3">
        <News categories={["consument"]} />

        <Socials />
      </div>
    </>
  );
}

async function DecideDashboard({
  personPromise,
  searchParams,
}: DashboardProps) {
  const [person, params] = await Promise.all([personPromise, searchParams]);
  const rolesForPerson = await listActiveActorTypesForPerson(person.id);

  const hasInstructorView =
    (["instructor", "pvb_beoordelaar", "location_admin"] as const).some(
      (role) => rolesForPerson.includes(role),
    ) && person.isPrimary;

  // Parse the view from search params
  const view = (params.view as DashboardView) || "instructor";

  // If user doesn't have instructor view, always show student dashboard
  if (!hasInstructorView || view === "student") {
    return (
      <StudentDashboard
        personPromise={personPromise}
        searchParams={searchParams}
      />
    );
  }

  // Default to instructor dashboard
  return (
    <InstructorDashboard
      personPromise={personPromise}
      searchParams={searchParams}
    />
  );
}

// Loading component for the Suspense boundary
function DashboardSkeleton() {
  return (
    <>
      {/* Toggle skeleton */}
      <div className="order-1 col-span-full mb-2 animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-11" />
      </div>

      {/* Right column - top (Personalia) */}
      <div className="order-3 lg:order-none lg:col-start-3 lg:row-end-1 animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />
      </div>

      {/* Left columns - main content area */}
      <div className="flex flex-col gap-2 order-2 lg:order-none lg:col-span-2 lg:row-span-2 lg:row-end-2 animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-48" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64" />
      </div>

      {/* Right column - bottom (News + Socials) */}
      <div className="flex flex-col gap-2 order-4 lg:order-none lg:col-start-3 animate-pulse">
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-40" />
        <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-32" />
      </div>
    </>
  );
}

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
      <div className="mx-auto lg:mx-0 lg:max-w-none max-w-2xl">
        <Welcome params={props.params} />
        <Text className="max-w-prose">
          In je digitale watersportcentrum.{" "}
          <TextLink href="/help/artikel/personenbeheer" target="_blank">
            Leer meer over personenbeheer
          </TextLink>
        </Text>
      </div>

      <div className="items-start gap-2 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-2 lg:max-w-none max-w-2xl">
        <Suspense fallback={<DashboardSkeleton />}>
          <DecideDashboard
            personPromise={personPromise}
            searchParams={props.searchParams}
          />
        </Suspense>
      </div>
    </div>
  );
}
