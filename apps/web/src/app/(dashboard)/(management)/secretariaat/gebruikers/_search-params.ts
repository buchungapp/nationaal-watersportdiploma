import {
  createLoader,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const searchParamsParser = createLoader({
  filter: parseAsArrayOf(
    parseAsStringLiteral([
      "student",
      "instructor",
      "location_admin",
      "pvb_beoordelaar",
      "secretariaat",
    ] as const),
  ).withDefault(["instructor", "student"]),
  query: parseAsString.withDefault(""),
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(25),
});
