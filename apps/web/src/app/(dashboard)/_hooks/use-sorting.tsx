import type { SortingState } from "@tanstack/react-table";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useMemo } from "react";
import type { Optional } from "~/types/optional";

interface SortableColumn {
  id: string;
  enableSorting?: boolean;
}

function parseSorting(queryValue: string, validSortingKeys: string[]) {
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
}

function serializeSorting(value: SortingState | null) {
  if (!value) return "";
  return value.map((sort) => `${sort.id}.${sort.desc ? "za" : "az"}`).join(",");
}

// TODO: using the parseAsSorting function, causes an infinite loop with tanstack table, this work around is not nice
// const parseAsSorting = (validSortingKeys: string[]) => {
//   return createParser<SortingState>({
//     parse(queryValue) {
//       const sorting = queryValue.split(",");
//       const sortingState = sorting.map((sort) => {
//         const [id, direction] = sort.split(".");

//         return {
//           id,
//           desc: direction === "za",
//         };
//       });

//       return sortingState.filter(
//         (sort) => sort.id && validSortingKeys.includes(sort.id),
//       ) as SortingState;
//     },
//     serialize(value) {
//       return value
//         .map((sort) => `${sort.id}.${sort.desc ? "za" : "az"}`)
//         .join(",");
//     },
//   });
// };

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
  // TODO: using the parseAsSorting function, causes an infinite loop with tanstack table, this work around is not nice
  const [sorting, setSorting] = useQueryState(
    "sorteer",
    parseAsString.withDefault(serializeSorting(defaultSorting)),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const wrapper = useCallback(
    (
      value: SortingState | ((old: SortingState) => SortingState | null) | null,
    ) => {
      const newValue =
        typeof value === "function"
          ? value(parseSorting(sorting, sortableColumnIds))
          : value;

      setSorting(serializeSorting(newValue));
    },
    [setSorting, sorting],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const options = useMemo(
    () => ({
      state: {
        sorting: parseSorting(sorting, sortableColumnIds),
      },
      onSortingChange: wrapper,
    }),
    [sorting, wrapper],
  );

  return options;
}
