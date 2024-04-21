export function aggregateOneToMany<
  TRow extends Record<string, any>,
  TOne extends keyof TRow,
  TMany extends keyof TRow,
>(
  rows: TRow[],
  one: TOne,
  many: TMany,
): {
  [K in TOne]: TRow[TOne] & { [K in TMany]: NonNullable<TRow[TMany]>[] }
}[TOne][] {
  const map: Record<string, { one: TRow[TOne]; many: TRow[TMany][] }> = {}
  for (const row of rows) {
    const id = row[one]

    if (!map[id]) {
      map[id] = { one: row[one], many: [] }
    }
    if (row[many] != null) {
      map[id]!.many.push(row[many])
    }
  }
  return Object.values(map).map((r) => ({ ...r.one, [many]: r.many }))
}

export function singleRow<T>(rows: T[]): T {
  if (!hasAtLeastOneElement(rows) || rows.length !== 1) {
    throw new TypeError(`Expected 1 row, got ${rows.length}`)
  }
  const [row] = rows

  return row
}

export function possibleSingleRow<T>(rows: T[]): T | undefined {
  if (!hasAtLeastOneElement(rows) && rows.length > 1) {
    throw new TypeError(`Expected 0 or 1 rows, got ${rows.length}`)
  }
  const [row] = rows

  return row ?? undefined
}

export function hasAtLeastOneElement<T>(array: T[]): array is [T, ...T[]] {
  return !!array && array.length > 0
}

export function enforceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value]
}

type FindItemReturnType<T, Enforce extends boolean> = Enforce extends true
  ? NonNullable<T>
  : T | undefined

export function findItem<T, Enforce extends boolean = false>({
  items,
  predicate,
  enforce = false as Enforce,
}: {
  items: T[] | undefined
  predicate: (item: T) => boolean
  enforce?: Enforce
}): FindItemReturnType<T, Enforce> {
  if (!items) {
    if (enforce) {
      throw new Error('Array is undefined, enforcement fails.')
    }
    return undefined as FindItemReturnType<T, Enforce>
  }

  const item = items.find(predicate)

  if (!item && enforce) {
    throw new Error('Item not found with the provided predicate.')
  }

  return item as FindItemReturnType<T, Enforce>
}
