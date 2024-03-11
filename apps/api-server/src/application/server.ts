import * as api from "@nawadi/api";
import * as authenticationHandlers from "../authentication-handlers/index.js";
import * as operationHandlers from "../operation-handlers/index.js";
import { Authentication } from "./authentication.js";
import { Context } from "./context.js";

export type Server = api.Server<Authentication>;

export function createApplicationServer(context: Context) {
  const server = new api.Server<Authentication>();

  //categories

  server.registerCreateMainCategoryOperation(operationHandlers.createMainCategory(context));
  server.registerGetMainCategoriesOperation(operationHandlers.getMainCategories(context));

  server.registerGetSubCategoriesOperation(operationHandlers.getSubCategories(context));
  server.registerCreateSubCategoryOperation(operationHandlers.createSubCategory(context));

  // authentication

  server.registerApiTokenAuthentication(authenticationHandlers.apiToken(context));

  // middleware!

  server.registerMiddleware(api.createErrorMiddleware());

  return server;
}
