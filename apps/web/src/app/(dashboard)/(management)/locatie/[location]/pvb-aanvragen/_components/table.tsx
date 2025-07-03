"use client";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
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
import { PvbBulkActions } from "./pvb-bulk-actions";

type PvbAanvraag = Awaited<ReturnType<typeof listPvbs>>["items"][number];

const columnHelper = createColumnHelper<PvbAanvraag>();

function StatusBadge({ status }: { status: string }) {
  const variants = {
    concept: { color: "zinc" as const, label: "Concept" },
    wacht_op_voorwaarden: {
      color: "amber" as const,
      label: "Wacht op voorwaarden",
    },
    gepland: { color: "blue" as const, label: "Gepland" },
    uitgevoerd: { color: "purple" as const, label: "Uitgevoerd" },
    geslaagd: { color: "emerald" as const, label: "Geslaagd" },
    gezakt: { color: "red" as const, label: "Gezakt" },
    geannuleerd: { color: "gray" as const, label: "Geannuleerd" },
  };

  const variant = variants[status as keyof typeof variants] || variants.concept;

  return <Badge color={variant.color}>{variant.label}</Badge>;
}

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
    cell: ({ getValue }) => (
      <span className="capitalize">{getValue().replace(/_/g, " ")}</span>
    ),
  }),
  columnHelper.accessor("status", {
    header: "Status",
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  columnHelper.accessor(
    (data) =>
      data.leercoach
        ? [
            data.leercoach.firstName,
            data.leercoach.lastNamePrefix,
            data.leercoach.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : null,
    {
      header: "Leercoach",
      cell: ({ getValue }) => {
        const name = getValue();
        return name ? (
          <span className="text-zinc-700">{name}</span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      },
    },
  ),
  columnHelper.accessor(
    (data) =>
      data.beoordelaar
        ? [
            data.beoordelaar.firstName,
            data.beoordelaar.lastNamePrefix,
            data.beoordelaar.lastName,
          ]
            .filter(Boolean)
            .join(" ")
        : null,
    {
      header: "Beoordelaar",
      cell: ({ getValue }) => {
        const name = getValue();
        return name ? (
          <span className="text-zinc-700">{name}</span>
        ) : (
          <span className="text-zinc-400">-</span>
        );
      },
    },
  ),
  columnHelper.accessor("kwalificatieprofielen", {
    header: "Kwalificatieprofielen",
    cell: ({ getValue }) => {
      const profielen = getValue() || [];
      if (profielen.length === 0) {
        return <span className="text-zinc-400">-</span>;
      }
      return (
        <div className="max-w-xs">
          <span className="text-zinc-700 truncate">{profielen.join(", ")}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor((data) => data.hoofdcursus?.program?.title || null, {
    header: "Hoofdcursus",
    cell: ({ getValue }) => {
      const cursus = getValue();
      return cursus ? (
        <span className="text-zinc-700">{cursus}</span>
      ) : (
        <span className="text-zinc-400">-</span>
      );
    },
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
  const selectedIds = Object.keys(rowSelection);

  return (
    <div className="relative mt-8">
      <Table
        dense
        className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
      >
        <DefaultTableHead table={table} />
        <TableBody>
          <PlaceholderTableRows table={table} rows={placeholderRows}>
            <NoTableRows table={table}>Geen PvB-aanvragen gevonden</NoTableRows>
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
        <PvbBulkActions
          selectedIds={selectedIds}
          selectedPvbs={pvbs.filter((pvb) => selectedIds.includes(pvb.id))}
          onComplete={() => setRowSelection({})}
        />
      </TableSelection>
    </div>
  );
}
