import { schema as s } from "@nawadi/db";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { uuidSchema, withZod, wrapQuery } from "../../utils/index.js";

export const checkPermissionForPersonInLocation = wrapQuery(
  "user.rbac.checkPermissionForPersonInLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
      cohortId: uuidSchema.optional(),
      permission: z.string(),
    }),
    z.boolean(),
    async (input) => {
      const query = useQuery();

      const rows = await query
        .selectDistinct({ type: s.actor.type })
        .from(s.actor)
        .where(
          and(
            isNull(s.actor.deletedAt),
            eq(s.actor.personId, input.personId),
            eq(s.actor.locationId, input.locationId),
          ),
        );

      const typesInLocation = rows.map(({ type }) => type);

      return typesInLocation.includes("location_admin");
    },
  ),
);
