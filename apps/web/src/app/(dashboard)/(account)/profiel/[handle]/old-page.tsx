import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import {
  ExternalCertificates,
  NWDCertificates,
} from "~/app/(dashboard)/_components/nwd/certificates";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import { getPersonByHandle, getUserOrThrow, listCountries } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { EditDetails } from "./_components/action-buttons";
import { PersonCohortProgress } from "./_components/cohort-progress";

async function ActionButton({ handle }: { handle: string }) {
  const [person, countries] = await Promise.all([
    getPersonByHandle(handle),
    listCountries(),
  ]);

  return <EditDetails person={person} countries={countries} />;
}

export default async function PageWithoutNewWaterSportCertificates(props: {
  params: Promise<{
    handle: string;
  }>;
}) {
  const params = await props.params;
  const [user, person] = await Promise.all([
    getUserOrThrow(),
    getPersonByHandle(params.handle),
  ]);

  posthog.capture({
    distinctId: user.authUserId,
    event: "viewed_profile",
    properties: {
      $set: { email: user.email, displayName: user.displayName },
    },
  });

  await posthog.shutdown();

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Heading>Welkom {person.firstName}!</Heading>

      <Text>
        Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
        overige certificaten. Ook kan je hier je personalia wijzigen.
      </Text>

      <div className="space-y-12 xl:space-y-16">
        <div>
          <div className="flex items-center justify-between">
            <Subheading>Personalia</Subheading>
            <Suspense fallback={null}>
              <ActionButton handle={params.handle} />
            </Suspense>
          </div>
          <Divider className="mt-4" />
          <DescriptionList>
            <DescriptionTerm>Voornaam</DescriptionTerm>
            <DescriptionDetails>{person.firstName}</DescriptionDetails>

            <DescriptionTerm>Tussenvoegsel</DescriptionTerm>
            <DescriptionDetails>
              {person.lastNamePrefix ?? "-"}
            </DescriptionDetails>

            <DescriptionTerm>Achternaam</DescriptionTerm>
            <DescriptionDetails>{person.lastName ?? "-"}</DescriptionDetails>

            <DescriptionTerm>Geboortedatum</DescriptionTerm>
            <DescriptionDetails>
              {person.dateOfBirth
                ? dayjs(person.dateOfBirth).format("DD-MM-YYYY")
                : "-"}
            </DescriptionDetails>

            <DescriptionTerm>Geboorteplaats</DescriptionTerm>
            <DescriptionDetails>{person.birthCity ?? "-"}</DescriptionDetails>

            <DescriptionTerm>Geboorteland</DescriptionTerm>
            <DescriptionDetails>
              {person.birthCountry?.name ?? "-"}
            </DescriptionDetails>
          </DescriptionList>
        </div>
        <PersonCohortProgress
          person={{
            id: person.id,
            handle: person.handle,
          }}
        />
        <div>
          <Subheading>Jouw NWD-diploma's</Subheading>
          <Text>
            Hieronder vind je een overzicht van de NWD-diploma's die je hebt
            behaald. Klik ze aan en leer meer over je diploma en vier het succes
            nog een keer! Mis je een diploma? Neem dan contact op met de{" "}
            <TextLink href="/vaarlocaties" target="_blank">
              vaarlocatie
            </TextLink>{" "}
            waar je de cursus hebt gevolgd.
          </Text>
          <Divider className="mt-2 mb-4" />
          <Suspense>
            <NWDCertificates
              personId={person.id}
              noResults={
                <Text className="italic">
                  Je hebt nog geen NWD-diploma's behaald. Klopt dit niet? Neem
                  dan contact op met de{" "}
                  <TextLink href="/vaarlocaties" target="_blank">
                    vaarlocatie
                  </TextLink>{" "}
                  waar je de cursus hebt gevolgd.
                </Text>
              }
            />
          </Suspense>
        </div>

        <div>
          <Subheading>Jouw overige certificaten</Subheading>
          <Text>
            Hieronder vind je een overzicht van andere certificaten die je
            behaalt hebt, zoals CWO diploma's.
          </Text>
          <Divider className="mt-2 mb-4" />
          <Suspense>
            <ExternalCertificates
              personId={person.id}
              noResults={
                <Text className="italic">
                  We hebben geen overige certificaten voor jou kunnen vinden.
                </Text>
              }
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
