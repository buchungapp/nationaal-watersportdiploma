import { Suspense } from "react";
import {
  getPersonByHandle,
  isSecretariaat,
  listActiveActorTypesForPerson,
} from "~/lib/nwd";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import {
  DashboardToggle,
  type DashboardView,
  type RedirectView,
} from "./dashboard-toggle";

async function DecideDashboardToggle({
  personHandlePromise,
}: {
  personHandlePromise: Promise<string>;
}) {
  const personHandle = await personHandlePromise;
  const person = await getPersonByHandle(personHandle);
  const rolesForPerson = await listActiveActorTypesForPerson(person.id);

  const isUserSecretariaat =
    person.userId &&
    ((await isSecretariaat(person.userId)) || isSystemAdmin(person.email));

  const hasInstructorView =
    (["instructor", "pvb_beoordelaar", "location_admin"] as const).some(
      (role) => rolesForPerson.includes(role),
    ) && person.isPrimary;

  if (hasInstructorView || isUserSecretariaat) {
    const views: (DashboardView | RedirectView)[] = ["student"];
    if (hasInstructorView) {
      views.unshift("instructor");
    }
    if (isUserSecretariaat) {
      views.push("secretariaat");
    }

    return <DashboardToggle views={views} />;
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
