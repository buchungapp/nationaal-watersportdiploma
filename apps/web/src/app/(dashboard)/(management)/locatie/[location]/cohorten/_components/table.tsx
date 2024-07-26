"use client";
import { closestCenter, DndContext, DragEndEvent } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import {
  horizontalListSortingStrategy,
  SortableContext,
} from "@dnd-kit/sortable";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import clsx from "clsx";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableDisplay,
  TableHead,
  TableHeader,
  TableRow,
  updateColumnOrder,
} from "~/app/(dashboard)/_components/table";
import {
  TableFooter,
  TablePagination,
  TableRowSelection,
} from "~/app/(dashboard)/_components/table-footer";
import { useCustomSensors } from "~/app/(dashboard)/_hooks/custom-sensors";
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
  // For column ordering
  // NOTE: We need to replace `.` with `_` because `.` is not a valid key in React Table.
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns
      .map((column) => column.accessorKey)
      .map((column) => column.replace(/\./g, "_")),
  );

  // For column ordering
  const [columnVisibility, setColumnVisibility] = useState<
    Record<string, boolean>
  >(
    columns.reduce(
      (
        acc: Record<string, boolean>,
        column: {
          id?: string;
          isDefaultVisible?: boolean;
        },
      ) => {
        if (column.id !== undefined && column.isDefaultVisible !== undefined) {
          acc[column.id] = column.isDefaultVisible;
        }
        return acc;
      },
      {},
    ),
  );

  const table = useReactTable({
    data: cohorts,
    columns,
    state: {
      columnOrder, // For column ordering
      columnVisibility, // For column ordering
    },
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnOrderChange: setColumnOrder, // For column ordering
    onColumnVisibilityChange: setColumnVisibility, // For column ordering
  });

  const sensors = useCustomSensors(); // For column ordering

  // For column ordering
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active && over && active.id !== over.id) {
      const newColumnOrder = updateColumnOrder(
        columnOrder,
        active.id as string,
        over.id as string,
      );

      setColumnOrder(newColumnOrder);
    }
  }

  const params = useParams();

  return (
    <>
      {/* For column ordering */}
      <DndContext
        collisionDetection={closestCenter}
        modifiers={[restrictToHorizontalAxis]}
        onDragEnd={(event) => handleDragEnd(event)}
        sensors={sensors}
      >
        {/* For column ordering */}
        <div className="mt-8 flex justify-end items-center gap-1">
          <TableDisplay
            table={table}
            columnOrder={columnOrder}
            setColumnOrder={setColumnOrder}
          />
        </div>
        <Table
          className="mt-1 [--gutter:theme(spacing.6)] lg:[--gutter:theme(spacing.10)]"
          dense
        >
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {/* For column ordering */}
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
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
                </SortableContext>
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
                {/* For column ordering */}
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
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
                        <div className="absolute inset-y-0 left-0 w-0.5 bg-branding-light" />
                      )}
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </SortableContext>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DndContext>

      <TableFooter>
        <TableRowSelection table={table} totalItems={totalItems} />
        <TablePagination totalItems={totalItems} />
      </TableFooter>
    </>
  );
}
