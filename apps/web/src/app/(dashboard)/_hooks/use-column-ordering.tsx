import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

type ExtendedColumnDef<TData, TValue> = ColumnDef<TData, TValue> & {
  accessorKey: string;
};

export function useColumnOrdering<TData, TValue>({
  columns,
}: {
  columns: ExtendedColumnDef<TData, TValue>[];
}) {
  // NOTE: We need to replace `.` with `_` because `.` is not a valid key in React Table.
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns
      .map((column) => column.accessorKey)
      .map((column) => column.replace(/\./g, "_")),
  );

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

  const options = {
    state: {
      columnOrder,
      columnVisibility,
    },
    onColumnOrderChange: setColumnOrder,
    onColumnVisibilityChange: setColumnVisibility,
  };

  return options;
}
