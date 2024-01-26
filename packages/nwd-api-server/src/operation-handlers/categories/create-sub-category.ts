import assert from "assert";
import * as api from "nwd-api";
import { schema } from "nwd-db";
import * as application from "../../application/index.js";

export function createSubCategory(
  context: application.Context,
): api.CreateSubCategoryOperationHandler<application.Authentication> {
  return async (incomingRequest, authentication) => {
    // TODO remove cast once generator supports it
    if (!authentication.apiToken.super) {
      return {
        status: 403,
        parameters: {},
      } as any;
    }

    const { mainCategoryId } = incomingRequest.parameters;
    const entity = await incomingRequest.entity();

    const rows = await context.db
      .insert(schema.subCategories)
      .values({
        name: entity.name,
        description: entity.description ?? null,
        mainCategoryId,
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
