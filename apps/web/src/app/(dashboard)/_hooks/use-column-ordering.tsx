import type { ColumnDef } from "@tanstack/react-table";
import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "nuqs";
import React from "react";

type OrderableColumn<TData, TValue> = ColumnDef<TData, TValue> & {
  id: string;
};

const parseAsColumnVisibility = (validColumnKeys: string[]) => {
  return createParser<Record<string, boolean>>({
    parse(queryValue) {
      const colomnKeys = queryValue.split(",");
      const actualColumnKeys = colomnKeys.filter((key) =>
        validColumnKeys.includes(key),
      );
      if (actualColumnKeys.length < 1) return null;

      return validColumnKeys.reduce<Record<string, boolean>>((acc, key) => {
        acc[key] = colomnKeys.includes(key);
        return acc;
      }, {});
    },
    serialize(value) {
      return validColumnKeys.filter((key) => value[key] !== false).join(",");
    },
  });
};

export function useColumnOrdering<TData, TValue>(
  orderableColumns: OrderableColumn<TData, TValue>[],
) {
  const defaultOrder = React.useMemo(
    () => orderableColumns.map((column) => column.id),
    [orderableColumns],
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
    [orderableColumns],
  );

  const [columnOrder, setColumnOrder] = useQueryState(
    "volgorde",
    parseAsArrayOf(parseAsString).withDefault(defaultOrder),
  );

  const [columnVisibility, setColumnVisibility] = useQueryState(
    "toon",
    parseAsColumnVisibility(defaultOrder).withDefault(defaultVisibility),
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
