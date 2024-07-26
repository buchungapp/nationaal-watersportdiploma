"use client";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useParams } from "next/navigation";
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
import {
  TableColumnOrderingContext,
  TableDisplay,
  TableOrderingContext,
} from "~/app/(dashboard)/_components/table-ordering";
import { useColumnOrdering } from "~/app/(dashboard)/_hooks/use-column-ordering";
import dayjs from "~/lib/dayjs";
import type { listCohortsForLocation } from "~/lib/nwd";

type Cohort = Awaited<ReturnType<typeof listCohortsForLocation>>[number];

const columnHelper = createColumnHelper<Cohort>();

const columns = [
  columnHelper.accessor("label", {
    header: "Naam",
    cell: ({ getValue }) => (
      <span className="font-medium text-zinc-950">{getValue()}</span>
    ),
  }),
  columnHelper.accessor("accessStartTime", {
    header: "Opent op",
    cell: ({ getValue }) => {
      const dateTime = getValue();

      return (
        <time dateTime={dateTime}>{dayjs(dateTime).format("DD-MM-YYYY")}</time>
      );
    },
  }),
  columnHelper.accessor("accessEndTime", {
    header: "Sluit op",
    cell: ({ getValue }) => {
      const dateTime = getValue();

      return (
        <time dateTime={dateTime}>{dayjs(dateTime).format("DD-MM-YYYY")}</time>
      );
    },
  }),
];

export default function CohortsTable({
  cohorts,
  totalItems,
}: {
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;
  totalItems: number;
}) {
  const columnOrderingOptions = useColumnOrdering(columns);

  const table = useReactTable({
    data: cohorts,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...columnOrderingOptions,
  });

  const params = useParams();

  return (
    <>
      <TableOrderingContext options={columnOrderingOptions}>
        <div className="mt-8 flex justify-end items-center gap-1">
          <TableDisplay table={table} />
        </div>
        <Table
          className="mt-1 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
          dense
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableColumnOrderingContext>
                  {headerGroup.headers.map((header) => (
                    <TableHeader
                      key={header.id}
                      header={header}
                      className={clsx(header.column.columnDef.meta?.align)}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                    </TableHeader>
                  ))}
                </TableColumnOrderingContext>
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowCount() <= 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Geen items gevonden
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
                href={`/locatie/${params.location as string}/cohorten/${row.original.handle}`}
              >
                {row.getVisibleCells().map((cell, index) => (
                  <TableColumnOrderingContext>
                    <TableCell
                      key={cell.id}
                      cell={cell}
                      className={clsx(cell.column.columnDef.meta?.align)}
                      // suppressLinkBehavior={
                      //   cell.column.columnDef.meta?.suppressLinkBehavior
                      // }
                    >
                      {index === 0 && row.getIsSelected() && (
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-branding-light" />
                      )}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  </TableColumnOrderingContext>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableOrderingContext>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
