import * as api from "nwd-api";
import * as operationHandlers from "../operation-handlers/index.js";
import { Authentication } from "./authentication.js";
import { Context } from "./context.js";

export type Server = api.Server<Authentication>;

export function createApplicationServer(context: Context) {
  const server = new api.Server<Authentication>();

  server.registerEchoOperation(operationHandlers.createEchoHandler(context));
  server.registerEchoViaGetOperation(operationHandlers.createEchoViaGetHandler(context));

  return server;
}
