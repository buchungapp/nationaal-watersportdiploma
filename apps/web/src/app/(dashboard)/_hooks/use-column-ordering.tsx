import type { ColumnOrderState, VisibilityState } from "@tanstack/react-table";
import {
  createParser,
  parseAsArrayOf,
  parseAsString,
  useQueryState,
} from "nuqs";
import { usePostHog } from "posthog-js/react";
import React, { useCallback, useMemo } from "react";
import { Optional } from "~/types/optional";

interface OrderableColumn {
  id: string;
  isDefaultVisible?: boolean;
}

const parseAsColumnVisibility = (validColumnKeys: string[]) => {
  return createParser<VisibilityState>({
    parse(queryValue) {
      const columnKeys = queryValue.split(",");
      const actualColumnKeys = columnKeys.filter((key) =>
        validColumnKeys.includes(key),
      );
      if (actualColumnKeys.length < 1) return null;

      return validColumnKeys.reduce<VisibilityState>((acc, key) => {
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
  const posthog = usePostHog();
      
  const defaultOrder = React.useMemo(
    () => orderableColumns.map((column) => column.id),
    [orderableColumns],
  );

  const defaultVisibility = React.useMemo(
    () =>
      orderableColumns.reduce(
        (
          acc: VisibilityState,
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

  const [columnOrder, setColumnOrder] = useQueryState<ColumnOrderState>(
    "volgorde",
    parseAsArrayOf(parseAsString).withDefault(defaultOrder),
  );

  const [columnVisibility, setColumnVisibility] =
    useQueryState<VisibilityState>(
      "toon",
      parseAsColumnVisibility(defaultOrder).withDefault(defaultVisibility),
    );

  const onColumnVisibilityChange = useCallback(
    (updater: VisibilityState | ((old: VisibilityState) => VisibilityState)) =>
      setColumnVisibility((columnVisibility) => {
        const newVisibility =
          typeof updater === "function" ? updater(columnVisibility) : updater;

        posthog.capture("Column Visibility Changed", {
          columns: newVisibility,
        });

        return newVisibility;
      }),
    [setColumnVisibility, posthog],
  );

  const options = useMemo(
    () => ({
      state: {
        columnOrder,
        columnVisibility,
      },
      onColumnOrderChange: setColumnOrder,
      onColumnVisibilityChange
    }),
    [
      JSON.stringify(columnOrder),
      JSON.stringify(columnVisibility),
      setColumnOrder,
      onColumnVisibilityChange
    ],
  );

  return options;
}
