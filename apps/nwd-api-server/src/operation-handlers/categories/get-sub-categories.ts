import { eq } from "drizzle-orm";
import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../../application/index.js";

export function getSubCategories(
  context: application.Context,
): api.GetSubCategoriesOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    const { mainCategoryId } = incomingRequest.parameters;

    const rows = await context.db
      .select()
      .from(schema.subCategories)
      .where(eq(schema.subCategories.mainCategoryId, mainCategoryId));

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
