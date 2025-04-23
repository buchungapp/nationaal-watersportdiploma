import { schema as s, uncontrolledSchema } from "@nawadi/db";
import { AuthApiError, AuthError } from "@supabase/supabase-js";
import { and, eq, inArray, isNotNull, sql } from "drizzle-orm";
import postgres from "postgres";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { createAuthUser } from "../../services/auth/handlers.js";
import {
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { selectSchema } from "./user.schema.js";

/**
 * Get or create a user from an email address.
 *
 * Note: This function may seem overly complex, but it addresses several edge cases
 * and race conditions we encountered in production. It handles scenarios where:
 * 1. The user already exists in our database
 * 2. The user exists in the auth system but not in our database
 * 3. The user is being created concurrently by multiple requests
 *
 * While it may appear overkill, this implementation has proven to be reliable in
 * preventing the recurring bugs we faced with simpler versions. It ensures consistency
 * between our auth system and database, even under high concurrency.
 *
 * TODO: Consider revisiting this implementation in the future to see if it can be
 * optimized or simplified without reintroducing the original issues.
 */
export const getOrCreateFromEmail = wrapCommand(
  "user.user.getOrCreateFromEmail",
  withZod(
    z.object({
      email: z.string().trim().toLowerCase().email(),
      displayName: z.string().optional(),
    }),
    z.object({
      id: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      const getExistingUser = async () => {
        return query
          .select({ authUserId: s.user.authUserId })
          .from(s.user)
          .where(eq(s.user.email, input.email))
          .then(possibleSingleRow);
      };

      const createUserInPublicSchema = async (authUserId: string) => {
        return query
          .insert(s.user)
          .values({
            authUserId,
            email: input.email,
            displayName: input.displayName,
          })
          .returning({ authUserId: s.user.authUserId })
          .then(singleRow);
      };

      const handleUniqueViolation = async (error: unknown) => {
        if (error instanceof postgres.PostgresError && error.code === "23505") {
          const existing = await getExistingUser();
          if (existing) return { id: existing.authUserId };
        }
        throw new Error("Failed to create user");
      };

      // Check for existing user
      const existing = await getExistingUser();
      if (existing) return { id: existing.authUserId };

      try {
        // Try to create auth user
        const newAuthUserId = await createAuthUser({ email: input.email });
        const newUser = await createUserInPublicSchema(newAuthUserId);
        return { id: newUser.authUserId };
      } catch (error) {
        if (
          (error instanceof AuthError || error instanceof AuthApiError) &&
          (error.code === "email_exists" || error.code === "unexpected_failure")
        ) {
          const existingInAuthTable = await query
            .select({ id: uncontrolledSchema._usersTable.id })
            .from(uncontrolledSchema._usersTable)
            .where(eq(uncontrolledSchema._usersTable.email, input.email))
            .then(singleRow)
            .catch(() => {
              throw new Error(
                "Inconsistent state: Auth user exists but not found in Supabase schema",
              );
            });

          try {
            const newUser = await createUserInPublicSchema(
              existingInAuthTable.id,
            );
            return { id: newUser.authUserId };
          } catch (insertError) {
            return handleUniqueViolation(insertError);
          }
        }

        if (error instanceof postgres.PostgresError) {
          return handleUniqueViolation(error);
        }

        throw error;
      }
    },
  ),
);

export const fromId = wrapQuery(
  "user.user.fromId",
  withZod(uuidSchema, selectSchema, async (id) => {
    const query = useQuery();

    try {
      return (await query
        .select()
        .from(s.user)
        .where(eq(s.user.authUserId, id))
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        .then(singleRow)) as any; // Metadata does not match the type,  but we have Zod to validate
    } catch (error) {
      if (
        error instanceof TypeError &&
        error.message === "Expected 1 row, got 0"
      ) {
        const authUser = await query
          .select({
            id: uncontrolledSchema._usersTable.id,
            email: uncontrolledSchema._usersTable.email,
          })
          .from(uncontrolledSchema._usersTable)
          .where(eq(uncontrolledSchema._usersTable.id, id))
          .then(singleRow);

        return (await query
          .insert(s.user)
          .values({
            authUserId: authUser.id,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            email: authUser.email!,
          })
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          .returning()) as any; // Metadata does not match the type,  but we have Zod to validate
      }
    }
  }),
);

export const canUserAccessLocation = wrapCommand(
  "user.user.canUserAccessLocation",
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
