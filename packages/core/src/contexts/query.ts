import { useDatabase } from './database.js'
import { useTransaction } from './transaction.js'

export function useQuery() {
  return useTransaction() ?? useDatabase()
}
