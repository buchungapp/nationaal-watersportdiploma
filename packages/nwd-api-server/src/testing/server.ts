import assert from "assert";
import * as http from "http";
import * as application from "../application/index.js";

export interface ServerConfiguration {
  server: application.Server;
  baseUrl: URL;
}
export async function withServer<T>(
  context: application.Context,
  job: (configuration: ServerConfiguration) => Promise<T>,
): Promise<T> {
  const server = application.createApplicationServer(context);

  const httpServer = http.createServer();
  const onRequest = server.asRequestListener({
    onError: (error) => console.error(error),
  });
  httpServer.addListener("request", onRequest);

  await new Promise<void>((resolve) => httpServer.listen(resolve));

  const address = httpServer.address();
  assert(address != null && typeof address === "object");
  const { port } = address;
  const baseUrl = new URL(`http://localhost:${port}`);

  try {
    const result = await job({ server, baseUrl });
    return result;
  } finally {
    httpServer.removeListener("request", onRequest);

    httpServer.closeAllConnections();
    await new Promise<void>((resolve, reject) =>
      httpServer.close((error) => (error == null ? resolve() : reject(error))),
    );
  }
}
