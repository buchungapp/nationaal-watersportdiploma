import { schema as s } from "@nawadi/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { insertSchema, selectSchema } from "./actor.schema.js";

export const listActiveTypesForUser = wrapQuery(
  "user.actor.listActiveTypesForUser",
  withZod(
    z.object({
      userId: uuidSchema,
      filter: z
        .object({
          personId: uuidSchema,
        })
        .optional(),
    }),
    selectSchema.shape.type.array(),
    async (input) => {
      const query = useQuery();

      const rows = await query
        .selectDistinct({ type: s.actor.type })
        .from(s.actor)
        .innerJoin(s.person, eq(s.actor.personId, s.person.id))
        .leftJoin(s.location, eq(s.actor.locationId, s.location.id))
        .where(
          and(
            isNull(s.actor.deletedAt),
            isNull(s.location.deletedAt),
            isNull(s.person.deletedAt),
            eq(s.person.userId, input.userId),
            input.filter?.personId
              ? eq(s.actor.personId, input.filter.personId)
              : undefined,
          ),
        );

      return rows.map(({ type }) => type);
    },
  ),
);

export const upsert = wrapCommand(
  "user.actor.upsert",
  withZod(
    insertSchema.pick({ locationId: true, type: true, personId: true }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const actor = await query
        .insert(s.actor)
        .values(input)
        .onConflictDoUpdate({
          target: [s.actor.type, s.actor.personId, s.actor.locationId],
          set: {
            deletedAt: null,
            createdAt: sql`NOW()`,
          },
        })
        .returning({ id: s.actor.id })
        .then(singleRow);

      return actor;
    },
  ),
);

export const remove = wrapCommand(
  "user.actor.remove",
  withZod(
    z.union([
      z.object({
        type: insertSchema.shape.type,
        personId: uuidSchema,
        locationId: uuidSchema,
      }),
      z.object({ actorId: uuidSchema }),
    ]),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .update(s.actor)
        .set({ deletedAt: sql`NOW()` })
        .where(
          "actorId" in input
            ? eq(s.actor.id, input.actorId)
            : and(
                eq(s.actor.type, input.type),
                eq(s.actor.personId, input.personId),
                eq(s.actor.locationId, input.locationId),
              ),
        );
    },
  ),
);
