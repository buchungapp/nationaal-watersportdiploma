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
import dayjs from "~/lib/dayjs";

import { Table, TableBody } from "~/app/(dashboard)/_components/table";
import { TableSelection } from "~/app/(dashboard)/_components/table-action";
import {
  DefaultTableCell,
  DefaultTableRows,
  NoTableRows,
  PlaceholderTableRows,
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
  placeholderRows,
}: {
  logbooks: LogbookType[];
  personId: string;
  totalItems: number;
  placeholderRows?: number;
}) {
  const columnOrderingOptions = useColumnOrdering(
    getOrderableColumnIds({
      columns,
      excludeColumns: ["select"],
    }),
    "logbook",
  );

  const sortingOptions = useSorting({
    sortableColumnIds: getSortableColumnIds(columns),
    defaultSorting: [{ id: "startedAt", desc: false }],
    paramPrefix: "logbook",
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
          {placeholderRows && placeholderRows > 0 ? (
            <PlaceholderTableRows rows={placeholderRows} />
          ) : (
            <>
              <NoTableRows table={table}>
                Geen logboek regels gevonden.
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
            </>
          )}
        </TableBody>
      </Table>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} paramPrefix="logbook" />
      </TableFooter>

      <TableSelection
        selectedRows={selectedRows}
        clearRowSelection={() => setRowSelection({})}
      >
        <LogbookTableActionsButton
          rows={actionRows}
          personId={personId}
          clearRowSelection={() => setRowSelection({})}
        />
      </TableSelection>
    </>
  );
}
