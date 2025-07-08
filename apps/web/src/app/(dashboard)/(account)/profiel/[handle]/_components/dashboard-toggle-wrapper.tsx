import { Suspense } from "react";
import { getPersonByHandle, listActiveActorTypesForPerson } from "~/lib/nwd";
import { DashboardToggle } from "./dashboard-toggle";

async function DecideDashboardToggle({
  personHandlePromise,
}: {
  personHandlePromise: Promise<string>;
}) {
  const personHandle = await personHandlePromise;
  const person = await getPersonByHandle(personHandle);
  const rolesForPerson = await listActiveActorTypesForPerson(person.id);

  const hasInstructorView =
    (["instructor", "pvb_beoordelaar", "location_admin"] as const).some(
      (role) => rolesForPerson.includes(role),
    ) && person.isPrimary;

  if (hasInstructorView) {
    return <DashboardToggle />;
  }

  return null;
}

export function DashboardToggleWrapper({
  personHandlePromise,
}: {
  personHandlePromise: Promise<string>;
}) {
  return (
    <Suspense fallback={null}>
      <DecideDashboardToggle personHandlePromise={personHandlePromise} />
    </Suspense>
  );
}
