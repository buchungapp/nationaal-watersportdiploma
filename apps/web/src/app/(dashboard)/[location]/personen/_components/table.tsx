"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/app/(dashboard)/_components/table";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import type { listPersonsForLocation } from "~/lib/nwd";

type Person = Awaited<ReturnType<typeof listPersonsForLocation>>[number];

const columnHelper = createColumnHelper<Person>();

const columns = [
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
  columnHelper.accessor("dateOfBirth", {
    header: "Geboortedatum",
    cell: ({ getValue }) => {
      const dateOfBirth = getValue();
      return dateOfBirth ? dayjs(dateOfBirth).format("DD-MM-YYYY") : null;
    },
  }),
  columnHelper.accessor("birthCity", {
    header: "Geboorteplaats",
  }),
  columnHelper.accessor("actors", {
    header: "Niveau",
    cell: ({ getValue }) => {
      return getValue().map((actor) => (
        <span key={actor.id} className="block">
          {actor.type}
        </span>
      ));
    },
  }),
];

export default function PersonsTable({
  persons,
  totalItems,
}: {
  persons: Awaited<ReturnType<typeof listPersonsForLocation>>;
  totalItems: number;
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
      <Table className="mt-8">
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
          {table.getRowModel().rows.map((row) => (
            <TableRow
              className={clsx(
                row.getIsSelected()
                  ? "bg-zinc-950/[1.5%] dark:bg-zinc-950/[1.5%]"
                  : "",
              )}
              key={row.id}
              href={`#TODO`}
            >
              {row.getVisibleCells().map((cell, index) => (
                <TableCell
                  key={cell.id}
                  className={clsx(cell.column.columnDef.meta?.align)}
                  suppressLinkBehavior={
                    cell.column.columnDef.meta?.suppressLinkBehavior
                  }
                >
                  {index === 0 && row.getIsSelected() && (
                    <div className="absolute inset-y-0 left-0 w-0.5 bg-branding-light" />
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
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
