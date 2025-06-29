"use client";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";
import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import { TableSelection } from "~/app/(dashboard)/_components/table-action";
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
import type { listPvbs } from "~/lib/nwd";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>[number];

const columnHelper = createColumnHelper<PvbAanvraag>();

const columns = [
  columnHelper.display({
    id: "select",
    cell: ({ row }) => (
      <CheckboxField>
        <Checkbox
          {...{
            checked: row.getIsSelected(),
            disabled: !row.getCanSelect(),
            indeterminate: row.getIsSomeSelected(),
            onChange: row.getToggleSelectedHandler(),
          }}
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    header: ({ table }) => (
      <CheckboxField>
        <Checkbox
          {...{
            disabled: false,
            checked:
              table.getIsSomePageRowsSelected() ||
              table.getIsAllPageRowsSelected(),
            indeterminate: !table.getIsAllPageRowsSelected(),
            onChange: (checked) => table.toggleAllPageRowsSelected(checked),
          }}
          className="-translate-y-[1px]"
        />
      </CheckboxField>
    ),
    enableSorting: false,
  }),
  columnHelper.accessor("handle", {
    header: "ID",
    cell: ({ getValue }) => <Code>{getValue()}</Code>,
  }),
  columnHelper.accessor(
    (data) =>
      [
        data.kandidaat.firstName,
        data.kandidaat.lastNamePrefix,
        data.kandidaat.lastName,
      ]
        .filter(Boolean)
        .join(" "),
    {
      header: "Kandidaat",
      cell: ({ getValue }) => (
        <span className="font-medium text-zinc-950">{getValue()}</span>
      ),
    },
  ),
  columnHelper.accessor("type", {
    header: "Type",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <span className="capitalize">{getValue()}</span>,
  }),
  columnHelper.accessor("opmerkingen", {
    header: "Opmerkingen",
    cell: ({ getValue }) => {
      const opmerkingen = getValue();
      return opmerkingen ? (
        <span className="text-zinc-700 truncate max-w-xs">{opmerkingen}</span>
      ) : (
        <span className="text-zinc-400">-</span>
      );
    },
  }),
];

export default function PvbTable({
  pvbs,
  totalItems,
  placeholderRows,
}: {
  pvbs: PvbAanvraag[];
  totalItems: number;
  placeholderRows?: number;
}) {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    data: pvbs,
    columns,
    enableRowSelection: true,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      rowSelection,
    },
  });

  const selectedRows = Object.keys(rowSelection).length;

  return (
    <div className="relative mt-8">
      <Table
        dense
        className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>Geen items gevonden</NoTableRows>
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
        <TableRowSelection
          table={table}
          rowSelection={rowSelection}
          totalItems={totalItems}
        />
        <TablePagination totalItems={totalItems} />
      </TableFooter>

      <TableSelection
        selectedRows={selectedRows}
        clearRowSelection={() => setRowSelection({})}
      >
        {/* Future: Add action buttons for bulk operations */}
      </TableSelection>
    </div>
  );
}
