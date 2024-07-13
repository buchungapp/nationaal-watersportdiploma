import dayjs from "dayjs";
import React, { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  getPersonByHandle,
  getUserOrThrow,
  listCertificatesForPerson,
  listCountries,
  listExternalCertificatesForPerson,
} from "~/lib/nwd";
import posthog from "~/lib/posthog";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "../../_components/grid-list";
import { EditDetails } from "./_components/action-buttons";

async function ExternalCertificates({ personId }: { personId: string }) {
  const certificates = await listExternalCertificatesForPerson(personId);

  if (certificates.length === 0) {
    return (
      <Text className="italic">
        We hebben geen overige certificaten voor jou kunnen vinden.
      </Text>
    );
  }

  return (
    <GridList>
      {certificates.map((certificate) => {
        const metadataEntries = certificate.metadata
          ? Object.entries(certificate.metadata)
          : [];

        return (
          <GridListItem key={certificate.id}>
            <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-branding-light/10 p-6">
              <div className="text-sm font-medium leading-6 text-gray-900">
                {certificate.identifier}
              </div>
            </div>
            <DescriptionList className="px-6">
              {metadataEntries.length > 0 ? (
                <>
                  {metadataEntries.map(([key, value]) => (
                    <React.Fragment key={key}>
                      <DescriptionTerm>{key}</DescriptionTerm>
                      <DescriptionDetails>{value}</DescriptionDetails>
                    </React.Fragment>
                  ))}
                </>
              ) : null}
              {certificate.awardedAt ? (
                <React.Fragment>
                  <DescriptionTerm>Behaald op</DescriptionTerm>
                  <DescriptionDetails>
                    {dayjs(certificate.awardedAt).format("DD-MM-YYYY")}
                  </DescriptionDetails>
                </React.Fragment>
              ) : null}
              {certificate.location ? (
                <React.Fragment>
                  <DescriptionTerm>Behaald bij</DescriptionTerm>
                  <DescriptionDetails>
                    {certificate.location}
                  </DescriptionDetails>
                </React.Fragment>
              ) : null}
            </DescriptionList>
          </GridListItem>
        );
      })}
    </GridList>
  );
}

async function NWDCertificates({ personId }: { personId: string }) {
  const certificates = await listCertificatesForPerson(personId);

  if (certificates.length === 0) {
    return (
      <Text className="italic">
        Je hebt nog geen NWD-diploma's behaald. Klopt dit niet? Neem dan contact
        op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar je de cursus hebt gevolgd.
      </Text>
    );
  }

  return (
    <GridList>
      {certificates.map((certificate) => (
        <GridListItem key={certificate.id}>
          <GridListHeader
            href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
            target="_blank"
          >
            <div className="text-sm font-medium leading-6 text-gray-900">
              {`#${certificate.handle}`}
            </div>
          </GridListHeader>
          <DescriptionList className="px-6">
            <DescriptionTerm>Programma</DescriptionTerm>
            <DescriptionDetails>
              {certificate.program.title ??
                `${certificate.program.course.title} ${certificate.program.degree.title}`}
            </DescriptionDetails>

            <DescriptionTerm>Vaartuig</DescriptionTerm>
            <DescriptionDetails>
              {certificate.gearType.title}
            </DescriptionDetails>

            <DescriptionTerm>Behaald op</DescriptionTerm>
            <DescriptionDetails>
              {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
            </DescriptionDetails>

            <DescriptionTerm>Behaald bij</DescriptionTerm>
            <DescriptionDetails>{certificate.location.name}</DescriptionDetails>
          </DescriptionList>
        </GridListItem>
      ))}
    </GridList>
  );
}

async function ActionButton({ handle }: { handle: string }) {
  const [person, countries] = await Promise.all([
    getPersonByHandle(handle),
    listCountries(),
  ]);

  return <EditDetails person={person} countries={countries} />;
}

export default async function Page({
  params,
}: Readonly<{ params: { handle: string } }>) {
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

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Heading>Welkom {person.firstName}!</Heading>

      <Text>
        Op deze pagina vind je jouw persoonlijke gegevens, NWD-diploma's en
        overige certificaten. Ook kan je hier je personalia wijzigen.
      </Text>

      <div className="mt-12">
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

      <div className="mt-12">
        <Subheading>Jouw NWD-diploma's</Subheading>
        <Text>
          Hieronder vind je een overzicht van de NWD-diploma's die je hebt
          behaald. Klik ze aan om er meer over te leren, en je succes nogmaals
          te vieren! Mis je een diploma? Neem dan contact op met de{" "}
          <TextLink href="/vaarlocaties" target="_blank">
            vaarlocatie
          </TextLink>{" "}
          waar je de cursus hebt gevolgd.
        </Text>
        <Divider className="mt-2 mb-4" />
        <Suspense>
          <NWDCertificates personId={person.id} />
        </Suspense>
      </div>

      <div className="mt-12">
        <Subheading>Jouw overige certificaten</Subheading>
        <Text>
          Hieronder vind je een overzicht van andere certificaten die je behaalt
          hebt, zoals oude CWO diploma's.
        </Text>
        <Divider className="mt-2 mb-4" />
        <Suspense>
          <ExternalCertificates personId={person.id} />
        </Suspense>
      </div>
    </div>
  );
}
