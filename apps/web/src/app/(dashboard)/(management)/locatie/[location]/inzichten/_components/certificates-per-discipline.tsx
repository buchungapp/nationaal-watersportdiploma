import { createLoader, parseAsIsoDate } from "nuqs/server";
import { Suspense } from "react";
import { BarChart } from "~/app/(dashboard)/_components/charts/bar-chart";
import dayjs from "~/lib/dayjs";
import {
  listCertificates,
  listDisciplines,
  retrieveLocationByHandle,
} from "~/lib/nwd";
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
  const location = await retrieveLocationByHandle(params.location);

  const [certificates, disciplines] = await Promise.all([
    listCertificates(location.id).then((certificates) => {
      return certificates
        .filter((certificate) => !!certificate.issuedAt)
        .sort((a, b) => dayjs(a.issuedAt).diff(dayjs(b.issuedAt)));
    }),
    listDisciplines(),
  ]);

  const filteredCertificates = certificates.filter((certificate) => {
    return dayjs(certificate.issuedAt).isBetween(
      searchParams.from ?? dayjs().startOf("year").toDate(),
      searchParams.to ?? dayjs().endOf("year").toDate(),
      "day",
    );
  });

  const certificatesPerWeek = Object.values(
    filteredCertificates.reduce(
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
          certificate.program.course.discipline.title!
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

  const certificatesPerDiscipline = disciplines.map((discipline) => {
    return {
      id: discipline.handle,
      title: discipline.title,
      count: filteredCertificates.filter(
        (certificate) =>
          certificate.program.course.discipline.title === discipline.title,
      ).length,
    };
  });

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
        <BarChart
          data={certificatesPerWeek}
          index="week"
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
          colors={["blue", "violet", "fuchsia", "cyan"]}
          yAxisWidth={60}
          showLegend={false}
          type="stacked"
          className="mt-12 h-72"
        />
      ) : null}
    </>
  );
}

export function CertificatesPerDisciplineFallback() {
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

export function CertificatesPerDiscipline(
  props: CertificatesPerDisciplineProps,
) {
  return (
    <Suspense fallback={<CertificatesPerDisciplineFallback />}>
      <CertificatesPerDisciplineContent {...props} />
    </Suspense>
  );
}
