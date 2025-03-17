import dayjs from "dayjs";
import Image from "next/image";
import { cache } from "react";
import { TemplateHeader } from "~/app/(certificate)/diploma/[id]/_components/template-header";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-condensed";
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
import { Code } from "~/app/(dashboard)/_components/text";
import { DialogProvider } from "~/app/(dashboard)/_hooks/use-dialog";
import {
  listCertificatesForPerson,
  listExternalCertificatesForPerson,
} from "~/lib/nwd";
import { pageParamsCache } from "../_searchParams";
import { AddMedia } from "./certificate/add-media";
import {
  EditCertificate,
  EditCertificateButton,
} from "./certificate/edit-certificate";
import {
  RemoveCertificate,
  RemoveCertificateButton,
} from "./certificate/remove-certificate";
import MediaViewer, { MediaViewerButton } from "./media-viewer";
import { PDFViewer, PDFViewerText } from "./pdf-viewer";

export type NWDCertificate = Awaited<
  ReturnType<typeof listCertificatesForPerson>
>[number];
export type ExternalCertificate = Awaited<
  ReturnType<typeof listExternalCertificatesForPerson>
>[number];

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

export async function Certificates({
  personId,
  noResults = null,
}: {
  personId: string;
  noResults?: React.ReactNode;
}) {
  const { allCertificates, externalCertificates } =
    await getAllCertificates(personId);

  const parsedSq = pageParamsCache.all();

  const editCertificate = externalCertificates.find(
    (certificate) => certificate.id === parsedSq["edit-certificate"],
  );

  const media = externalCertificates.find(
    (certificate) => certificate.media?.id === parsedSq["media-viewer"],
  )?.media;

  return (
    <>
      {allCertificates.length === 0 ? noResults : null}
      {editCertificate ? (
        <EditCertificate personId={personId} certificate={editCertificate} />
      ) : null}
      {media ? <MediaViewer media={media} /> : null}
      <GridList>
        {allCertificates.map((certificate) => (
          <Certificate
            key={certificate.id}
            certificate={certificate}
            personId={personId}
          />
        ))}
      </GridList>
    </>
  );
}

export async function NWDCertificates({
  personId,
  noResults = null,
}: {
  personId: string;
  noResults?: React.ReactNode;
}) {
  const { certificates } = await getAllCertificates(personId);

  return (
    <>
      {certificates.length === 0 ? noResults : null}
      <GridList>
        {certificates.map((certificate) => (
          <Certificate
            key={certificate.id}
            certificate={certificate}
            personId={personId}
          />
        ))}
      </GridList>
    </>
  );
}

function Certificate({
  certificate,
  personId,
}: {
  certificate: NWDCertificate | ExternalCertificate;
  personId: string;
}) {
  const isNWD = "program" in certificate;

  return (
    <GridListItem key={certificate.id}>
      <div className="flex flex-col h-full">
        <div className="grow">
          {isNWD ? (
            <NWDCertificateHeader certificate={certificate} />
          ) : (
            <ExternalCertificateHeader
              certificate={certificate}
              personId={personId}
            />
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
            personId={personId}
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
    <div className="@container mx-3 mt-3 rounded-md overflow-hidden">
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
  personId,
}: {
  certificate: ExternalCertificate;
  personId: string;
}) {
  return (
    <GridListItemHeader>
      <GridListItemTitle>{certificate.title}</GridListItemTitle>
      <DialogProvider>
        <GirdListItemOptions>
          <EditCertificateButton certificate={certificate} />
          <RemoveCertificateButton />
        </GirdListItemOptions>
        <RemoveCertificate personId={personId} certificateId={certificate.id} />
      </DialogProvider>
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
        {certificate.identifier ? <Code>{certificate.identifier}</Code> : null}
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
      <MediaViewerButton media={certificate.media}>
        <div className="flex justify-center bg-slate-100 mx-3 mt-2 p-1 rounded-md w-[calc(100%---spacing(6))]">
          {certificate.media.type === "image" ? (
            <Image
              src={certificate.media.url}
              alt={`${certificate.media.alt} ${certificate.title}`}
              width={certificate.media.width || 100}
              height={certificate.media.height || 100}
              className="rounded-xs w-auto h-auto max-h-31 object-contain"
            />
          ) : (
            <div className="w-full h-31">
              <PDFViewer file={certificate.media.url}>
                <PDFViewerText>Klik om meer pagina's te bekijken</PDFViewerText>
              </PDFViewer>
            </div>
          )}
        </div>
      </MediaViewerButton>
    );
  }

  return (
    <div className="mx-3 mt-2 w-[calc(100%---spacing(6))] h-full max-h-33">
      <AddMedia personId={personId} externalCertificateId={certificate.id} />
    </div>
  );
}
