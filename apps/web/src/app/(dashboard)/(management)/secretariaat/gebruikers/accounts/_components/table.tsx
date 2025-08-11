"use client";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
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
import type { listAccountsWithPagination } from "~/lib/nwd";

type Account = Awaited<
  ReturnType<typeof listAccountsWithPagination>
>["items"][number];
const columnHelper = createColumnHelper<Account>();

const columns = [
  columnHelper.accessor("email", {
    header: "E-mailadres",
  }),
  columnHelper.accessor("displayName", {
    header: "Naam",
  }),
];

export default function PersonsTable({
  accounts,
  totalItems,
  placeholderRows,
}: {
  accounts: Account[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const table = useReactTable({
    data: accounts,
    columns,
    getRowId: (row) => row.authUserId,
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
            <NoTableRows table={table}>Geen accounts gevonden</NoTableRows>
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
