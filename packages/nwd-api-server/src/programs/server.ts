import * as http from "http";
import * as yargs from "yargs";
import * as application from "../application/index.js";

export function configureServerProgram(argv: yargs.Argv) {
  return argv.command(
    "server",
    "Start a server",
    (yargs) =>
      yargs.option("port", {
        description: "port for the server to listen to",
        type: "number",
        default: 8080,
      }),
    (argv) => main(argv),
  );
}

interface MainOptions {
  port: number;
}

async function main(options: MainOptions) {
  console.log("Starting server...");

  const { port } = options;

  const server = application.createApplicationServer();

  const httpServer = http.createServer();
  const onRequest = server.asRequestListener({
    onError: (error) => console.error(error),
  });
  httpServer.addListener("request", onRequest);

  await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

  console.log("Server started");
  try {
    await new Promise<void>((resolve) => {
      const abort = () => {
        process.removeListener("SIGINT", abort);
        process.removeListener("SIGTERM", abort);

        resolve();
      };
      process.addListener("SIGINT", abort);
      process.addListener("SIGTERM", abort);
    });
  } finally {
    console.log("Stopping server...");

    httpServer.removeListener("request", onRequest);

    httpServer.closeAllConnections();

    await new Promise<void>((resolve, reject) =>
      httpServer.close((error) => (error == null ? resolve() : reject(error))),
    );

    console.log("Server stopped");
  }
}
