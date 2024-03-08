import assert from "assert";
import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../../application/index.js";

export function createMainCategory(
  context: application.Context,
): api.CreateMainCategoryOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    if (!authentication.apiToken.super) {
      return {
        status: 403,
        parameters: {},
        contentType: null,
      };
    }

    const entity = (await incomingRequest.entity()) as any; // FIXME

    const rows = await context.db
      .insert(schema.mainCategories)
      .values({
        name: entity.name,
        description: entity.description ?? null,
      })
      .returning();

    assert(rows.length === 1);
    const [row] = rows;

    return {
      status: 201,
      parameters: {},
      contentType: "application/json",
      entity: () => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
      }),
    };
  };
}
