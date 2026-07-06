import { notFound } from "next/navigation";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text } from "~/app/(dashboard)/_components/text";
import { isSystemAdmin } from "~/lib/authorization";
import {
  getUserOrThrow,
  listCountries,
  listCourses,
  listPersonsAtLocationAsAdmin,
  listResourcesForLocation,
  retrieveLocationByIdAsAdmin,
} from "~/lib/nwd";
import { LocationInfo } from "./_components/location-info";
import { LocationOnboardingActions } from "./_components/location-onboarding-actions";
import { LocationOverviewSection } from "./_components/location-overview-section";

export default async function LocatieDetailPage(props: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserOrThrow();

  if (!isSystemAdmin(user.email)) {
    return (
      <div className="mx-auto max-w-7xl">
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </div>
    );
  }

  const { id } = await props.params;

  let location: Awaited<ReturnType<typeof retrieveLocationByIdAsAdmin>>;
  try {
    location = await retrieveLocationByIdAsAdmin(id);
  } catch {
    notFound();
  }

  const [admins, countries, resources, courses] = await Promise.all([
    listPersonsAtLocationAsAdmin(id, { type: "location_admin" }),
    listCountries(),
    listResourcesForLocation(id),
    listCourses(undefined, id),
  ]);

  return (
    <div className="mx-auto max-w-7xl">
      <LocationInfo location={location} />

      <div className="mb-8">
        <Heading level={2}>Onboarding</Heading>
        <Text className="mt-2 mb-4">
          Voeg locatiebeheerders en instructeurs toe, of importeer
          kwalificaties voor bestaande instructeurs.
        </Text>
        <LocationOnboardingActions
          locationId={location.id}
          locationName={location.name}
          countries={countries}
        />
      </div>

      <LocationOverviewSection
        admins={admins}
        courses={courses}
        gearTypes={resources.gearTypes.map(({ gearType }) => gearType)}
      />
    </div>
  );
}
