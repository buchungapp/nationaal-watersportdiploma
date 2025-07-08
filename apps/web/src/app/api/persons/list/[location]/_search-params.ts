import {
  createLoader,
  createSerializer,
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

const searchParams = {
  query: parseAsString,
  limit: parseAsInteger.withDefault(50),
  offset: parseAsInteger,
  actorType: parseAsArrayOf(
    parseAsStringLiteral(["student", "instructor", "location_admin"] as const),
  ).withDefault([]),
};

export const parsePersonListSearchParams = createLoader(searchParams);

export const serializePersonListSearchParams = createSerializer(searchParams);
