"use client";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useParams } from "next/navigation";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
import { Code } from "~/app/(dashboard)/_components/text";
import dayjs from "~/lib/dayjs";
import type { listPersonsForLocationWithPagination } from "~/lib/nwd";
import PersonRoleBadge from "../../_components/person-role-badge";
type Person = Awaited<
  ReturnType<typeof listPersonsForLocationWithPagination>
>["items"][number];

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
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
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
      return (
        <div className="flex items-center gap-x-2">
          {getValue().map((actor) => (
            <PersonRoleBadge key={actor.id} role={actor.type} />
          ))}
        </div>
      );
    },
  }),
];

export default function PersonsTable({
  persons,
  totalItems,
}: {
  persons: Awaited<
    ReturnType<typeof listPersonsForLocationWithPagination>
  >["items"];
  totalItems: number;
}) {
  const params = useParams();

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
          <NoTableRows table={table}>Geen items gevonden</NoTableRows>
          <DefaultTableRows
            table={table}
            href={(row) =>
              `/locatie/${params.location as string}/personen/${row.original.id}`
            }
          >
            {(cell, index, row) => (
              <DefaultTableCell
                key={cell.id}
                cell={cell}
                index={index}
                row={row}
              />
            )}
          </DefaultTableRows>
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
