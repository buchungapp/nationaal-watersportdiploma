import React from "react";
import dayjs from "~/lib/dayjs";
import {
  listCertificatesForPerson,
  listExternalCertificatesForPerson,
} from "~/lib/nwd";
import {
  DescriptionDetails,
  DescriptionList,
  DescriptionTerm,
} from "../description-list";
import { GridList, GridListHeader, GridListItem } from "../grid-list";

export async function NWDCertificates({
  personId,
  locationId,
  noResults = null,
}: {
  personId: string;
  locationId?: string;
  noResults?: React.ReactNode;
}) {
  const certificates = await listCertificatesForPerson(personId, locationId);

  if (certificates.length === 0) {
    return <>{noResults}</>;
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

export async function ExternalCertificates({
  personId,
  locationId,
  noResults = null,
}: {
  personId: string;
  locationId?: string;
  noResults?: React.ReactNode;
}) {
  const certificates = await listExternalCertificatesForPerson(
    personId,
    locationId,
  );

  if (certificates.length === 0) {
    return <>{noResults}</>;
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
