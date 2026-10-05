import { notFound, redirect } from "next/navigation";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  resolveActingContextForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { ProfileChooser } from "./_components/profile-chooser";

// Only accept a relative path that stays inside this location's dashboard
// tree. Rejects protocol-relative (`//host`), absolute URLs (schemes), and
// anything not under `/locatie/`. Callers fall back to the location root.
function validateNext(
  next: string | string[] | undefined,
  handle: string,
): string {
  const fallback = `/locatie/${handle}`;

  if (typeof next !== "string") {
    return fallback;
  }

  if (
    !next.startsWith("/locatie/") ||
    next.startsWith("//") ||
    next.includes("://")
  ) {
    return fallback;
  }

  return next;
}

export default async function Page(props: {
  params: Promise<{ location: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, searchParams] = await Promise.all([
    props.params,
    props.searchParams,
  ]);

  const location = await retrieveLocationByHandle(params.location);
  const safeNext = validateNext(searchParams.next, params.location);

  const context = await resolveActingContextForLocation(location.id);

  if (context.status === "ok") {
    redirect(safeNext);
  }

  if (context.status === "unauthorized") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Heading>Namens welk profiel wil je handelen?</Heading>
      <Text className="mt-2">
        Je account heeft meerdere profielen met een actieve rol op deze locatie.
        Kies namens welk profiel je wilt werken. Je kunt later altijd wisselen.
      </Text>

      <ProfileChooser
        locationId={location.id}
        next={safeNext}
        eligiblePersons={context.eligiblePersons.map((entry) => ({
          personId: entry.person.id,
          firstName: entry.person.firstName,
          lastNamePrefix: entry.person.lastNamePrefix,
          lastName: entry.person.lastName,
          roles: entry.roles,
        }))}
      />
    </div>
  );
}
