import dayjs from "dayjs";
import { Suspense } from "react";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  GridList,
  GridListHeader,
  GridListItem,
} from "~/app/(dashboard)/_components/grid-list";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCertificatesForPerson,
  listExternalCertificatesForPerson,
} from "~/lib/nwd";
import { AddCertificate } from "./certificates/add-certificate";

interface Props {
  person: {
    id: string;
  };
}

export default async function PersonCertificates({ person }: Props) {
  return (
    <div className="lg:col-span-2">
      <Subheading>Jouw Watersportcertificaten</Subheading>
      <Text>
        Hieronder vind je een overzicht van de Watersportcertificaten die je
        hebt behaald. Klik ze aan en leer meer over je diploma en vier het
        succes nog een keer! Mis je een NWD-diploma? Neem dan contact op met de{" "}
        <TextLink href="/vaarlocaties" target="_blank">
          vaarlocatie
        </TextLink>{" "}
        waar je de cursus hebt gevolgd.
      </Text>
      <Divider className="mt-2 mb-4" />
      <Suspense
        fallback={
          <div className="animate-pulse h-67 w-87 bg-slate-200 rounded-xl -my-1.5" />
        }
      >
        <Certificates
          personId={person.id}
          noResults={
            <Text className="italic mb-2">
              Je hebt nog geen NWD-diploma's behaald. Klopt dit niet? Neem dan
              contact op met de{" "}
              <TextLink href="/vaarlocaties" target="_blank">
                vaarlocatie
              </TextLink>{" "}
              waar je de cursus hebt gevolgd.
            </Text>
          }
        />
      </Suspense>
    </div>
  );
}

async function Certificates({
  personId,
  noResults = null,
}: {
  personId: string;
  noResults?: React.ReactNode;
}) {
  const certificates = await listCertificatesForPerson(personId);

  const externalCertificates =
    await listExternalCertificatesForPerson(personId);

  const allCertificateIds = [
    ...certificates.map((x) => ({
      id: x.id,
      awardedAt: x.issuedAt,
      issuingAuthority: "NWD",
    })),
    ...externalCertificates.map((x) => ({
      id: x.id,
      awardedAt: x.awardedAt,
      issuingAuthority: x.issuingAuthority,
    })),
  ].sort((a, b) => (dayjs(a.awardedAt).isAfter(dayjs(b.awardedAt)) ? -1 : 1));

  return (
    <>
      {certificates.length === 0 ? noResults : null}
      <GridList>
        {allCertificateIds.map(({ id, awardedAt, issuingAuthority }) => {
          if (issuingAuthority === "NWD") {
            // biome-ignore lint/style/noNonNullAssertion: Array is constructed from certificates
            const certificate = certificates.find((x) => x.id === id)!;

            return (
              <NWDCertificate key={certificate.id} certificate={certificate} />
            );
          }

          // biome-ignore lint/style/noNonNullAssertion: Array is constructed from externalCertificates
          const certificate = externalCertificates.find((x) => x.id === id)!;

          return (
            <ExternalCertificate
              key={certificate.id}
              certificate={certificate}
            />
          );
        })}
        <li>
          <AddCertificate personId={personId} />
        </li>
      </GridList>
    </>
  );
}

function NWDCertificate({
  certificate,
}: {
  certificate: Awaited<ReturnType<typeof listCertificatesForPerson>>[number];
}) {
  return (
    <GridListItem key={certificate.id}>
      <GridListHeader
        href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
        target="_blank"
      >
        <div className="text-sm font-medium leading-6 text-slate-900">
          {`Diplomanummer #${certificate.handle}`}
        </div>
      </GridListHeader>
      <DescriptionList className="px-6">
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>
          {certificate.program.title ??
            `${certificate.program.course.title} ${certificate.program.degree.title}`}
        </DescriptionDetails>

        <DescriptionTerm>Vaartuig</DescriptionTerm>
        <DescriptionDetails>{certificate.gearType.title}</DescriptionDetails>

        <DescriptionTerm>Behaald op</DescriptionTerm>
        <DescriptionDetails>
          {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
        </DescriptionDetails>

        <DescriptionTerm>Behaald bij</DescriptionTerm>
        <DescriptionDetails>{certificate.location.name}</DescriptionDetails>
      </DescriptionList>
    </GridListItem>
  );
}

function ExternalCertificate({
  certificate,
}: {
  certificate: Awaited<
    ReturnType<typeof listExternalCertificatesForPerson>
  >[number];
}) {
  return (
    <GridListItem key={certificate.id}>
      <GridListHeader
        href={"#TODO"}
        // href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
        target="_blank"
      >
        <div className="text-sm font-medium leading-6 text-slate-900">
          {`Diplomanummer #${certificate.identifier}`}
        </div>
      </GridListHeader>
      <DescriptionList className="px-6">
        <DescriptionTerm>Programma</DescriptionTerm>
        <DescriptionDetails>{certificate.title}</DescriptionDetails>

        {certificate.issuingAuthority ? (
          <>
            <DescriptionTerm>Uitgevende instantie</DescriptionTerm>
            <DescriptionDetails>
              {certificate.issuingAuthority}
            </DescriptionDetails>
          </>
        ) : null}

        {certificate.awardedAt ? (
          <>
            <DescriptionTerm>Behaald op</DescriptionTerm>
            <DescriptionDetails>
              {dayjs(certificate.awardedAt).format("DD-MM-YYYY")}
            </DescriptionDetails>
          </>
        ) : null}

        {certificate.location ? (
          <>
            <DescriptionTerm>Behaald bij</DescriptionTerm>
            <DescriptionDetails>{certificate.location}</DescriptionDetails>
          </>
        ) : null}
      </DescriptionList>
    </GridListItem>
  );
}
