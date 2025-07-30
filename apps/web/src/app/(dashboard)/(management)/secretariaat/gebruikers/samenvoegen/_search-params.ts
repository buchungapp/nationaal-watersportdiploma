import { createLoader, parseAsBoolean, parseAsString } from "nuqs/server";

export const searchParams = {
  query: parseAsString.withDefault(""),
  primaryPerson: parseAsString.withDefault(""),
  secondaryPerson: parseAsString.withDefault(""),
  confirm: parseAsBoolean.withDefault(false),
};

export const searchParamsParser = createLoader(searchParams);
