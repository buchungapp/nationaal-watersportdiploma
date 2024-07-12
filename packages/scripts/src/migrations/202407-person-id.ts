import { User, withDatabase, withTransaction } from '@nawadi/core'
import { schema as s } from '@nawadi/db'
import { eq, isNull } from 'drizzle-orm'

import 'dotenv/config'

async function main() {
  return withTransaction(async (tx) => {
    const personsToMigrate = await tx
      .select({ id: s.person.id })
      .from(s.person)
      .where(isNull(s.person.handle))

    console.log(`Found ${personsToMigrate.length} persons to migrate`)

    // Ask for confirmation in console
    // before running the migration
    console.log('Continue? (yes/no)')
    const response = await new Promise<string>((resolve) => {
      process.stdin.on('data', (data) => {
        resolve(data.toString().trim())
      })
    })

    if (response !== 'yes') {
      console.log('Aborting migration')
      return
    }

    for (const person of personsToMigrate) {
      await tx
        .update(s.person)
        .set({ handle: User.Person.generatePersonID() })
        .where(eq(s.person.id, person.id))
    }

    console.log(`Migrated ${personsToMigrate.length} persons`)
  })
}

const pgUri = process.env.PGURI

if (!pgUri) {
  throw new Error('PGURI environment variable is required')
}

withDatabase(
  {
    pgUri,
  },
  async () => await main(),
)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
