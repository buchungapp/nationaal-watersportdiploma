import { Suspense } from "react";
import dayjs from "~/lib/dayjs";
import { listCertificates, retrieveLocationByHandle } from "~/lib/nwd";
import { StatCard } from "./stat-card";
type CertificatesProps = {
  params: Promise<{
    location: string;
  }>;
};

async function CertificatesContent(props: CertificatesProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const [certificates] = await Promise.all([
    listCertificates(location.id).then((certificates) => {
      return certificates
        .filter((certificate) => !!certificate.issuedAt)
        .sort((a, b) => dayjs(a.issuedAt).diff(dayjs(b.issuedAt)));
    }),
  ]);

  return (
    <div className="gap-8 grid lg:grid-cols-3 mt-4">
      {[
        {
          id: "year",
          title: "Dit jaar",
          count: certificates.filter((certificate) =>
            dayjs(certificate.issuedAt).isAfter(dayjs().startOf("year")),
          ).length,
        },
        {
          id: "lastMonth",
          title: "Afgelopen maand",
          count: certificates.filter(
            (certificate) =>
              dayjs(certificate.issuedAt).isAfter(
                dayjs().startOf("month").subtract(1, "month"),
              ) &&
              dayjs(certificate.issuedAt).isBefore(dayjs().startOf("month")),
          ).length,
        },
        {
          id: "thisMonth",
          title: "Deze maand",
          count: certificates.filter((certificate) =>
            dayjs(certificate.issuedAt).isAfter(dayjs().startOf("month")),
          ).length,
        },
      ].map((stat) => {
        return (
          <StatCard key={stat.id} title={stat.title ?? "Onbekend"}>
            {stat.count}
          </StatCard>
        );
      })}
    </div>
  );
}

export function CertificatesFallback() {
  return (
    <div className="gap-8 grid lg:grid-cols-3 mt-4">
      {[
        {
          id: "year",
          title: "Dit jaar",
        },
        {
          id: "lastMonth",
          title: "Afgelopen maand",
        },
        {
          id: "thisMonth",
          title: "Deze maand",
        },
      ].map((stat) => {
        return (
          <StatCard key={stat.id} title={stat.title}>
            <span className="inline-block bg-gray-200 rounded w-15.5 h-6 animate-pulse" />
          </StatCard>
        );
      })}
    </div>
  );
}

export function Certificates(props: CertificatesProps) {
  return (
    <Suspense fallback={<CertificatesFallback />}>
      <CertificatesContent params={props.params} />
    </Suspense>
  );
}
