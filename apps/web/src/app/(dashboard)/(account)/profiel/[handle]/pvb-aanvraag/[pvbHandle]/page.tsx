import { notFound } from "next/navigation";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import {
  getPersonByHandle,
  getUserOrThrow,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import { AanvraagCard } from "./_components/aanvraag-card";
import { BeoordelaarView } from "./_components/beoordelaar-view";
import { LeercoachView } from "./_components/leercoach-view";
import PvbTimeline from "./_components/pvb-timeline";
import { ToetsdocumentenCard } from "./_components/toetsdocumenten-card";

// Determine the user's role in relation to the PvB aanvraag
async function getUserRole(
  userPersonId: string,
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>
) {
  if (aanvraag.kandidaat.id === userPersonId) {
    return "kandidaat";
  }
  if (aanvraag.leercoach?.id === userPersonId) {
    return "leercoach";
  }
  if (
    aanvraag.onderdelen.some(
      (onderdeel) => onderdeel.beoordelaar?.id === userPersonId
    )
  ) {
    return "beoordelaar";
  }
  return null;
}

export default async function Page(props: {
  params: Promise<{
    handle: string; // person handle
    pvbHandle: string; // pvb aanvraag handle
  }>;
}) {
  const params = await props.params;
  
  // Get current user and person from handle
  const [user, person] = await Promise.all([
    getUserOrThrow(),
    getPersonByHandle(params.handle),
  ]);

  // Check if the user is viewing their own profile
  if (user.personId !== person.id) {
    notFound();
  }

  // Get the PVB aanvraag
  const aanvraag = await retrievePvbAanvraagByHandle(params.pvbHandle);

  // Determine user's role
  const role = await getUserRole(user.personId, aanvraag);

  if (!role) {
    notFound();
  }

  return (
    <>
      <div className="max-lg:hidden">
        <RouterPreviousButton>Terug naar profiel</RouterPreviousButton>
      </div>

      <div className="items-start gap-x-8 gap-y-8 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 mt-8 lg:max-w-none max-w-2xl">
        <div className="lg:col-start-3 lg:row-end-1">
          <div className="flex justify-between items-center">
            <Subheading>PvB Aanvraag</Subheading>
            <div className="flex items-center gap-4">
              {/* Show role-specific actions */}
              {role === "kandidaat" && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Je hebt alleen leesrechten voor deze aanvraag
                </span>
              )}
              {role === "leercoach" && (
                <LeercoachView aanvraag={aanvraag} personId={person.id} />
              )}
              {role === "beoordelaar" && (
                <BeoordelaarView aanvraag={aanvraag} personId={person.id} />
              )}
            </div>
          </div>
          <Divider className="mt-4" />
          <AanvraagCard aanvraag={aanvraag} />
        </div>

        <PvbTimeline aanvraagId={aanvraag.id} />

        <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
          <div className="flex justify-between items-center">
            <Subheading>Toetsdocumenten</Subheading>
            {role === "beoordelaar" && aanvraag.status === "in_beoordeling" && (
              <div className="text-sm text-gray-600">
                Je kunt de beoordelingen aanpassen
              </div>
            )}
          </div>
          <Divider className="mt-4" />
          <ToetsdocumentenCard
            aanvraag={aanvraag}
            role={role}
            personId={user.personId}
          />
        </div>
      </div>
    </>
  );
}