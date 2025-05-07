import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

export const searchParams = {
  limit: parseAsInteger.withDefault(25),
  page: parseAsInteger.withDefault(1),
  query: parseAsString.withDefault(""),
};

export const loadSearchParams = createLoader(searchParams);
