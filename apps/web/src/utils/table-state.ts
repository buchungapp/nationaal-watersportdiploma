export function transformSelectionState(
  input: Record<string, unknown>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(input ?? {}).map(([key, value]) => [key, !!value]),
  );
}

export function generateSortingState(
  sort: string[],
  validIds: (string | undefined)[],
) {
  return sort
    .map((sort) => {
      const [id, direction] = sort.split(".");
      return {
        id,
        desc: direction === "za",
      };
    })
    .filter(
      (
        sort,
      ): sort is {
        id: string;
        desc: boolean;
      } => validIds.filter(Boolean).includes(sort.id),
    );
}
