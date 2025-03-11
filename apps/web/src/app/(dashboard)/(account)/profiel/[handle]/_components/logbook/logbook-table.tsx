"use client";
import { XMarkIcon } from "@heroicons/react/16/solid";
import type { RowSelectionState } from "@tanstack/react-table";
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { useState } from "react";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  Checkbox,
  CheckboxField,
} from "~/app/(dashboard)/_components/checkbox";

import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
} from "~/app/(dashboard)/_components/table-content";
import {
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { TableFooter } from "~/app/(dashboard)/_components/table-footer";
import { SortableTableHead } from "~/app/(dashboard)/_components/table-head";
import {
  getOrderableColumnIds,
  useColumnOrdering,
} from "~/app/(dashboard)/_hooks/use-column-ordering";
import { useSorting } from "~/app/(dashboard)/_hooks/use-sorting";
import { getSortableColumnIds } from "~/app/(dashboard)/_hooks/use-sorting";
import type { listLogbooksForPerson } from "~/lib/nwd";
import { LogbookTableActionsButton } from "./logbook-table-actions";

export type LogbookType = Awaited<
  ReturnType<typeof listLogbooksForPerson>
>[number];

const columnHelper = createColumnHelper<LogbookType>();

const columns = [
  columnHelper.display({
    id: "select",
    cell: ({ row }) => (
      <CheckboxField className="relative">
        <span
          className="top-1/2 left-1/2 absolute size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2"
          aria-hidden="true"
        />
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
    header: ({ table }) => {
      return (
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
      );
    },
    enableSorting: false,
  }),
  columnHelper.accessor("startedAt", {
    id: "startedAt",
    header: "Start datum",
    cell: ({ getValue }) => {
      const dateTime = getValue();
      const hasTime =
        typeof dateTime === "string" && !dateTime.includes("T00:00:00");

      return dateTime ? (
        <time dateTime={dateTime}>
          {hasTime
            ? dayjs(dateTime).format("DD-MM-YYYY HH:mm")
            : dayjs(dateTime).format("DD-MM-YYYY")}
        </time>
      ) : (
        "-"
      );
    },
  }),
  columnHelper.accessor("endedAt", {
    id: "endedAt",
    header: "Eind datum",
    cell: ({ getValue }) => {
      const dateTime = getValue();
      const hasTime =
        typeof dateTime === "string" && !dateTime.includes("T00:00:00");

      return dateTime ? (
        <time dateTime={dateTime}>
          {hasTime
            ? dayjs(dateTime).format("DD-MM-YYYY HH:mm")
            : dayjs(dateTime).format("DD-MM-YYYY")}
        </time>
      ) : (
        "-"
      );
    },
  }),
  columnHelper.accessor("departurePort", {
    id: "departurePort",
    header: "Vertrekhaven",
    cell: ({ getValue }) => getValue() || "-",
  }),
  columnHelper.accessor("arrivalPort", {
    id: "arrivalPort",
    header: "Aankomsthaven",
    cell: ({ getValue }) => getValue() || "-",
  }),
  columnHelper.accessor("sailedNauticalMiles", {
    id: "sailedNauticalMiles",
    header: "Gevaren Nautisch mijlen",
    cell: ({ getValue }) => (getValue() ? `${getValue()} nm` : "-"),
  }),
  columnHelper.accessor("primaryRole", {
    id: "primaryRole",
    header: "Primaire rol",
    cell: ({ getValue }) => getValue() || "-",
  }),
];

export function LogbookTable({
  logbooks,
  personId,
  totalItems,
}: {
  logbooks: LogbookType[];
  personId: string;
  totalItems: number;
}) {
  const columnOrderingOptions = useColumnOrdering(
    getOrderableColumnIds({
      columns,
      excludeColumns: ["select"],
    }),
    "logboek",
  );

  const sortingOptions = useSorting({
    sortableColumnIds: getSortableColumnIds(columns),
    defaultSorting: [{ id: "startedAt", desc: false }],
    paramPrefix: "logboek",
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useReactTable({
    ...columnOrderingOptions,
    ...sortingOptions,
    data: logbooks,
    columns,
    getRowId: (row) => row.id,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      ...columnOrderingOptions.state,
      ...sortingOptions.state,
      rowSelection,
    },
    initialState: {
      columnPinning: {
        left: ["select"],
      },
    },
  });

  const selectedRows = Object.keys(rowSelection).length;
  const actionRows = logbooks.filter((logbook) => rowSelection[logbook.id]);

  return (
    <>
      <Table
        className="mt-4 [--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]"
        dense
      >
        <SortableTableHead table={table} />
        <TableBody>
          <NoTableRows table={table}>Geen logboek regels gevonden.</NoTableRows>
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
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} paramPrefix="logboek" />
      </TableFooter>

      <div
        className={clsx(
          "bottom-14 fixed inset-x-0 flex items-center space-x-2 bg-white dark:bg-slate-950 shadow-md mx-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg w-fit",
          selectedRows > 0 ? "" : "hidden",
        )}
      >
        <p className="text-sm select-none">
          <span className="bg-branding-light/10 px-2 py-1.5 rounded-sm font-medium tabular-nums text-branding-dark">
            {selectedRows}
          </span>
          <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
            geselecteerd
          </span>
        </p>
        <div className="flex items-center space-x-4">
          <Button plain onClick={() => setRowSelection({})}>
            <XMarkIcon />
          </Button>
          <LogbookTableActionsButton
            rows={actionRows}
            personId={personId}
            resetRowSelection={() => setRowSelection({})}
          />
        </div>
      </div>
    </>
  );
}
