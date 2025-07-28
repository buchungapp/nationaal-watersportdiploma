"use client";
import type { User } from "@nawadi/core";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
  PlaceholderTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import PersonRoleBadge from "../../../_components/person-role-badge";

type Person = Awaited<ReturnType<typeof User.Person.list>>["items"][number];

const columnHelper = createColumnHelper<Person>();

const columns = [
  columnHelper.accessor("handle", {
    header: "NWD-id",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
  columnHelper.accessor(
    (data) =>
      [data.firstName, data.lastNamePrefix, data.lastName]
        .filter(Boolean)
        .join(" "),
    {
      header: "Naam",
      cell: ({ getValue, row }) => (
        <Link
          href={`/secretariaat/instructeurs/${row.original.id}`}
          className="font-medium text-blue-600 hover:text-blue-800 dark:hover:text-blue-300 dark:text-blue-400"
        >
          {getValue()}
        </Link>
      ),
    },
  ),
  columnHelper.accessor("email", {
    header: "E-mailadres",
  }),
  columnHelper.accessor("dateOfBirth", {
    header: "Geboortedatum",
    cell: ({ getValue }) => {
      const dateOfBirth = getValue();
      return dateOfBirth ? (
        <span className="tabular-nums">
          {dayjs(dateOfBirth).format("DD-MM-YYYY")}
        </span>
      ) : null;
    },
  }),
  columnHelper.accessor("actors", {
    header: "Rollen",
    cell: ({ getValue }) => {
      const uniqueActorTypes = [
        ...new Set(getValue().map((actor) => actor.type)),
      ];

      return (
        <div className="flex items-center gap-x-2">
          {uniqueActorTypes.map((type) => (
            <PersonRoleBadge key={type} role={type} />
          ))}
        </div>
      );
    },
  }),
  columnHelper.accessor("actors", {
    id: "locations",
    header: "Locaties",
    cell: ({ getValue }) => {
      const uniqueLocationIds = [
        ...new Set(
          getValue()
            .filter((actor) => actor.locationId)
            .map((actor) => actor.locationId),
        ),
      ];

      return (
        <span className="text-gray-600 text-sm">
          {uniqueLocationIds.length} locatie
          {uniqueLocationIds.length !== 1 ? "s" : ""}
        </span>
      );
    },
  }),
];

export default function InstructeurTable({
  persons,
  totalItems,
  placeholderRows,
}: {
  persons: Person[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const table = useReactTable({
    data: persons,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Table
        className="mt-8 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>
              Geen instructeurs of beoordelaars gevonden
            </NoTableRows>
            <DefaultTableRows table={table}>
              {(cell, index, row) => (
                <DefaultTableCell
                  key={cell.id}
                  cell={cell}
                  index={index}
                  row={row}
                />
              )}
            </DefaultTableRows>
          </PlaceholderTableRows>
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
