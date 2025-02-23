import dayjs from "dayjs";
import Image from "next/image";
import { Suspense, cache } from "react";
import { TemplateHeader } from "~/app/(certificate)/diploma/[id]/_components/template-header";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-condensed";
import { Divider } from "~/app/(dashboard)/_components/divider";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import {
  GirdListItemOptions,
  GridList,
  GridListItem,
  GridListItemHeader,
  GridListItemTitle,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Code, Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCertificatesForPerson,
  listExternalCertificatesForPerson,
} from "~/lib/nwd";
import { AddCertificate } from "./add-certificate/add-certificate";
import { AddMedia } from "./add-certificate/add-media";

interface Props {
  person: {
    id: string;
  };
}

type NWDCertificate = Awaited<
  ReturnType<typeof listCertificatesForPerson>
>[number];
type ExternalCertificate = Awaited<
  ReturnType<typeof listExternalCertificatesForPerson>
>[number];

export default async function PersonCertificates({ person }: Props) {
  return (
    <div className="lg:col-span-2">
      <div className="w-full flex justify-between items-center mb-1">
        <Subheading>Jouw Watersportcertificaten</Subheading>
        <AddCertificate className="-my-1.5" personId={person.id} />
      </div>
      <Text>
        Hieronder vind je een overzicht van de Watersportcertificaten die je
        hebt behaald.
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

const getAllCertificates = cache(async (personId: string) => {
  const certificates = await listCertificatesForPerson(personId);
  const externalCertificates =
    await listExternalCertificatesForPerson(personId);

  const allCertificates = [...certificates, ...externalCertificates].sort(
    (a, b) =>
      dayjs("program" in a ? a.issuedAt : a.awardedAt).isAfter(
        dayjs("program" in b ? b.issuedAt : b.awardedAt),
      )
        ? -1
        : 1,
  );

  return {
    certificates,
    externalCertificates,
    allCertificates,
  };
});

async function Certificates({
  personId,
  noResults = null,
}: {
  personId: string;
  noResults?: React.ReactNode;
}) {
  const { allCertificates, certificates } = await getAllCertificates(personId);

  return (
    <>
      {certificates.length === 0 ? noResults : null}
      <GridList>
        {allCertificates.map((certificate) => (
          <Certificate key={certificate.id} certificate={certificate} />
        ))}
      </GridList>
    </>
  );
}

function Certificate({
  certificate,
}: {
  certificate: NWDCertificate | ExternalCertificate;
}) {
  const isNWD = "program" in certificate;

  return (
    <GridListItem key={certificate.id}>
      <div className="flex flex-col h-full">
        <div className="grow">
          {isNWD ? (
            <NWDCertificateHeader certificate={certificate} />
          ) : (
            <ExternalCertificateHeader certificate={certificate} />
          )}

          <DescriptionList className="px-6">
            {isNWD ? (
              <NWDCertificateDescriptionList certificate={certificate} />
            ) : (
              <ExternalCertificateDescriptionList certificate={certificate} />
            )}
          </DescriptionList>
        </div>

        {isNWD ? (
          <NWDCertificateFooter certificate={certificate as NWDCertificate} />
        ) : (
          <ExternalCertificateFooter
            certificate={certificate as ExternalCertificate}
            personId="1"
          />
        )}
      </div>
    </GridListItem>
  );
}

function NWDCertificateHeader({
  certificate,
}: {
  certificate: NWDCertificate;
}) {
  return (
    <GridListItemHeader>
      <GridListItemTitle
        href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
        target="_blank"
      >
        {certificate.program.title ??
          `${certificate.program.course.title} ${certificate.program.degree.title}`}
      </GridListItemTitle>
      <GirdListItemOptions>
        <DropdownItem
          href={`/diploma/${certificate.id}?nummer=${certificate.handle}&datum=${dayjs(certificate.issuedAt).format("YYYYMMDD")}`}
          target="_blank"
        >
          <DropdownLabel>Diploma bekijken</DropdownLabel>
        </DropdownItem>
      </GirdListItemOptions>
    </GridListItemHeader>
  );
}

function NWDCertificateDescriptionList({
  certificate,
}: { certificate: NWDCertificate }) {
  return (
    <>
      <DescriptionTerm>Diplomanummer</DescriptionTerm>
      <DescriptionDetails>
        <Code>{certificate.handle}</Code>
      </DescriptionDetails>

      <DescriptionTerm>Vaartuig</DescriptionTerm>
      <DescriptionDetails>{certificate.gearType.title}</DescriptionDetails>

      <DescriptionTerm>Behaald op</DescriptionTerm>
      <DescriptionDetails>
        {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
      </DescriptionDetails>

      <DescriptionTerm>Behaald bij</DescriptionTerm>
      <DescriptionDetails>{certificate.location.name}</DescriptionDetails>
    </>
  );
}

function NWDCertificateFooter({
  certificate,
}: {
  certificate: NWDCertificate;
}) {
  return (
    <div className="@container mx-3 rounded-md overflow-hidden mt-3">
      <TemplateHeader
        gearTypeTitle={certificate.gearType.title}
        programTitle={certificate.program.title}
        courseTitle={certificate.program.course.title}
        degreeRang={certificate.program.degree.rang}
      />
    </div>
  );
}

function ExternalCertificateHeader({
  certificate,
}: {
  certificate: ExternalCertificate;
}) {
  return (
    <GridListItemHeader>
      <GridListItemTitle>{certificate.title}</GridListItemTitle>
      <GirdListItemOptions>
        <DropdownItem>
          <DropdownLabel>Diploma bewerken</DropdownLabel>
        </DropdownItem>
      </GirdListItemOptions>
    </GridListItemHeader>
  );
}

function ExternalCertificateDescriptionList({
  certificate,
}: { certificate: ExternalCertificate }) {
  return (
    <>
      <DescriptionTerm>Uitgevende instantie</DescriptionTerm>
      <DescriptionDetails>
        {certificate.issuingAuthority ? certificate.issuingAuthority : null}
      </DescriptionDetails>
      <DescriptionTerm>Diplomanummer</DescriptionTerm>
      <DescriptionDetails>
        {certificate.identifier ? <Code>certificate.identifier</Code> : null}
      </DescriptionDetails>
      <DescriptionTerm>Behaald op</DescriptionTerm>
      <DescriptionDetails>
        {certificate.awardedAt
          ? dayjs(certificate.awardedAt).format("DD-MM-YYYY")
          : null}
      </DescriptionDetails>
      <DescriptionTerm>Behaald bij</DescriptionTerm>
      <DescriptionDetails>
        {certificate.location ? certificate.location : null}
      </DescriptionDetails>
    </>
  );
}

function ExternalCertificateFooter({
  certificate,
  personId,
}: {
  certificate: ExternalCertificate;
  personId: string;
}) {
  if (certificate.media) {
    return (
      <div className="mx-3 mt-2 p-1 w-[calc(100%---spacing(6))] flex justify-center rounded-md bg-slate-100">
        <Image
          src={certificate.media.url}
          alt={certificate.title}
          width={certificate.media.width || 100}
          height={certificate.media.height || 100}
          className="rounded-xs w-auto h-auto object-contain max-h-31"
        />
      </div>
    );
  }

  return (
    <div className="mx-3 mt-2 h-full w-[calc(100%---spacing(6))] max-h-33">
      <AddMedia personId={personId} externalCertificateId={certificate.id} />
    </div>
  );
}
