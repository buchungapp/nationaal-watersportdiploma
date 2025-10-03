import { DatabaseError, schema as s, uncontrolledSchema } from "@nawadi/db";
import { AuthApiError, AuthError } from "@supabase/supabase-js";
import dayjs from "dayjs";
import {
  and,
  asc,
  countDistinct,
  eq,
  getTableColumns,
  inArray,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { z } from "zod";
import {
  useQuery,
  useSupabaseClient,
  withTransaction,
} from "../../contexts/index.js";
import { createAuthUser } from "../../services/auth/handlers.js";
import {
  formatSearchTerms,
  jsonAggBuildObject,
  jsonBuildObject,
  possibleSingleRow,
  singleRow,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { personSchema } from "./person.schema.js";
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
        if (error instanceof DatabaseError && error.code === "23505") {
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

        if (error instanceof DatabaseError) {
          return handleUniqueViolation(error);
        }

        throw error;
      }
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

export const updateEmail = wrapCommand(
  "user.updateEmail",
  withZod(
    z.object({ userId: uuidSchema, email: z.string().email() }),
    z.void(),
    async ({ userId, email }) => {
      const query = useQuery();
      const supabase = useSupabaseClient();

      const { data: userData } = await supabase.auth.admin.getUserById(userId);

      if (!userData) {
        throw new Error("User not found");
      }

      const existingUser = await query
        .select()
        .from(uncontrolledSchema._usersTable)
        .where(eq(uncontrolledSchema._usersTable.email, email))
        .then(possibleSingleRow);

      if (existingUser) {
        throw new Error("Email already in use");
      }

      await supabase.auth.admin.updateUserById(userId, {
        email,
      });

      await supabase
        .from("user")
        .update({
          email,
        })
        .eq("auth_user_id", userId);
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

export const list = wrapQuery(
  "user.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            q: z.string().optional(),
          })
          .default({}),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().default(0),
      })
      .default({}),
    z.object({
      items: selectSchema
        .omit({
          _metadata: true,
        })
        .extend({
          persons: personSchema
            .extend({
              actors: z
                .object({
                  id: uuidSchema,
                  createdAt: z.string(),
                  type: z.enum([
                    "student",
                    "instructor",
                    "location_admin",
                    "system",
                    "pvb_beoordelaar",
                    "secretariaat",
                  ]),
                  locationId: uuidSchema.nullable(),
                })
                .array(),
            })
            .array(),
        })
        .array(),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive().nullable(),
      offset: z.number().int().nonnegative(),
    }),
    async ({ limit, offset, filter }) => {
      const query = useQuery();

      const userCountQuery = query
        .select({ count: countDistinct(s.user.authUserId) })
        .from(s.user)
        .then(singleRow);

      const personQuery = query.$with("person").as(
        query
          .select({
            ...getTableColumns(s.person),
            birthCountry: {
              code: s.country.alpha_2,
              name: s.country.nl,
            },
            actors: jsonAggBuildObject(
              {
                ...getTableColumns(s.actor),
              },
              {
                notNullColumn: "id",
              },
            ).as("actors"),
          })
          .from(s.person)
          .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
          .leftJoin(
            s.actor,
            and(
              eq(s.actor.personId, s.person.id),
              isNull(s.actor.deletedAt),
              isNull(s.person.deletedAt),
            ),
          )
          .groupBy(s.person.id, s.country.id),
      );

      const userQuery = query
        .with(personQuery)
        .select({
          authUserId: s.user.authUserId,
          email: s.user.email,
          displayName: s.user.displayName,
          persons: jsonAggBuildObject(
            {
              id: personQuery.id,
              handle: personQuery.handle,
              userId: personQuery.userId,
              createdAt: personQuery.createdAt,
              updatedAt: personQuery.updatedAt,
              email: s.user.email,
              firstName: personQuery.firstName,
              lastName: personQuery.lastName,
              lastNamePrefix: personQuery.lastNamePrefix,
              dateOfBirth: personQuery.dateOfBirth,
              birthCity: personQuery.birthCity,
              birthCountry: jsonBuildObject({
                code: personQuery.birthCountry.code,
                name: personQuery.birthCountry.name,
              }),
              isPrimary: personQuery.isPrimary,
              actors: personQuery.actors,
            },
            {
              notNullColumn: "id",
            },
          ),
        })
        .from(s.user)
        .leftJoin(personQuery, eq(s.user.authUserId, personQuery.userId))
        .where(
          filter.q
            ? sql`
                (
                  setweight(to_tsvector('simple', 
                    COALESCE(${s.user.email}, '')
                  ), 'A') ||
                  setweight(to_tsvector('simple', 
                    COALESCE(split_part(${s.user.email}, '@', 1), '')
                  ), 'B') ||
                  setweight(to_tsvector('simple', 
                    COALESCE(split_part(${s.user.email}, '@', 2), '')
                  ), 'C') ||
                  setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
                  setweight(to_tsvector('simple', 
                    COALESCE(${s.person.firstName}, '') || ' ' || 
                    COALESCE(${s.person.lastNamePrefix}, '') || ' ' || 
                    COALESCE(${s.person.lastName}, '')
                  ), 'A')
                ) @@ to_tsquery('simple', ${formatSearchTerms(filter.q, "and")})
              `
            : undefined,
        )
        .orderBy(asc(s.user.email))
        .groupBy(s.user.authUserId)
        .$dynamic();

      const [{ count }, users] = await Promise.all([
        userCountQuery,
        withLimitOffset(userQuery, limit, offset),
      ]);

      return {
        items: users.map((user) => ({
          ...user,
          persons: user.persons.map((person) => ({
            ...person,
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            handle: person.handle!,
            birthCountry:
              person.birthCountry?.code && person.birthCountry.name
                ? {
                    code: person.birthCountry.code,
                    name: person.birthCountry.name,
                  }
                : null,
            createdAt: dayjs(person.createdAt).toISOString(),
            updatedAt: dayjs(person.updatedAt).toISOString(),
          })),
        })),
        count,
        limit: limit ?? null,
        offset,
      };
    },
  ),
);
