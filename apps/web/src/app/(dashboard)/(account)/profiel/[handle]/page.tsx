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
      <div className="order-3 lg:order-none lg:col-start-3 lg:row-end-1 flex flex-col gap-2">
        <Personalia personPromise={personPromise} />
      </div>

      <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 order-2 lg:order-none flex flex-col gap-2">
        <Locations personPromise={personPromise} />

        <PvbOverviewSection personPromise={personPromise} />
      </div>

      <div className="order-4 lg:order-none lg:col-start-3 flex flex-col gap-2">
        <News categories={["consument", "achterban", "vereniging"]} />

        <Socials />
      </div>
    </>
  );
}

function StudentDashboard({ personPromise, searchParams }: DashboardProps) {
  return (
    <>
      <div className="order-2 lg:order-none lg:col-start-3 lg:row-end-1 flex flex-col gap-2">
        <Personalia personPromise={personPromise} />
      </div>

      <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 order-3 lg:order-none flex flex-col gap-2">
        <ProgressSection personPromise={personPromise} />

        <WatersportCertificatesSection
          personPromise={personPromise}
          searchParams={searchParams}
        />

        <Logbook personPromise={personPromise} searchParams={searchParams} />
      </div>

      <div className="order-4 lg:order-none lg:col-start-3 flex flex-col gap-2">
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

  const hasInstructorView = (
    ["instructor", "pvb_beoordelaar", "location_admin"] as const
  ).some((role) => rolesForPerson.includes(role));

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
      <div className="col-span-full order-1 mb-2 animate-pulse">
        <div className="h-11 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Right column - top (Personalia) */}
      <div className="order-3 lg:order-none lg:col-start-3 lg:row-end-1 animate-pulse">
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Left columns - main content area */}
      <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2 order-2 lg:order-none flex flex-col gap-2 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </div>

      {/* Right column - bottom (News + Socials) */}
      <div className="order-4 lg:order-none lg:col-start-3 flex flex-col gap-2 animate-pulse">
        <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
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
