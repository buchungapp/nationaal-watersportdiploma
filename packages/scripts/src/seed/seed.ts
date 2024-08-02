import { withDatabase, withSupabaseClient, withTransaction } from '@nawadi/core'
import 'dotenv/config'
import assert from 'node:assert'
import { addCountries } from './coutry.js'
import { addCurriculumAndDepencies } from './curriculum/index.js'
import { addLocation } from './location.js'
import { addRolesAndDepencies } from './roles/index.js'
import { truncate } from './truncate.js'
import { addUsers, deleteUsers } from './users.js'
import { RESET, TEXT_CYAN, TEXT_GREEN } from './utils/colors.js'
import { processing } from './utils/processing.js'

async function seed() {
  console.log()
  console.log('🌱 ' + TEXT_CYAN + 'Seeding...' + RESET)
  console.log()

  try {
    await withTransaction(async () => {
      // Truncate tables
      await processing(truncate, {
        icon: '🗑️',
        text: 'Truncating tables...',
        successText: 'Tables truncated',
        failText: 'Failed to truncate tables',
      })
    })

    // Delete users
    await processing(deleteUsers, {
      icon: '❌',
      text: 'Deleting users...',
      successText: 'Users deleted',
      failText: 'Failed to delete users',
    })

    await withTransaction(async () => {
      // Add countries
      await processing(addCountries, {
        icon: '🌍',
        text: 'Adding countries...',
        successText: 'Countries added',
        failText: 'Failed to add countries',
      })

      // Add roles
      console.log()
      console.log(
        '  🪪 ' + TEXT_CYAN + 'Adding roles and dependencies...' + RESET,
      )
      await addRolesAndDepencies()

      // Add curriculum and dependencies
      console.log()
      console.log(
        '  🏫 ' + TEXT_CYAN + 'Adding curriculum and dependencies...' + RESET,
      )
      await addCurriculumAndDepencies()

      // Add location
      console.log()
      await processing(addLocation, {
        icon: '📍',
        text: 'Adding location...',
        successText: 'Location added',
        failText: 'Failed to add location',
      })
    })

    // Add users
    await processing(addUsers, {
      icon: '👤',
      text: 'Adding users...',
      successText: 'Users added',
      failText: 'Failed to add users',
    })

    // Completed
    console.log()
    console.log('🌱 ' + TEXT_GREEN + 'Seeding complete' + RESET)
    console.log()
  } catch (error) {
    console.error('Failed to seed database')
    console.error(error)
  }
}

const pgUri = process.env.PGURI
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

assert(pgUri, 'PGURI environment variable is required')
assert(supabaseUrl, 'NEXT_PUBLIC_SUPABASE_URL environment variable is required')
assert(
  supabaseKey,
  'SUPABASE_SERVICE_ROLE_KEY environment variable is required',
)

withSupabaseClient(
  {
    url: supabaseUrl,
    serviceRoleKey: supabaseKey,
  },
  () =>
    withDatabase(
      {
        pgUri,
        onnotice: () => {},
      },
      async () => await seed(),
    ),
)
