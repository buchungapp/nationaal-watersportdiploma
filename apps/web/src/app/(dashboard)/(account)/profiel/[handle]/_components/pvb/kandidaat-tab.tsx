import type { User } from "@nawadi/core";
import dayjs from "dayjs";
import Link from "next/link";
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
import { listPvbsForPersonAsKandidaat } from "~/lib/nwd";

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

type PvbListItem = {
  id: string;
  handle: string;
  status:
    | "concept"
    | "wacht_op_voorwaarden"
    | "gereed_voor_beoordeling"
    | "in_beoordeling"
    | "afgerond"
    | "ingetrokken"
    | "afgebroken";
  type: "intern" | "extern";
  lastStatusChange: string;
  locatie?: { id: string; name: string };
  kandidaat: {
    id: string;
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
  };
  kerntaakOnderdelen: Array<{ id: string }>;
};

async function KandidaatContent({
  personId,
  handle,
}: {
  personId: string;
  handle: string;
}) {
  const pvbs = (await listPvbsForPersonAsKandidaat(personId)) as PvbListItem[];

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
            d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
          />
        </svg>
        <Text className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          Geen PvB aanvragen als kandidaat
        </Text>
      </div>
    );
  }

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
            <TableHeader>Locatie</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Laatst gewijzigd</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedPvbs.map((pvb) => {
            return (
              <TableRow key={pvb.id}>
                <TableCell>
                  <Link
                    href={`/profiel/${handle}/pvb-aanvraag/${pvb.handle}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400"
                  >
                    {pvb.handle}
                  </Link>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {pvb.type === "intern" ? "Intern" : "Extern"}
                  </div>
                </TableCell>
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

export function KandidaatTab({
  personPromise,
}: {
  personPromise: Promise<User.Person.$schema.Person>;
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
      {personPromise.then((person) => (
        <KandidaatContent personId={person.id} handle={person.handle} />
      ))}
    </Suspense>
  );
}

export async function fetchKandidaatPvbs(personId: string) {
  return listPvbsForPersonAsKandidaat(personId);
}
