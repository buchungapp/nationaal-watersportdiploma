export function mask<T extends string | null | undefined>(
  string?: T,
  startVisible = 2,
  endVisible = 2,
): T {
  if (string === null || typeof string === "undefined") {
    return string as T;
  }

  if (string.length <= startVisible + endVisible) {
    return string;
  }
  return string.replace(
    new RegExp(`^(.{${startVisible}})(.*)(.{${endVisible}})$`),
    (_, start, middle, end) => start + middle.replace(/./g, "*") + end,
  ) as T;
}

export function maskObject<T extends Record<string, string | null | undefined>>(
  object: T,
  startVisible = 2,
  endVisible = 2,
): { [K in keyof T]: T[K] extends string ? string : T[K] } {
  return Object.fromEntries(
    Object.entries(object).map(([key, value]) => [
      key,
      mask(value, startVisible, endVisible),
    ]),
  ) as { [K in keyof T]: T[K] extends string ? string : T[K] };
}
