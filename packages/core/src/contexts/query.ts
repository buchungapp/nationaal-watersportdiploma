import { useDatabase } from './database.js'
import { useTransaction } from './transaction.js'

/**
 * Attempts to use a transaction, falling back to using the database directly if no transaction is available.
 *
 * This function first tries to use an existing transaction by calling `useTransaction`. If `useTransaction`
 * does not return a transaction (i.e., returns `null` or `undefined`), it then falls back to using the database directly
 * by calling `useDatabase`.
 *
 * @returns {any} The result of `useTransaction` if it returns a truthy value, otherwise the result of `useDatabase`.
 */
export function useQuery() {
  return useTransaction() ?? useDatabase()
}
