import * as api from "nwd-api";
import * as operationHandlers from "../operation-handlers/index.js";

export type ServerAuthentication = {};
export type Server = api.Server<ServerAuthentication>;

export function createApplicationServer() {
  const server = new api.Server<ServerAuthentication>();

  server.registerEchoOperation(operationHandlers.createEchoHandler());

  return server;
}
