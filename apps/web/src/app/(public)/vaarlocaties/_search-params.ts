import { createLoader, parseAsArrayOf, parseAsString } from "nuqs/server";

export const searchParams = {
  disciplineId: parseAsArrayOf(parseAsString),
  categoryId: parseAsArrayOf(parseAsString),
};

export const loadSearchParams = createLoader(searchParams);
