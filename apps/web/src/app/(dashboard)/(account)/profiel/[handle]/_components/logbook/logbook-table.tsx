"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { clsx } from "clsx";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import {
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { TableFooter } from "~/app/(dashboard)/_components/table-footer";
import type { listLogbooksForPerson } from "~/lib/nwd";

export type LogbookType = Awaited<
  ReturnType<typeof listLogbooksForPerson>
>[number];

const columnHelper = createColumnHelper<LogbookType>();

const columns = [
  columnHelper.accessor("startedAt", {
    id: "startedAt",
    header: "Start datum",
    cell: ({ getValue }) => new Date(getValue()).toLocaleDateString("nl-NL"),
    sortingFn: "datetime",
  }),
  columnHelper.accessor("endedAt", {
    id: "endedAt",
    header: "Eind datum",
    cell: ({ getValue }) =>
      getValue()
        ? new Date(getValue() as string).toLocaleDateString("nl-NL")
        : "-",
    sortingFn: "datetime",
  }),
  columnHelper.accessor("departurePort", {
    id: "departurePort",
    header: "Vertrekhaven",
    cell: ({ getValue }) => getValue() || "-",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("arrivalPort", {
    id: "arrivalPort",
    header: "Aankomsthaven",
    cell: ({ getValue }) => getValue() || "-",
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("sailedNauticalMiles", {
    id: "sailedNauticalMiles",
    header: "Gevaren Nautisch mijlen",
    cell: ({ getValue }) => (getValue() ? `${getValue()} nm` : "-"),
    sortingFn: "alphanumeric",
  }),
  columnHelper.accessor("primaryRole", {
    id: "primaryRole",
    header: "Primaire rol",
    cell: ({ getValue }) => getValue() || "-",
    sortingFn: "alphanumeric",
  }),
];

export function LogbookTable({
  logbooks,
  totalItems,
}: {
  logbooks: LogbookType[];
  totalItems: number;
}) {
  const table = useReactTable({
    data: logbooks,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <>
      <Table
        className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHeader
                  key={header.id}
                  className={clsx(header.column.columnDef.meta?.align)}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext(),
                  )}
                </TableHeader>
              ))}
            </TableRow>
          ))}
        </TableHead>
        <TableBody>
          {table.getRowCount() <= 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center">
                Geen logboek regels gevonden.
              </TableCell>
            </TableRow>
          ) : null}
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className={clsx(
                row.getIsSelected()
                  ? "bg-zinc-950/[1.5%] dark:bg-zinc-950/[1.5%]"
                  : "",
              )}
              key={row.id}
              //   href={`/locatie/${params.location as string}/cohorten/${row.original.handle}`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
                  // suppressLinkBehavior={
                  //   cell.column.columnDef.meta?.suppressLinkBehavior
                  // }
                >
                  {index === 0 && row.getIsSelected() && (
                    <div className="left-0 absolute inset-y-0 bg-branding-light w-0.5" />
                  )}
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} paramPrefix="logbook" />
      </TableFooter>
    </>
  );
}
