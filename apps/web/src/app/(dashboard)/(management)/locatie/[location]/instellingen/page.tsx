import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  listDisciplines,
  listGearTypes,
  listResourcesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import LogosForm from "./_components/logos-form";
import ResourcesForm from "./_components/resources-form";
import SettingsForm from "./_components/settings-form";
import SocialsForm from "./_components/socials-form";

export default async function Page(props: {
  params: Promise<{
    location: string;
  }>;
}) {
  const params = await props.params;
  const locationPromise = retrieveLocationByHandle(params.location);
  const [location, resources, allGearTypes, allDisciplines] = await Promise.all(
    [
      locationPromise,
      locationPromise.then((location) => listResourcesForLocation(location.id)),
      listGearTypes(),
      listDisciplines(),
    ],
  );

  const {
    name,
    shortDescription,
    websiteUrl,
    logo,
    logoSquare,
    logoCertificate,
    email,
    googlePlaceId,
    socialMedia,
  } = location;

  const { gearTypes, disciplines } = resources;

  return (
    <div className="mx-auto max-w-4xl">
      <Heading>Instellingen</Heading>
      <Text>
        Deze informatie wordt gedeeltelijk ook openbaar getoond op{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          de website
        </TextLink>
        .
      </Text>
      <Divider className="mt-6 mb-10" />

      <SettingsForm
        locationId={location.id}
        name={name}
        shortDescription={shortDescription}
        email={email}
        websiteUrl={websiteUrl}
      />

      <Divider className="my-12" />

      <LogosForm
        locationId={location.id}
        logo={logo}
        logoSquare={logoSquare}
        logoCertificate={logoCertificate}
      />

      <Divider className="my-12" />

      <SocialsForm
        locationId={location.id}
        googlePlaceId={googlePlaceId}
        socialMedia={socialMedia}
      />

      <Divider className="my-12" />

      <ResourcesForm
        locationId={location.id}
        gearTypes={gearTypes}
        disciplines={disciplines}
        allGearTypes={allGearTypes}
        allDisciplines={allDisciplines}
      />
    </div>
  );
}
