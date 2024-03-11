import { createDatabase } from "@nawadi/db";
import * as http from "http";
import pg from "pg";
import * as yargs from "yargs";
import * as application from "../application/index.js";

export function configureServerProgram(argv: yargs.Argv) {
  return argv.command(
    "server",
    "Start a server",
    (yargs) =>
      yargs
        .option("port", {
          description: "port for the server to listen to",
          type: "number",
          demandOption: true,
        })
        .option("pg-uri", {
          description: "connection string for postgres",
          type: "string",
          demandOption: true,
        }),
    (argv) => main(argv),
  );
}

interface MainConfiguration {
  port: number;
  pgUri: string;
}

async function main(configuration: MainConfiguration) {
  const { port, pgUri } = configuration;

  console.info("Starting server...");

  const pgPool = new pg.Pool({
    connectionString: pgUri,
  });
  try {
    const db = createDatabase(pgPool);
    const context = {
      db,
    };
    const server = application.createApplicationServer(context);

    const httpServer = http.createServer();
    const onRequest = server.asHttpRequestListener();
    httpServer.addListener("request", onRequest);

    await new Promise<void>((resolve) => httpServer.listen({ port }, resolve));

    console.info("Server started");
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

      console.info("Stopping server...");
    } finally {
      httpServer.removeListener("request", onRequest);

      httpServer.closeAllConnections();

      await new Promise<void>((resolve, reject) =>
        httpServer.close((error) => (error == null ? resolve() : reject(error))),
      );
    }
  } finally {
    await pgPool.end();
  }

  console.info("Server stopped");
}
