import { type AnyColumn, type GetColumnData, eq, inArray } from "drizzle-orm";

export const applyArrayOrEqual = <T extends AnyColumn>(
  field: T,
  value: GetColumnData<T> | Array<GetColumnData<T>>,
) => {
  return Array.isArray(value) ? inArray(field, value) : eq(field, value);
};
