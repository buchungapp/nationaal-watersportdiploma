/**
 * Asserts that a condition is truthy and throws an error if it's not.
 * @param condition - The condition to check. Can be any type that can be coerced to a boolean.
 * @param message - The error message or a function that returns the error message.
 * @throws {Error} If the condition is falsy.
 */
export function invariant(
    condition: unknown,
    message?: string | (() => string),
  ): asserts condition {
    // biome-ignore lint/complexity/noExtraBooleanCast: <explanation>
    if (!Boolean(condition)) {
      const errorMessage = typeof message === "function" ? message() : message;
      throw new Error(`Invariant violation: ${errorMessage}`);
    }
  }