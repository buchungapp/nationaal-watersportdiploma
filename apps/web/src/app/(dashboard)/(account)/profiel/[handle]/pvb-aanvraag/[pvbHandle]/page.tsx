import { notFound } from "next/navigation";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { RouterPreviousButton } from "~/app/(dashboard)/_components/navigation";
import {
  getPersonByHandle,
  getPrimaryPerson,
  getPvbBeoordelingsCriteria,
  getPvbToetsdocumenten,
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
  aanvraag: Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>,
) {
  if (aanvraag.kandidaat.id === userPersonId) {
    return "kandidaat";
  }
  if (aanvraag.leercoach?.id === userPersonId) {
    return "leercoach";
  }
  if (
    aanvraag.onderdelen.some(
      (onderdeel) => onderdeel.beoordelaar?.id === userPersonId,
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

  // Get current user, person from handle, and PVB aanvraag in parallel
  const [primaryPerson, person, aanvraag] = await Promise.all([
    getUserOrThrow().then((user) => getPrimaryPerson(user)),
    getPersonByHandle(params.handle),
    retrievePvbAanvraagByHandle(params.pvbHandle),
  ]);

  // Check if the user is viewing their own profile
  if (primaryPerson.id !== person.id) {
    notFound();
  }

  // Determine user's role
  const role = await getUserRole(primaryPerson.id, aanvraag);

  if (!role) {
    notFound();
  }

  // Fetch additional data for beoordelaar if needed
  let toetsdocumentenList = null;
  let beoordelingsCriteria = null;

  if (role === "beoordelaar") {
    const [toetsdocumenten, criteria] = await Promise.all([
      getPvbToetsdocumenten(aanvraag.id),
      getPvbBeoordelingsCriteria(aanvraag.id),
    ]);
    toetsdocumentenList = toetsdocumenten;
    beoordelingsCriteria = criteria.items;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Section */}
        <div className="mb-6">
          <div className="max-lg:hidden mb-3">
            <RouterPreviousButton>Terug naar profiel</RouterPreviousButton>
          </div>

          {/* Page Title */}
          <div className="mb-4">
            <Heading className="text-2xl font-bold text-gray-900 dark:text-white">
              PvB Aanvraag
            </Heading>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {aanvraag.courses.find((c) => c.isMainCourse)?.title ||
                aanvraag.handle}{" "}
              - Bekijk en beheer de details van deze praktijkbeoordeling
            </p>
          </div>
        </div>

        {/* Concept Phase Warning */}
        {role !== "kandidaat" && aanvraag.status === "concept" && (
          <div className="mb-6 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-500 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                  Aanvraag in concept fase
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Deze aanvraag is nog in concept en moet eerst worden ingediend
                  door de vaarlocatie.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid - Original layout structure */}
        <div className="items-start gap-x-6 gap-y-6 grid grid-cols-1 lg:grid-cols-3 grid-rows-1 mx-auto lg:mx-0 lg:max-w-none max-w-2xl">
          {/* Right Column - Aanvraag Details (appears first on desktop) */}
          <div className="lg:col-start-3 lg:row-end-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-center mb-4">
                <Subheading className="text-base font-semibold text-gray-900 dark:text-white">
                  Details
                </Subheading>

                {/* Role-specific actions */}
                <div className="flex items-center gap-2">
                  {role === "kandidaat" && (
                    <span className="inline-flex items-center rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      <svg
                        className="mr-1 h-3 w-3"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Alleen lezen
                    </span>
                  )}
                  {role === "leercoach" && (
                    <LeercoachView aanvraag={aanvraag} personId={person.id} />
                  )}
                  {role === "beoordelaar" &&
                    toetsdocumentenList &&
                    beoordelingsCriteria && (
                      <BeoordelaarView
                        aanvraag={aanvraag}
                        personId={person.id}
                        toetsdocumentenList={toetsdocumentenList}
                        beoordelingsCriteria={beoordelingsCriteria}
                      />
                    )}
                </div>
              </div>

              <AanvraagCard aanvraag={aanvraag} />
            </div>
          </div>

          {/* Timeline - Below aanvraag on mobile, left side on desktop */}
          <div className="lg:col-start-3 lg:row-start-1 row-start-3">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <PvbTimeline aanvraagId={aanvraag.id} />
            </div>
          </div>

          {/* Left/Middle Column - Toetsdocumenten (spans 2 columns) */}
          <div className="lg:col-span-2 lg:row-span-2 lg:row-end-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <Subheading className="text-base font-semibold text-gray-900 dark:text-white">
                    Toetsdocumenten
                  </Subheading>
                  {role === "beoordelaar" &&
                    aanvraag.status === "in_beoordeling" && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Je kunt de beoordelingen aanpassen
                      </p>
                    )}
                </div>
              </div>
              <ToetsdocumentenCard
                aanvraag={aanvraag}
                role={role}
                personId={primaryPerson.id}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
