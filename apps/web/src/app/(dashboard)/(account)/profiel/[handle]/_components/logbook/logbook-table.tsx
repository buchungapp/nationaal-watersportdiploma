"use client";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowsUpDownIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import type { RowSelectionState, SortDirection } from "@tanstack/react-table";
import {
  createColumnHelper,
  flexRender,
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
  );

  const sortingOptions = useSorting({
    sortableColumnIds: getSortableColumnIds(columns),
    defaultSorting: [{ id: "startedAt", desc: false }],
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
        <TableHead>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sortingHandler =
                  header.column.getToggleSortingHandler?.();
                const getAriaSortValue = (isSorted: false | SortDirection) => {
                  switch (isSorted) {
                    case "asc":
                      return "ascending";
                    case "desc":
                      return "descending";
                    default:
                      return "none";
                  }
                };

                return (
                  <TableHeader
                    key={header.id}
                    onClick={sortingHandler}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && sortingHandler) {
                        sortingHandler(event);
                      }
                    }}
                    className={clsx(
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : "",
                    )}
                    tabIndex={header.column.getCanSort() ? 0 : -1}
                    aria-sort={getAriaSortValue(header.column.getIsSorted())}
                  >
                    <div
                      className={clsx(
                        header.column.columnDef.enableSorting === false
                          ? header.column.columnDef.meta?.align
                          : "flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-900 px-3 py-1.5 -mx-3 -my-1.5",
                        "rounded-md",
                      )}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext(),
                      )}
                      {header.column.getCanSort() &&
                        (header.column.getIsSorted() === false ? (
                          <ArrowsUpDownIcon className="opacity-30 size-3 text-slate-900 dark:text-slate-50" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ArrowUpIcon
                            className="size-3 text-slate-900 dark:text-slate-50"
                            aria-hidden={true}
                          />
                        ) : (
                          <ArrowDownIcon
                            className="size-3 text-slate-900 dark:text-slate-50"
                            aria-hidden={true}
                          />
                        ))}
                    </div>
                  </TableHeader>
                );
              })}
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
