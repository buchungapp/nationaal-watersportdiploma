import assert from 'assert'
import * as http from 'http'
import { URL } from 'node:url'
import * as application from '../application/index.js'

export interface ServerContext {
  server: application.Server
  baseUrl: URL
}
export async function withServer<T>(
  job: (context: ServerContext) => Promise<T>,
): Promise<T> {
  const server = application.createApplicationServer()

  const httpServer = http.createServer()
  const onRequest = server.asHttpRequestListener()
  httpServer.addListener('request', onRequest)

  await new Promise<void>((resolve) => httpServer.listen(resolve))

  const address = httpServer.address()
  assert(address != null && typeof address === 'object')
  const { port } = address
  const baseUrl = new URL(`http://localhost:${port}`)

  try {
    const result = await job({ server, baseUrl })
    return result
  } finally {
    httpServer.removeListener('request', onRequest)

    httpServer.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      httpServer.close((error) => (error == null ? resolve() : reject(error))),
    )
  }
}
