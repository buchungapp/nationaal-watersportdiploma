import { UserIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  type EligiblePerson,
  listLocationsForPerson,
  resolveActingContextForLocation,
} from "~/lib/nwd";
import { Avatar } from "../../../../../_components/avatar";
import { SidebarItem, SidebarLabel } from "../../../../../_components/sidebar";
import { ActingProfileSwitcherDropdown } from "./acting-profile-switcher-client";

const ROLE_LABELS = {
  location_admin: "Beheerder",
  instructor: "Instructeur",
} as const;

function fullName(person: EligiblePerson["person"]): string {
  return [person.firstName, person.lastNamePrefix, person.lastName]
    .filter((part) => part != null && part !== "")
    .join(" ");
}

function initialsFor(person: EligiblePerson["person"]): string {
  return `${person.firstName?.[0] ?? ""}${
    person.lastName?.[0] ?? person.firstName?.[1] ?? ""
  }`.toUpperCase();
}

function roleLabelsFor(entry: EligiblePerson): string[] {
  return entry.roles.map((role) => ROLE_LABELS[role]);
}

async function ActingProfileSwitcherContent(props: {
  params: Promise<{ location: string }>;
}) {
  const [params, locations] = await Promise.all([
    props.params,
    listLocationsForPerson(),
  ]);

  const currentLocation = locations.find(
    (location) => location.handle === params.location,
  );

  if (!currentLocation) {
    return notFound();
  }

  const context = await resolveActingContextForLocation(currentLocation.id);

  if (context.status === "unauthorized") {
    return null;
  }

  if (context.status === "choose") {
    return (
      <SidebarItem
        href={`/locatie/${params.location}/kies-profiel`}
        className="lg:mb-2.5"
      >
        <UserIcon />
        <SidebarLabel>Kies profiel</SidebarLabel>
      </SidebarItem>
    );
  }

  const acting = context.person;
  const actingName = fullName(acting.person);
  const actingRoleLabels = roleLabelsFor(acting);

  const others = context.eligiblePersons.filter(
    (entry) => entry.person.id !== acting.person.id,
  );

  // Single eligible profile: static, non-interactive indicator.
  if (others.length === 0) {
    return (
      <div className="mb-2.5 flex items-center gap-3 rounded-lg px-2 py-2.5 sm:py-2">
        <Avatar
          className="size-6 shrink-0"
          initials={initialsFor(acting.person)}
        />
        <div className="min-w-0">
          <span className="block text-xs/4 text-zinc-500 dark:text-zinc-400">
            Handelt als
          </span>
          <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
            {actingName}
          </span>
          {actingRoleLabels.length > 0 ? (
            <span className="block truncate text-xs/4 text-zinc-500 dark:text-zinc-400">
              {actingRoleLabels.join(", ")}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <ActingProfileSwitcherDropdown
      locationId={currentLocation.id}
      actingName={actingName}
      actingRoleLabels={actingRoleLabels}
      actingInitials={initialsFor(acting.person)}
      options={others.map((entry) => ({
        personId: entry.person.id,
        fullName: fullName(entry.person),
        initials: initialsFor(entry.person),
        roleLabels: roleLabelsFor(entry),
      }))}
    />
  );
}

function ActingProfileSwitcherFallback() {
  return (
    <div className="mb-2.5 flex items-center gap-3 rounded-lg px-2 py-2.5 sm:py-2">
      <Avatar className="size-6 shrink-0" initials={"..."} />
      <SidebarLabel className="w-full">
        <span className="inline-block h-4.5 w-full animate-pulse rounded bg-gray-300 align-middle" />
      </SidebarLabel>
    </div>
  );
}

export function ActingProfileSwitcher(props: {
  params: Promise<{ location: string }>;
}) {
  return (
    <Suspense fallback={<ActingProfileSwitcherFallback />}>
      <ActingProfileSwitcherContent params={props.params} />
    </Suspense>
  );
}
