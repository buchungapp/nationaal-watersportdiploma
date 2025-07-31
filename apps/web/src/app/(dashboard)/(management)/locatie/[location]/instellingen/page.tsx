import { Divider } from "~/app/(dashboard)/_components/divider";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  listDisciplines,
  listGearTypes,
  listResourcesForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import LogosForm from "./_components/logos-form";
import ResourcesForm from "./_components/resources-form";
import { SectionHeader } from "./_components/section-header";
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
      <SectionHeader
        heading
        divider
        title="Instellingen"
        description={
          <>
            Deze informatie wordt gedeeltelijk ook openbaar getoond op{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              de website
            </TextLink>
            .
          </>
        }
      />
      <SettingsForm
        locationId={location.id}
        name={name}
        shortDescription={shortDescription}
        email={email}
        websiteUrl={websiteUrl}
      />

      <Divider className="my-12" />

      <SectionHeader
        title="Logo's"
        description="We gebruiken verschillende variaties. Zorg dat ze allemaal up-to-date zijn."
        divider
      />
      <LogosForm
        locationId={location.id}
        logo={logo}
        logoSquare={logoSquare}
        logoCertificate={logoCertificate}
      />

      <Divider className="my-12" />

      <SectionHeader
        title="Socials"
        description="Beheer de links naar verschillende social media kanalen."
        divider
      />
      <SocialsForm
        locationId={location.id}
        googlePlaceId={googlePlaceId}
        socialMedia={socialMedia}
      />

      <Divider className="my-12" />

      <SectionHeader
        title="Vaartuigen en disciplines"
        description="Beheer de vaartuigen en disciplines die deze locatie aanbiedt."
        divider
      />
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
