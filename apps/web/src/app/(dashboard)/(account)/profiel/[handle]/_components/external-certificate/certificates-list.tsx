import Image from "next/image";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "~/app/(dashboard)/_components/description-list-condensed";
import {
  GirdListItemOptions,
  GridList,
  GridListItem,
  GridListItemHeader,
  GridListItemTitle,
} from "~/app/(dashboard)/_components/grid-list-v2";
import {
  PDFViewer,
  PDFViewerText,
} from "~/app/(dashboard)/_components/pdf-viewer";
import { Code } from "~/app/(dashboard)/_components/text";
import { DialogProvider } from "~/app/(dashboard)/_hooks/use-dialog";
import dayjs from "~/lib/dayjs";
import { listExternalCertificatesForPerson } from "~/lib/nwd";
import { parseCertificateSearchParams } from "../../_searchParams";
import MediaViewer, { MediaViewerButton } from "../media-viewer";
import { AddMedia } from "./add-media";
import { EditCertificate, EditCertificateButton } from "./edit-certificate";
import {
  RemoveCertificate,
  RemoveCertificateButton,
} from "./remove-certificate";

export type ExternalCertificate = Awaited<
  ReturnType<typeof listExternalCertificatesForPerson>
>[number];

export async function ExternalCertificatesList({
  personId,
  noResults = null,
  whenResults = null,
  searchParams,
}: {
  personId: string;
  noResults?: React.ReactNode;
  whenResults?: React.ReactNode;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [externalCertificates, parsedSq] = await Promise.all([
    listExternalCertificatesForPerson(personId).then((certificates) =>
      certificates.sort((a, b) =>
        dayjs(a.awardedAt).isAfter(dayjs(b.awardedAt)) ? -1 : 1,
      ),
    ),
    parseCertificateSearchParams(searchParams),
  ]);

  const editCertificate = externalCertificates.find(
    (certificate) => certificate.id === parsedSq["edit-certificate"],
  );

  const media = externalCertificates.find(
    (certificate) => certificate.media?.id === parsedSq["media-viewer"],
  )?.media;

  return (
    <>
      {externalCertificates.length === 0 ? noResults : whenResults}
      {editCertificate ? (
        <EditCertificate personId={personId} certificate={editCertificate} />
      ) : null}
      {media ? <MediaViewer media={media} /> : null}
      <GridList>
        {externalCertificates.map((certificate) => (
          <ExternalCertificate
            key={certificate.id}
            externalCertificate={certificate}
            personId={personId}
          />
        ))}
      </GridList>
    </>
  );
}

function ExternalCertificate({
  externalCertificate,
  personId,
}: {
  externalCertificate: ExternalCertificate;
  personId: string;
}) {
  return (
    <GridListItem key={externalCertificate.id} className="bg-white">
      <div className="flex flex-col h-full">
        <div className="grow">
          <ExternalCertificateHeader
            certificate={externalCertificate}
            personId={personId}
          />
          <DescriptionList className="px-6">
            <ExternalCertificateDescriptionList
              certificate={externalCertificate}
            />
          </DescriptionList>
        </div>

        <ExternalCertificateFooter
          certificate={externalCertificate as ExternalCertificate}
          personId={personId}
        />
      </div>
    </GridListItem>
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
