import assert from "assert";
import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../../application/index.js";

export function createMainCategory(
  context: application.Context,
): api.CreateMainCategoryOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    // TODO remove cast once generator supports it
    if (!authentication.apiToken.super) {
      return {
        status: 403,
        parameters: {},
      } as any;
    }

    const entity = await incomingRequest.entity();

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
