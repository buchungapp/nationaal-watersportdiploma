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
import { listPvbsForPersonAsLeercoach } from "~/lib/nwd";
import { LeercoachBulkActions } from "./leercoach-bulk-actions";

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
  leercoach?: {
    id: string;
    firstName: string | null;
    lastNamePrefix: string | null;
    lastName: string | null;
    status?: "gevraagd" | "gegeven" | "geweigerd";
  };
  kerntaakOnderdelen: Array<{ id: string }>;
};

async function LeercoachContent({
  personId,
  handle,
}: {
  personId: string;
  handle: string;
}) {
  const pvbs = (await listPvbsForPersonAsLeercoach(personId)) as PvbListItem[];

  // Filter PvBs that need leercoach permission
  const pvbsNeedingPermission = pvbs.filter(
    (pvb) =>
      pvb.status === "wacht_op_voorwaarden" &&
      pvb.leercoach?.status === "gevraagd",
  );

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
            d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5"
          />
        </svg>
        <Text className="mt-1.5 text-sm text-gray-600 dark:text-gray-400">
          Geen PvB aanvragen als leercoach
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
    <div>
      {pvbsNeedingPermission.length > 0 && (
        <LeercoachBulkActions
          pvbsNeedingPermission={pvbsNeedingPermission}
          personId={personId}
        />
      )}

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHead>
            <TableRow>
              <TableHeader>Aanvraag</TableHeader>
              <TableHeader>Kandidaat</TableHeader>
              <TableHeader>Locatie</TableHeader>
              <TableHeader>Status</TableHeader>
              <TableHeader>Toestemming</TableHeader>
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
                    {pvb.leercoach?.status && (
                      <Badge
                        color={
                          pvb.leercoach.status === "gegeven"
                            ? "green"
                            : pvb.leercoach.status === "gevraagd"
                              ? "yellow"
                              : "red"
                        }
                      >
                        {pvb.leercoach.status === "gegeven"
                          ? "Gegeven"
                          : pvb.leercoach.status === "gevraagd"
                            ? "Gevraagd"
                            : "Geweigerd"}
                      </Badge>
                    )}
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
    </div>
  );
}

export function LeercoachTab({
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
      {personPromise.then(async (person) => (
        <LeercoachContent personId={person.id} handle={person.handle} />
      ))}
    </Suspense>
  );
}

export async function fetchLeercoachPvbs(personId: string) {
  return listPvbsForPersonAsLeercoach(personId);
}
