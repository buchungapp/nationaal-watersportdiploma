import dayjs from "dayjs";
import { Suspense } from "react";
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
  listCertificatesForPerson,
  listCountries,
} from "~/lib/nwd";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "../../_components/grid-list";
import { EditDetails } from "./_components/action-buttons";

async function NWDCertificates({ personId }: { personId: string }) {
  const certificates = await listCertificatesForPerson(personId);

  if (certificates.length === 0) {
    return (
      <Text>
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
  const person = await getPersonByHandle(params.handle);

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

      <div className="mt-10">
        <Subheading>Jouw NWD-diploma's</Subheading>
        <Divider className="mt-2 mb-4" />
        <Suspense>
          <NWDCertificates personId={person.id} />
        </Suspense>
      </div>
    </div>
  );
}
