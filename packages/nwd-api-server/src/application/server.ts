import * as api from "nwd-api";
import * as operationHandlers from "../operation-handlers/index.js";
import { Authentication } from "./authentication.js";
import { Context } from "./context.js";

export type Server = api.Server<Authentication>;

export function createApplicationServer(context: Context, onError?: (error: unknown) => void) {
  const server = new api.Server<Authentication>();

  //categories

  server.registerCreateMainCategoryOperation(operationHandlers.createMainCategory(context));
  server.registerGetMainCategoriesOperation(operationHandlers.getMainCategories(context));

  server.registerGetSubCategoriesOperation(operationHandlers.getSubCategories(context));
  server.registerCreateSubCategoryOperation(operationHandlers.createSubCategory(context));

  // middleware!

  server.registerMiddleware(api.createErrorMiddleware(onError));

  return server;
}
