import { ArrowRightIcon } from "@heroicons/react/16/solid";
import { Suspense } from "react";
import { TextButton } from "~/app/(dashboard)/_components/button";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import { StackedLayoutCard } from "~/app/(dashboard)/_components/stacked-layout";
import { listCohortForPerson } from "~/lib/nwd";

async function LocationsContent() {
  const locations = await listCohortForPerson({
    respectCohortVisibility: ["open", "upcoming"],
  });

  if (locations.length === 0) {
    return null;
  }

  return (
    <StackedLayoutCard>
      <Subheading className="mb-3">Locaties</Subheading>
      {locations.map(({ location, cohorts }) => (
        <div key={location.id} className="flex flex-col gap-2">
          <TextButton
            color="dark/zinc"
            href={`/locatie/${location.handle}/cohorten`}
            center={false}
            className="justify-between"
          >
            {location.name}
            <div className="mr-2">
              <ArrowRightIcon className="size-4" />
            </div>
          </TextButton>
          {cohorts.length > 0 ? (
            <div className="flex flex-col flex-1 border border-zinc-200 border-dashed">
              {cohorts.slice(0, 4).map((cohort) => (
                <Link
                  key={cohort.id}
                  href={`/locatie/${location.handle}/cohorten/${cohort.id}`}
                  className="flex justify-between items-center gap-2 data-active:bg-zinc-50 data-hover:bg-zinc-50 px-2 py-1 text-zinc-500 dark:text-zinc-400 lg:text-sm text-base"
                >
                  {cohort.label}
                  <ArrowRightIcon className="size-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </StackedLayoutCard>
  );
}

export async function Locations() {
  return (
    <Suspense
      fallback={
        <div className="bg-gray-200 rounded-md w-full h-40 animate-pulse" />
      }
    >
      <LocationsContent />
    </Suspense>
  );
}
