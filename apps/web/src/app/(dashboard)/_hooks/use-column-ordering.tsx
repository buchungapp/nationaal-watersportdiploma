import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";

export function useColumnOrdering<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
) {
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    columns.filter((column) => !!column.id).map((column) => column.id!),
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
