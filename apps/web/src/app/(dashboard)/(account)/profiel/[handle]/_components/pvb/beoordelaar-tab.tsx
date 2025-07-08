import type { User } from "@nawadi/core";
import dayjs from "dayjs";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import { Text } from "~/app/(dashboard)/_components/text";
import type { listPvbsForPersonAsBeoordelaar } from "~/lib/nwd";

const statusColors = {
  concept: "zinc",
  wacht_op_voorwaarden: "yellow",
  gereed_voor_beoordeling: "blue",
  in_beoordeling: "blue",
  afgerond: "green",
  ingetrokken: "red",
  afgebroken: "red",
} as const;

const statusLabels = {
  concept: "Concept",
  wacht_op_voorwaarden: "Wacht op voorwaarden",
  gereed_voor_beoordeling: "Gereed voor beoordeling",
  in_beoordeling: "In beoordeling",
  afgerond: "Afgerond",
  ingetrokken: "Ingetrokken",
  afgebroken: "Afgebroken",
} as const;

async function BeoordelaarContent({
  personPromise,
  beoordelaarPvbsPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
  beoordelaarPvbsPromise: ReturnType<typeof listPvbsForPersonAsBeoordelaar>;
}) {
  const [person, pvbs] = await Promise.all([
    personPromise,
    beoordelaarPvbsPromise,
  ]);

  if (pvbs.length === 0) {
    return (
      <div className="text-center py-6">
        <svg
          className="mx-auto h-10 w-10 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth="1.5"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.35 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m8.9-4.414c.376.023.75.05 1.124.08 1.131.094 1.976 1.057 1.976 2.192V16.5A2.25 2.25 0 0118 18.75h-2.25m-7.5-10.5H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V18.75m-7.5-10.5h6.375c.621 0 1.125.504 1.125 1.125v9.375m-8.25-3l1.5 1.5 3-3.75"
          />
        </svg>
        <Text className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          Geen PvB aanvragen als beoordelaar
        </Text>
      </div>
    );
  }

  const formatName = (person: {
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
  }) => {
    const parts = [
      person.firstName,
      person.lastNamePrefix,
      person.lastName,
    ].filter(Boolean);
    return parts.join(" ") || "Onbekend";
  };

  // Sort PvBs by last status change (most recent first)
  const sortedPvbs = [...pvbs].sort(
    (a, b) =>
      dayjs(b.lastStatusChange).valueOf() - dayjs(a.lastStatusChange).valueOf(),
  );

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-full">
        <TableHead>
          <TableRow>
            <TableHeader>Aanvraag</TableHeader>
            <TableHeader>Kandidaat</TableHeader>
            <TableHeader>Locatie</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Onderdelen</TableHeader>
            <TableHeader>Laatst gewijzigd</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPvbs.map((pvb) => {
            // Count onderdelen where this person is beoordelaar
            const onderdelenCount = pvb.kerntaakOnderdelen.filter(
              (onderdeel) => onderdeel.beoordelaar?.id === person.id,
            ).length;

            return (
              <TableRow
                key={pvb.id}
                href={`/profiel/${person.handle}/pvb-aanvraag/${pvb.handle}`}
                className="group"
              >
                <TableCell className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  {pvb.handle}

                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {pvb.type === "intern" ? "Intern" : "Extern"}
                  </div>
                </TableCell>
                <TableCell>{formatName(pvb.kandidaat)}</TableCell>
                <TableCell>{pvb.locatie?.name || "Onbekend"}</TableCell>
                <TableCell>
                  <Badge
                    color={
                      statusColors[pvb.status as keyof typeof statusColors]
                    }
                  >
                    {statusLabels[pvb.status as keyof typeof statusLabels]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {onderdelenCount}{" "}
                    {onderdelenCount === 1 ? "onderdeel" : "onderdelen"}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                  {dayjs(pvb.lastStatusChange).format("DD-MM-YYYY HH:mm")}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

export function BeoordelaarTab({
  personPromise,
  beoordelaarPvbsPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
  beoordelaarPvbsPromise: ReturnType<typeof listPvbsForPersonAsBeoordelaar>;
}) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full mb-4" />
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      }
    >
      <BeoordelaarContent
        personPromise={personPromise}
        beoordelaarPvbsPromise={beoordelaarPvbsPromise}
      />
    </Suspense>
  );
}
