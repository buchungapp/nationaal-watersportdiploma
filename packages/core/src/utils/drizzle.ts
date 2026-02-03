import {
  type AnyColumn,
  eq,
  type GetColumnData,
  inArray,
  is,
  type SQL,
  sql,
} from "drizzle-orm";
import {
  type PgSelect,
  PgTimestampString,
  type SelectedFields,
} from "drizzle-orm/pg-core";
import type { SelectResultFields } from "drizzle-orm/query-builders/select.types";

/**
 * Coalesce a value to a default value if the value is null
 * Ex default array: themes: coalesce(pubThemeListQuery.themes, sql`'[]'`)
 * Ex default number: votesCount: coalesce(PubPollAnswersQuery.count, sql`0`)
 */
export function coalesce<T>(value: SQL.Aliased<T> | SQL<T>, defaultValue: SQL) {
  return sql<T>`coalesce(${value}, ${defaultValue})`;
}

export const aliasedColumn = <T extends AnyColumn>(
  column: T,
  alias: string,
): SQL.Aliased<GetColumnData<T>> => {
  return column.getSQL().mapWith(column.mapFromDriverValue).as(alias);
};

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

export function jsonBuildObject<T extends SelectedFields>(shape: T) {
  const chunks: SQL[] = [];

  for (const [key, value] of Object.entries(shape)) {
    if (chunks.length > 0) {
      chunks.push(sql.raw(","));
    }

    chunks.push(sql.raw(`'${key}',`));

    // json_build_object formats to ISO 8601 ...
    if (is(value, PgTimestampString)) {
      chunks.push(sql`timezone('UTC', ${value})`);
    } else {
      chunks.push(sql`${value}`);
    }
  }
  return sql<SelectResultFields<T>>`json_build_object(${sql.join(chunks)})`;
}

export function jsonAggBuildObject<T extends SelectedFields>(
  shape: T,
  options?: {
    orderBy?:
      | { colName: AnyColumn; direction: "ASC" | "DESC" }
      | Array<{ colName: AnyColumn; direction: "ASC" | "DESC" }>;
    notNullColumn?: keyof T;
  },
) {
  return sql<
    SelectResultFields<T>[]
  >`coalesce(jsonb_agg(${jsonBuildObject(shape)}${
    options?.orderBy
      ? sql`order by ${
          Array.isArray(options.orderBy)
            ? sql.join(
                options.orderBy.map(
                  (order) => sql`${order.colName} ${sql.raw(order.direction)}`,
                ),
                sql`, `,
              )
            : sql`${options.orderBy.colName} ${sql.raw(options.orderBy.direction)}`
        }`
      : undefined
  })${options?.notNullColumn ? sql` filter (where ${shape[options.notNullColumn]} is not null)` : sql.raw("")}, '${sql`[]`}')`;
}

// with filter non-null + distinct
export function jsonAgg<Column extends AnyColumn>(column: Column) {
  return coalesce<GetColumnData<Column, "raw">[]>(
    sql`json_agg(distinct ${sql`${column}`}) filter (where ${column} is not null)`,
    sql`'[]'`,
  );
}
