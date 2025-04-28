export const DEFAULT_TEST_TIMESTAMP = new Date(0).toISOString();

/**
 * Recursively empties 'createdAt', 'updatedAt' and 'deletedAt' fields from objects and arrays.
 * @param obj - The object or array to sanitize.
 * @returns The sanitized object or array without 'createdAt', 'updatedAt', and 'deletedAt' fields.
 */
export function defaultTimestamps<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(defaultTimestamps) as unknown as T;
  }
  if (obj !== null && typeof obj === "object") {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const sanitizedObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (["createdAt", "updatedAt", "deletedAt"].includes(key)) {
        sanitizedObj[key] = value === null ? null : DEFAULT_TEST_TIMESTAMP;
      } else {
        sanitizedObj[key] = defaultTimestamps(value);
      }
    }

    return sanitizedObj as T;
  }
  return obj;
}
