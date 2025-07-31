import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParamsParser = createLoader({
  filter: parseAsArrayOf(
    parseAsStringLiteral(["active", "draft", "hidden", "archived"] as const),
  ).withDefault(["active", "draft"]),
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});
