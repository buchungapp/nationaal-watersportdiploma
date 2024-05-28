import { BarChart } from "@tremor/react";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import {
  listCertificates,
  listPersonsForLocation,
  retrieveLocationByHandle,
} from "~/lib/nwd";

dayjs.extend(weekOfYear);

export default async function Page({
  params,
}: Readonly<{
  params: {
    location: string;
  };
}>) {
  const location = await retrieveLocationByHandle(params.location);

  const [persons, certificates] = await Promise.all([
    listPersonsForLocation(location.id),
    listCertificates(location.id).then((certificates) => {
      return certificates
        .filter((certificate) => !!certificate.issuedAt)
        .sort((a, b) => dayjs(a.issuedAt).diff(dayjs(b.issuedAt)));
    }),
  ]);

  const certificatesPerWeek = Object.values(
    certificates.reduce(
      (acc, certificate) => {
        const week = dayjs(certificate.issuedAt).week();

        if (!acc[week]) {
          acc[week] = {
            week: `Week ${week}`,
            weekStart: dayjs(certificate.issuedAt)
              .startOf("week")
              .toISOString(),
            weekEnd: dayjs(certificate.issuedAt).endOf("week").toISOString(),
            count: 0,
            certificates: [],
          };
        }

        acc[week]!.certificates.push(certificate);
        acc[week]!.count += 1;

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
        }
      >,
    ),
  );

  return (
    <>
      <Heading>Inzichten</Heading>

      <div className="mt-8">
        <Subheading>Personen</Subheading>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {[
          {
            id: "students",
            title: "Cursisten",
            count: persons.filter((person) =>
              person.actors.some((actor) => actor.type === "student"),
            ).length,
          },
          {
            id: "instructors",
            title: "Instructeurs",
            count: persons.filter((person) =>
              person.actors.some((actor) => actor.type === "instructor"),
            ).length,
          },
          {
            id: "admins",
            title: "Locatiebeheerders",
            count: persons.filter((person) =>
              person.actors.some((actor) => actor.type === "location_admin"),
            ).length,
          },
        ].map((stat) => {
          return (
            <div key={stat.id}>
              <Divider />
              <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">
                {stat.title}
              </div>
              <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8 tabular-nums">
                {stat.count}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-16">
        <Subheading>Diploma's</Subheading>
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-3">
        {[
          {
            id: "year",
            title: "Dit jaar",
            count: certificates.length,
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
              <div className="mt-6 text-lg/6 font-medium sm:text-sm/6">
                {stat.title}
              </div>
              <div className="mt-3 text-3xl/8 font-semibold sm:text-2xl/8 tabular-nums">
                {stat.count}
              </div>
            </div>
          );
        })}
      </div>

      <BarChart
        data={certificatesPerWeek}
        index="week"
        categories={["count"]}
        colors={["slate"]}
        yAxisWidth={30}
        showLegend={false}
        className="mt-12 h-72"
      />
    </>
  );
}
