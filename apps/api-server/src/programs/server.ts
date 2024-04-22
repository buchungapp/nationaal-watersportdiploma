import { listen } from '@nawadi/api'
import { withDatabase } from '@nawadi/core'
import * as yargs from 'yargs'
import * as application from '../application/index.js'
import { waitForSignal } from '../utils/index.js'

export function configureServerProgram(argv: yargs.Argv) {
  return argv.command(
    'server',
    'Start a server',
    (yargs) =>
      yargs
        .option('port', {
          description: 'port for the server to listen to',
          type: 'number',
          demandOption: true,
        })
        .option('pg-uri', {
          description: 'connection string for postgres',
          type: 'string',
          demandOption: true,
        }),
    (argv) => main(argv),
  )
}

interface MainConfiguration {
  port: number
  pgUri: string
}

async function main(configuration: MainConfiguration) {
  const { port, pgUri } = configuration

  console.info('Starting server...')

  await withDatabase({ pgUri }, async () => {
    const server = application.createApplicationServer()
    await using listener = await listen(server, { port })

    console.info(`Server started (${listener.port})`)

    await waitForSignal('SIGINT', 'SIGTERM')

    console.info('Stopping server...')
  })

  console.info('Server stopped')
}
