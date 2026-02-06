import {
  createLoader,
  createSerializer,
  parseAsInteger,
  parseAsString,
} from "nuqs/server";

const searchParams = {
  query: parseAsString,
  limit: parseAsInteger.withDefault(10),
  excludePersonId: parseAsString,
};

export const parsePersonSearchParams = createLoader(searchParams);

export const serializePersonSearchParams = createSerializer(searchParams);
