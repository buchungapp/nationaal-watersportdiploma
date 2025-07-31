import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text } from "~/app/(dashboard)/_components/text";
import {
  getUserOrThrow,
  listDisciplines,
  listGearTypes,
  listResourcesForLocation,
  retrieveLocationById,
} from "~/lib/nwd";
import { isSecretariaat } from "~/utils/auth/is-secretariaat";
import { isSystemAdmin } from "~/utils/auth/is-system-admin";
import LogosForm from "../../../locatie/[location]/instellingen/_components/logos-form";
import ResourcesForm from "../../../locatie/[location]/instellingen/_components/resources-form";
import SettingsForm from "../../../locatie/[location]/instellingen/_components/settings-form";
import SocialsForm from "../../../locatie/[location]/instellingen/_components/socials-form";
import { UpdateLocationStatusDialog } from "../_components/dialogs/update-location-status-dialog";
import { StatusBadge } from "../_components/status-badge";

export default async function LocationPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const user = await getUserOrThrow();

  // Check if user is system admin or secretariaat
  if (!isSystemAdmin(user.email) && !isSecretariaat(user.email)) {
    return (
      <>
        <Heading level={1}>Geen toegang</Heading>
        <Text className="mt-2">Je hebt geen toegang tot deze pagina.</Text>
      </>
    );
  }

  const { locationId } = await params;
  const locationPromise = retrieveLocationById(locationId).catch(() =>
    notFound(),
  );

  const [location, resources, allGearTypes, allDisciplines] = await Promise.all(
    [
      locationPromise,
      locationPromise.then((location) => listResourcesForLocation(location.id)),
      listGearTypes(),
      listDisciplines(),
    ],
  );

  return (
    <>
      <div className="flex items-center gap-2">
        <Heading level={1}>{location.name} </Heading>
        <StatusBadge status={location.status} />
      </div>

      <Text className="mt-2">Beheer de locatie.</Text>
      <div className="flex justify-between items-end mt-4 mb-2">
        <Link
          href="/secretariaat/locaties"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Terug naar overzicht
        </Link>
        <div className="flex items-center gap-2">
          <UpdateLocationStatusDialog
            locationId={locationId}
            status={location.status}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 bg-zinc-100 -mx-2 p-2 rounded-xl">
        <StackedLayoutCardDisclosure
          header={
            <>
              <div className="flex justify-between items-center gap-2">
                <Subheading>Algemene instellingen</Subheading>
                <StackedLayoutCardDisclosureChevron />
              </div>
              <Text>
                Deze informatie wordt gedeeltelijk ook openbaar getoond op de
                website.
              </Text>
            </>
          }
        >
          <SettingsForm
            locationId={locationId}
            name={location.name}
            shortDescription={location.shortDescription}
            email={location.email}
            websiteUrl={location.websiteUrl}
            className="mt-4"
          />
        </StackedLayoutCardDisclosure>

        <StackedLayoutCardDisclosure
          header={
            <>
              <div className="flex justify-between items-center gap-2">
                <Subheading>Logo instellingen</Subheading>
                <StackedLayoutCardDisclosureChevron />
              </div>
              <Text>
                We gebruiken verschillende variaties. Zorg dat ze allemaal
                up-to-date zijn.
              </Text>
            </>
          }
        >
          <LogosForm
            locationId={locationId}
            logo={location.logo}
            logoSquare={location.logoSquare}
            logoCertificate={location.logoCertificate}
            className="mt-4"
          />
        </StackedLayoutCardDisclosure>

        <StackedLayoutCardDisclosure
          header={
            <>
              <div className="flex justify-between items-center gap-2">
                <Subheading>Socials</Subheading>
                <StackedLayoutCardDisclosureChevron />
              </div>
              <Text>
                Beheer de links naar verschillende social media kanalen.
              </Text>
            </>
          }
        >
          <SocialsForm
            locationId={locationId}
            googlePlaceId={location.googlePlaceId}
            socialMedia={location.socialMedia}
            className="mt-4"
          />
        </StackedLayoutCardDisclosure>

        <StackedLayoutCardDisclosure
          header={
            <>
              <div className="flex justify-between items-center gap-2">
                <Subheading>Vaartuigen en disciplines</Subheading>
                <StackedLayoutCardDisclosureChevron />
              </div>
              <Text>
                Beheer de vaartuigen en disciplines die deze locatie aanbiedt.
              </Text>
            </>
          }
        >
          <ResourcesForm
            locationId={locationId}
            gearTypes={resources.gearTypes}
            disciplines={resources.disciplines}
            allGearTypes={allGearTypes}
            allDisciplines={allDisciplines}
            className="mt-4"
          />
        </StackedLayoutCardDisclosure>
      </div>
    </>
  );
}
