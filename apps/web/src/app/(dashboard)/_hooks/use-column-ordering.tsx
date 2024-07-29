import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "nuqs";
import React, { useMemo } from "react";
import type { Optional } from "~/types/optional";

interface OrderableColumn {
  id: string;
  isDefaultVisible?: boolean;
}

const parseAsColumnVisibility = (validColumnKeys: string[]) => {
  return createParser<Record<string, boolean>>({
    parse(queryValue) {
      const columnKeys = queryValue.split(",");
      const actualColumnKeys = columnKeys.filter((key) =>
        validColumnKeys.includes(key),
      );
      if (actualColumnKeys.length < 1) return null;

      return validColumnKeys.reduce<Record<string, boolean>>((acc, key) => {
        acc[key] = columnKeys.includes(key);
        return acc;
      }, {});
    },
    serialize(value) {
      return validColumnKeys.filter((key) => value[key] !== false).join(",");
    },
  });
};

export function getOrderableColumnIds({
  columns,
  excludeColumns,
}: {
  columns: Optional<OrderableColumn, "id">[];
  excludeColumns?: string[];
}) {
  return columns.filter(
    (c): c is typeof c & { id: string } =>
      !!c.id && !excludeColumns?.includes(c.id),
  );
}

export function useColumnOrdering(orderableColumns: OrderableColumn[]) {
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

  const options = useMemo(
    () => ({
      state: {
        columnOrder,
        columnVisibility,
      },
      onColumnOrderChange: setColumnOrder,
      onColumnVisibilityChange: setColumnVisibility,
    }),
    [
      JSON.stringify(columnOrder),
      JSON.stringify(columnVisibility),
      setColumnOrder,
      setColumnVisibility,
    ],
  );

  return options;
}
