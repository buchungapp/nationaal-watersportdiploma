import { createLoader, parseAsInteger, parseAsString } from "nuqs/server";

export const searchParamsParser = createLoader({
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});
