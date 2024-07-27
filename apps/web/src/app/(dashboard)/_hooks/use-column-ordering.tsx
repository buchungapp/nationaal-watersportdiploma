import type { ColumnDef } from "@tanstack/react-table";
import {
  parseAsArrayOf,
  parseAsJson,
  parseAsString,
  useQueryState,
} from "nuqs";
import React from "react";

type OrderableColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  id: string;
};

export function useColumnOrdering<TData, TValue>(
  orderableColumns: OrderableColumn<TData, TValue>[],
) {
  const defaultOrder = React.useMemo(
    () => orderableColumns.map((column) => column.id),
    [],
  );
  const defaultVisibility = React.useMemo(
    () =>
      orderableColumns.reduce(
        (
          acc: Record<string, boolean>,
          column: {
            id?: string;
            isDefaultVisible?: boolean;
          },
        ) => {
          if (
            column.id !== undefined &&
            column.isDefaultVisible !== undefined
          ) {
            acc[column.id] = column.isDefaultVisible;
          }
          return acc;
        },
        {},
      ),
    [],
  );

  const [columnOrder, setColumnOrder] = useQueryState(
    "volgorde",
    parseAsArrayOf(parseAsString).withDefault(defaultOrder),
  );

  const [columnVisibility, setColumnVisibility] = useQueryState(
    "toon",
    parseAsJson().withDefault(defaultVisibility),
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
