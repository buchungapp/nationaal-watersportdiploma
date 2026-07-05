import { schema as s } from "@nawadi/db";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.ts";
import {
  possibleSingleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.ts";

export const getActingProfilePreference = wrapQuery(
  "user.actingProfile.getPreference",
  withZod(
    z.object({
      userId: uuidSchema,
      locationId: uuidSchema,
    }),
    uuidSchema.nullable(),
    async (input) => {
      const query = useQuery();

      const row = await query
        .select({ personId: s.userActingProfilePreference.personId })
        .from(s.userActingProfilePreference)
        .where(
          and(
            eq(s.userActingProfilePreference.userId, input.userId),
            eq(s.userActingProfilePreference.locationId, input.locationId),
            isNull(s.userActingProfilePreference.deletedAt),
          ),
        )
        .then(possibleSingleRow);

      return row?.personId ?? null;
    },
  ),
);

export const setActingProfilePreference = wrapCommand(
  "user.actingProfile.setPreference",
  withZod(
    z.object({
      userId: uuidSchema,
      locationId: uuidSchema,
      personId: uuidSchema,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const result = await query
        .insert(s.userActingProfilePreference)
        .values({
          userId: input.userId,
          locationId: input.locationId,
          personId: input.personId,
        })
        .onConflictDoUpdate({
          target: [
            s.userActingProfilePreference.userId,
            s.userActingProfilePreference.locationId,
          ],
          set: {
            personId: input.personId,
            deletedAt: null,
            updatedAt: sql`NOW()`,
          },
        })
        .returning({ id: s.userActingProfilePreference.id })
        .then((rows) => {
          const row = rows[0];
          if (!row) {
            throw new Error("Failed to upsert acting profile preference");
          }
          return row;
        });

      return result;
    },
  ),
);
