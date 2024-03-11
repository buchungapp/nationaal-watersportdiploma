import * as api from "nwd-api";
import { schema } from "../../../../../packages/db/src/main.js";
import * as application from "../../application/index.js";

export function getMainCategories(
  context: application.Context,
): api.GetMainCategoriesOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const rows = await context.db.select().from(schema.mainCategories);

    return {
      status: 200,
      parameters: {},
      contentType: "application/json",
      entity: () =>
        rows.map((row) => ({
          id: row.id,
          name: row.name,
          description: row.description ?? undefined,
        })),
    };
  };
}
