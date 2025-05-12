import { Suspense } from "react";
import { BarChart } from "~/app/(dashboard)/_components/charts/bar-chart";
import { Divider } from "~/app/(dashboard)/_components/divider";
import dayjs from "~/lib/dayjs";
import {
  listCertificates,
  listDisciplines,
  retrieveLocationByHandle,
} from "~/lib/nwd";

type CertificatesProps = {
  params: Promise<{
    location: string;
  }>;
};

async function CertificatesContent(props: CertificatesProps) {
  const params = await props.params;
  const location = await retrieveLocationByHandle(params.location);

  const [certificates, disciplines] = await Promise.all([
    listCertificates(location.id).then((certificates) => {
      return certificates
        .filter((certificate) => !!certificate.issuedAt)
        .sort((a, b) => dayjs(a.issuedAt).diff(dayjs(b.issuedAt)));
    }),
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

  console.log(certificatesPerWeek);

  return (
    <>
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
            <div key={stat.id}>
              <Divider />
              <div className="mt-6 font-medium sm:text-sm/6 text-lg/6">
                {stat.title}
              </div>
              <div className="mt-3 font-semibold tabular-nums sm:text-2xl/8 text-3xl/8">
                {stat.count}
              </div>
            </div>
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
          <div key={stat.id}>
            <Divider />
            <div className="mt-6 font-medium sm:text-sm/6 text-lg/6">
              {stat.title}
            </div>
            <div className="mt-3 font-semibold tabular-nums sm:text-2xl/8 text-3xl/8">
              <span className="inline-block bg-gray-200 rounded w-15.5 h-6 animate-pulse" />
            </div>
          </div>
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
