import type { SortingState } from "@tanstack/react-table";
import { createParser, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { Optional } from "~/types/optional";

interface SortableColumn {
  id: string;
  enableSorting?: boolean;
}

const parseAsSorting = (validSortingKeys: string[]) => {
  return createParser<SortingState>({
    parse(queryValue) {
      const sorting = queryValue.split(",");
      const sortingState = sorting.map((sort) => {
        const [id, direction] = sort.split(".");

        return {
          id,
          desc: direction === "za",
        };
      });

      return sortingState.filter(
        (sort) => sort.id && validSortingKeys.includes(sort.id),
      ) as SortingState;
    },
    serialize(value) {
      return value
        .map((sort) => `${sort.id}.${sort.desc ? "za" : "az"}`)
        .join(",");
    },
  });
};

export function getSortableColumnIds(
  columns: Optional<SortableColumn, "id">[],
) {
  return columns
    .filter(
      (c): c is typeof c & { id: string } =>
        !!c.id && c.enableSorting !== false,
    )
    .map((c) => c.id);
}

export function useSorting({
  sortableColumnIds,
  defaultSorting = [],
}: {
  sortableColumnIds: SortableColumn["id"][];
  defaultSorting?: SortingState;
}) {
  const [sorting, setSorting] = useQueryState<SortingState>(
    "sorteer",
    parseAsSorting(sortableColumnIds)
      .withOptions({
        clearOnDefault: false,
        shallow: false,
      })
      .withDefault(defaultSorting),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const options = useMemo(
    () => ({
      state: {
        sorting,
      },
      onSortingChange: setSorting,
    }),
    [JSON.stringify(sorting), setSorting],
  );

  return options;
}
