import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import path from 'path'
import postgres from 'postgres'
import * as yargs from 'yargs'
import { projectRoot } from '../root.js'

export function configureMigrateProgram(argv: yargs.Argv) {
  return argv.command(
    'migrate',
    'Migrates database to the current version',
    (yargs) =>
      yargs.option('pg-uri', {
        description: 'connection string for postgres',
        type: 'string',
        demandOption: true,
      }),
    (argv) => main(argv),
  )
}

interface MainConfiguration {
  pgUri: string
}

async function main(configuration: MainConfiguration) {
  const { pgUri } = configuration

  console.info('Migration start')

  const pgPool = postgres(pgUri, {
    max: 1,
  })

  try {
    const db = drizzle(pgPool)
    // migrate the database
    await migrate(db, {
      migrationsFolder: path.join(projectRoot, 'migrations'),
    })
  } finally {
    await pgPool.end()
  }

  console.info('Migration end')
}
