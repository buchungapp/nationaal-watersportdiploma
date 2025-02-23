import dayjs from "dayjs";
import Image from "next/image";
import { Suspense } from "react";
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
      awardedAt: x.issuedAt ?? x.createdAt,
      issuingAuthority: "NWD",
    })),
    ...externalCertificates.map((x) => ({
      id: x.id,
      awardedAt: x.awardedAt ?? x.createdAt,
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
              personId={personId}
            />
          );
        })}
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
      <div className="flex flex-col h-full">
        <div className="grow">
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

          <DescriptionList className="px-6">
            <DescriptionTerm>Diplomanummer</DescriptionTerm>
            <DescriptionDetails>
              <Code>{certificate.handle}</Code>
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
        </div>

        <div className="@container mx-3 rounded-md overflow-hidden mt-3">
          <TemplateHeader
            gearTypeTitle={certificate.gearType.title}
            programTitle={certificate.program.title}
            courseTitle={certificate.program.course.title}
            degreeRang={certificate.program.degree.rang}
          />
        </div>
      </div>
    </GridListItem>
  );
}

function ExternalCertificate({
  certificate,
  personId,
}: {
  certificate: Awaited<
    ReturnType<typeof listExternalCertificatesForPerson>
  >[number];
  personId: string;
}) {
  return (
    <GridListItem key={certificate.id}>
      <div className="flex flex-col h-full">
        <div className="grow">
          <GridListItemHeader>
            <GridListItemTitle href={"d"} target="_blank">
              {certificate.title}
            </GridListItemTitle>
            <GirdListItemOptions>
              <DropdownItem>
                <DropdownLabel>Diploma bewerken</DropdownLabel>
              </DropdownItem>
            </GirdListItemOptions>
          </GridListItemHeader>

          <DescriptionList className="px-6">
            {certificate.issuingAuthority ? (
              <>
                <DescriptionTerm>Uitgevende instantie</DescriptionTerm>
                <DescriptionDetails>
                  {certificate.issuingAuthority}
                </DescriptionDetails>
              </>
            ) : null}

            {certificate.identifier ? (
              <>
                <DescriptionTerm>Identificatie</DescriptionTerm>
                <DescriptionDetails>
                  <Code>{certificate.identifier}</Code>
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
        </div>

        {certificate.media ? (
          <div className="mx-3 mt-2 p-1 w-[calc(100%---spacing(6))] flex justify-center rounded-md bg-slate-100">
            <Image
              src={certificate.media.url}
              alt={certificate.title}
              width={certificate.media.width || 100}
              height={certificate.media.height || 100}
              className="rounded-xs w-auto h-auto object-contain max-h-31"
            />
          </div>
        ) : (
          <div className="mx-3 mt-2 h-full w-[calc(100%---spacing(6))]">
            <AddMedia
              className="w-full"
              personId={personId}
              externalCertificateId={certificate.id}
            />
          </div>
        )}
      </div>
    </GridListItem>
  );
}
