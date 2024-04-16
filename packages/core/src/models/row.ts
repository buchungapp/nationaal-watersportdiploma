export function singleRow<T>(rows: T[]): T {
  if (rows.length !== 1) {
    throw new TypeError(`Expected 1 row, got ${rows.length}`)
  }
  const [row] = rows
  return row
}
