import { schema as s } from "@nawadi/db";
import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getOrCreateUser } from "../../auth/repository.js";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { selectSchema } from "./user.schema.js";

export const getOrCreateFromEmail = wrapCommand(
  "user.getOrCreateFromEmail",
  withZod(
    z.object({
      email: z.string().trim().toLowerCase().email(),
      displayName: z.string().optional(),
    }),
    z.object({
      id: uuidSchema,
    }),
    async (input) => {
      return getOrCreateUser({
        email: input.email,
        displayName: input.displayName,
      });
    },
  ),
);

export const fromId = wrapQuery(
  "user.fromId",
  withZod(uuidSchema, selectSchema, async (id) => {
    const query = useQuery();

    try {
      return (await query
        .select()
        .from(s.user)
        .where(eq(s.user.authUserId, id))
        // biome-ignore lint/suspicious/noExplicitAny: intentional
        .then(singleRow)) as any; // Metadata does not match the type,  but we have Zod to validate
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message === "Expected 1 row, got 0"
      ) {
        const authUser = await query
          .select({
            id: s.betterAuthUser.id,
            email: s.betterAuthUser.email,
          })
          .from(s.betterAuthUser)
          .where(eq(s.betterAuthUser.id, id))
          .then(singleRow);

        return (await query
          .insert(s.user)
          .values({
            authUserId: authUser.id,
            email: authUser.email,
          })
          // biome-ignore lint/suspicious/noExplicitAny: intentional
          .returning()) as any; // Metadata does not match the type,  but we have Zod to validate
      }
    }
  }),
);

export const canUserAccessLocation = wrapCommand(
  "user.canUserAccessLocation",
  withZod(
    z.object({
      userId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.boolean(),
    async ({ userId, locationId }) => {
      const query = useQuery();

      const rows = await query
        .select({ number: sql<number>`1` })
        .from(s.actor)
        .innerJoin(
          s.person,
          and(eq(s.actor.personId, s.person.id), eq(s.person.userId, userId)),
        )
        .where(
          and(
            eq(s.actor.personId, userId),
            eq(s.actor.locationId, locationId),
            isNotNull(s.actor.deletedAt),
            inArray(s.actor.type, ["instructor", "location_admin"]),
          ),
        );

      return rows.length > 0;
    },
  ),
);

export const updateDisplayName = wrapCommand(
  "user.updateDisplayName",
  withZod(
    z.object({ userId: uuidSchema, displayName: z.string() }),
    z.void(),
    async ({ userId, displayName }) => {
      const query = useQuery();

      await query
        .update(s.user)
        .set({ displayName })
        .where(eq(s.user.authUserId, userId));
    },
  ),
);

export const setPrimaryPerson = wrapCommand(
  "user.setPrimaryPerson",
  withZod(
    z.object({
      userId: uuidSchema,
      personId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      return withTransaction(async (tx) => {
        // 1. Set all other persons as not primary
        await tx
          .update(s.person)
          .set({
            isPrimary: false,
            updatedAt: sql`NOW()`,
          })
          .where(
            and(eq(s.person.userId, input.userId), isNull(s.person.deletedAt)),
          );

        // 2. Set the person as primary (also validates person exists and belongs to user)
        await tx
          .update(s.person)
          .set({
            isPrimary: true,
            updatedAt: sql`NOW()`,
          })
          .where(
            and(
              eq(s.person.id, input.personId),
              eq(s.person.userId, input.userId),
              isNull(s.person.deletedAt),
            ),
          )
          .returning({ id: s.person.id })
          // Check if the update affected any rows (validates person exists and belongs to user)
          .then(singleRow);
      });
    },
  ),
);
