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
  PlaceholderTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { DefaultTableHead } from "~/app/(dashboard)/_components/table-head";
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
  placeholderRows,
}: {
  cohorts: Awaited<ReturnType<typeof listCohortsForLocation>>;
  totalItems: number;
  placeholderRows?: number;
}) {
  const table = useReactTable({
    data: cohorts,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const params = useParams();

  return (
    <>
      <Table
        className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <DefaultTableHead table={table} />
        <TableBody>
          {placeholderRows && placeholderRows > 0 ? (
            <PlaceholderTableRows rows={placeholderRows} />
          ) : (
            <>
              <DefaultTableRows
                table={table}
                href={(row) =>
                  `/locatie/${params.location as string}/cohorten/${row.original.handle}`
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
            </>
          )}
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
