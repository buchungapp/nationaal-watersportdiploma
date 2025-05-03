import { type AnyColumn, type GetColumnData, eq, inArray } from "drizzle-orm";
import type { PgSelect } from "drizzle-orm/pg-core";

export const applyArrayOrEqual = <T extends AnyColumn>(
  field: T,
  value: GetColumnData<T> | Array<GetColumnData<T>>,
) => {
  return Array.isArray(value) ? inArray(field, value) : eq(field, value);
};

export function withLimitOffset<T extends PgSelect>(
  query: T,
  limit?: number,
  offset?: number,
) {
  let result = query;

  if (limit !== undefined) {
    result = query.limit(limit);
  }

  if (offset !== undefined) {
    result = query.offset(offset);
  }

  return result;
}

export function formatSearchTerms(
  searchTerm: string,
  operator: "and" | "or" = "or",
) {
  if (searchTerm === "") {
    return "";
  }
  const words = searchTerm.trim().split(/\s+/);
  const formattedWords = words.map((word) => {
    const escapedWord = word.replace(/[\\:'&|!()]/g, "\\$&");
    return `${escapedWord}:*`;
  });

  return formattedWords.join(` ${operator === "and" ? "&" : "|"} `);
}
