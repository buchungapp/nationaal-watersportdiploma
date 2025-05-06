import { createLoader, parseAsInteger } from "nuqs/server";
import { parseAsSearchQuery } from "~/app/(dashboard)/_lib/search-parser";

export const searchParams = {
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
  query: parseAsSearchQuery.withDefault(""),
};

export const loadSearchParams = createLoader(searchParams);
