import { createLoader, parseAsIsoDate } from "nuqs/server";
import { Suspense } from "react";
import dayjs from "~/lib/dayjs";
import { listDisciplines, retrieveLocationByHandle } from "~/lib/nwd";
import { CertificatesBarChart } from "./certificates-bar-chart";
import { listCertificatesBetween } from "./queries";
import { StatCard } from "./stat-card";

const parseCertificatesPerDisciplineSearchParams = createLoader({
  from: parseAsIsoDate,
  to: parseAsIsoDate,
});

type CertificatesPerDisciplineProps = {
  params: Promise<{
    location: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function CertificatesPerDisciplineContent(
  props: CertificatesPerDisciplineProps,
) {
  const params = await props.params;
  const searchParams = await parseCertificatesPerDisciplineSearchParams(
    props.searchParams,
  );
  const fromDate = searchParams.from ?? dayjs().startOf("year").toDate();
  const toDate = searchParams.to ?? dayjs().endOf("year").toDate();

  const location = await retrieveLocationByHandle(params.location);

  const [certificates, disciplines] = await Promise.all([
    listCertificatesBetween(location.id, fromDate, toDate),
    listDisciplines(),
  ]);

  const certificatesPerWeek = Object.values(
    certificates.reduce(
      (acc, certificate) => {
        const date = dayjs(certificate.issuedAt);
        const isoKey = date.startOf("week").toISOString();
        const week = date.week();

        if (!acc[isoKey]) {
          acc[isoKey] = {
            week: `Week ${week}`,
            weekStart: dayjs(certificate.issuedAt)
              .startOf("week")
              .toISOString(),
            weekEnd: dayjs(certificate.issuedAt).endOf("week").toISOString(),
            count: 0,
            certificates: [],
            ...disciplines.reduce(
              (perDiscipline, discipline) => {
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                perDiscipline[discipline.title!] = 0;
                return perDiscipline;
              },
              {} as Record<string, number>,
            ),
          };
        }

        acc[isoKey]?.certificates.push(certificate);
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        acc[isoKey]!.count += 1;
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        (acc[isoKey]![
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          certificate.discipline.title!
        ] as number) += 1;

        return acc;
      },
      {} as Record<
        string,
        {
          weekStart: string;
          weekEnd: string;
          week: string;
          count: number;
          certificates: (typeof certificates)[number][];
          [key: string]: number | string | (typeof certificates)[number][];
        }
      >,
    ),
  );

  const certificatesPerDiscipline = [
    {
      id: "total",
      title: "Totaal",
      count: certificates.length,
    },
    ...disciplines.map((discipline) => ({
      id: discipline.handle,
      title: discipline.title,
      count: certificates.filter(
        (certificate) => certificate.discipline.title === discipline.title,
      ).length,
    })),
  ];

  return (
    <>
      <div className="gap-8 grid lg:grid-cols-3 mt-4">
        {certificatesPerDiscipline
          .map((stat) => {
            return {
              id: stat.id,
              title: stat.title,
              count: stat.count,
            };
          })
          .map((stat) => {
            return (
              <StatCard key={stat.id} title={stat.title ?? "Onbekend"}>
                {stat.count}
              </StatCard>
            );
          })}
      </div>

      {certificatesPerWeek.length > 0 ? (
        <CertificatesBarChart
          data={certificatesPerWeek as Record<string, number>[]}
          categories={
            disciplines
              .filter((discipline) => {
                return certificatesPerWeek.some(
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  (week) => (week[discipline.title!]! as number) > 0,
                );
              })
              .map((discipline) => discipline.title) as string[]
          }
        />
      ) : null}
    </>
  );
}

export function CertificatesPerDisciplineFallback() {
  return (
    <>
      <div className="gap-8 grid lg:grid-cols-3 mt-4">
        {[
          {
            id: "total",
            title: "Totaal",
          },
          {
            id: "discipline-1",
          },
          {
            id: "discipline-2",
          },
          {
            id: "discipline-3",
          },
          {
            id: "discipline-4",
          },
          {
            id: "discipline-5",
          },
          {
            id: "discipline-6",
          },
          {
            id: "discipline-7",
          },
        ].map((stat) => {
          return (
            <StatCard
              key={stat.id}
              title={
                stat.title ?? (
                  <span className="inline-block bg-gray-200 rounded w-18 h-4.25 animate-pulse" />
                )
              }
            >
              <span className="inline-block bg-gray-200 rounded w-15.5 h-6 animate-pulse" />
            </StatCard>
          );
        })}
      </div>
      <div className="bg-gray-200 mt-12 rounded w-full h-80 animate-pulse" />
    </>
  );
}

export function CertificatesPerDiscipline(
  props: CertificatesPerDisciplineProps,
) {
  return (
    <Suspense fallback={<CertificatesPerDisciplineFallback />}>
      <CertificatesPerDisciplineContent {...props} />
    </Suspense>
  );
}
