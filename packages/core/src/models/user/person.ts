import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  type SQL,
  and,
  countDistinct,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  sql,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  formatSearchTerms,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { maskObject } from "../../utils/privacy.js";
import { insertSchema, personSchema, selectSchema } from "./person.schema.js";
import { getOrCreateFromEmail } from "./user.js";
import { selectSchema as userSelectSchema } from "./user.schema.js";
export function generatePersonID() {
  const dictionary = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
  const nanoid = customAlphabet(dictionary, 10);

  return nanoid();
}

/**
 * Tries to find a person by email, first name, last name prefix, last name, date of birth, birth city and birth country.
 * If not found, null is returned.
 * Order of ouput is same as input.
 */
export const find = wrapQuery(
  "user.person.find",
  withZod(
    z.object({
      person: singleOrArray(
        selectSchema
          .pick({
            firstName: true,
            lastName: true,
            lastNamePrefix: true,
            dateOfBirth: true,
          })
          .extend({
            email: userSelectSchema.shape.email,
          }),
      ),
      filter: z.object({
        locationId: singleOrArray(uuidSchema).optional(),
      }),
    }),
    z
      .discriminatedUnion("status", [
        z.object({
          id: uuidSchema,
          status: z.literal("match"),
        }),
        z.object({
          id: uuidSchema,
          person: personSchema.pick({
            email: true,
            firstName: true,
            lastName: true,
            lastNamePrefix: true,
            dateOfBirth: true,
          }),
          status: z.literal("partial-match"),
        }),
        z.object({
          id: uuidSchema.optional(),
          status: z.literal("no-match"),
        }),
      ])
      .array(),
    async (input) => {
      const query = useQuery();

      const persons = Array.isArray(input.person)
        ? input.person
        : [input.person];

      const linkedQuery = input.filter.locationId
        ? exists(
            query
              .select()
              .from(s.personLocationLink)
              .where(
                and(
                  eq(s.personLocationLink.personId, s.person.id),
                  eq(s.personLocationLink.status, "linked"),
                  Array.isArray(input.filter.locationId)
                    ? inArray(
                        s.personLocationLink.locationId,
                        input.filter.locationId,
                      )
                    : eq(
                        s.personLocationLink.locationId,
                        input.filter.locationId,
                      ),
                ),
              ),
          )
        : sql`false`;

      const results = await Promise.all(
        persons.map(async (item) => {
          const conditions: SQL[] = [];

          if (item.firstName) {
            conditions.push(
              eq(
                sql`LOWER(${s.person.firstName})`,
                item.firstName.toLowerCase(),
              ),
            );
          }

          if (item.lastName) {
            conditions.push(
              eq(sql`LOWER(${s.person.lastName})`, item.lastName.toLowerCase()),
            );
          }

          if (item.dateOfBirth) {
            conditions.push(
              eq(
                s.person.dateOfBirth,
                dayjs(item.dateOfBirth).format("YYYY-MM-DD"),
              ),
            );
          }

          const findUserQuery = query
            .select({
              userId: s.user.authUserId,
              personId: s.person.id,
              hasLocationLink: linkedQuery,

              userEmail: s.user.email,
              personFirstName: s.person.firstName,
              personLastName: s.person.lastName,
              personLastNamePrefix: s.person.lastNamePrefix,
              personDateOfBirth: s.person.dateOfBirth,
            })
            .from(s.user)
            .innerJoin(s.person, eq(s.user.authUserId, s.person.userId))
            .where(and(eq(s.user.email, item.email), ...conditions));

          const findPersonQuery = query
            .select({
              userId: s.user.authUserId,
              personId: s.person.id,
              hasLocationLink: linkedQuery,

              userEmail: s.user.email,
              personFirstName: s.person.firstName,
              personLastName: s.person.lastName,
              personLastNamePrefix: s.person.lastNamePrefix,
              personDateOfBirth: s.person.dateOfBirth,
            })
            .from(s.person)
            .innerJoin(s.user, eq(s.person.userId, s.user.authUserId))
            .where(and(...conditions));

          const viaEmailAndPerson = await findUserQuery.then(possibleSingleRow);
          const viaPerson = await findPersonQuery.then(possibleSingleRow);

          // Assumtion: person data is never twice in the database
          // This means that if we find a person via email and a user via person, they are the same user

          if (viaEmailAndPerson?.userId && viaPerson?.userId) {
            return {
              id: viaEmailAndPerson.personId,
              status: "match" as const,
            };
          }

          if (viaEmailAndPerson) {
            return {
              id: viaEmailAndPerson.personId,
              person: viaEmailAndPerson.hasLocationLink
                ? {
                    email: viaEmailAndPerson.userEmail,
                    firstName: viaEmailAndPerson.personFirstName,
                    lastName: viaEmailAndPerson.personLastName,
                    lastNamePrefix: viaEmailAndPerson.personLastNamePrefix,
                    dateOfBirth: viaEmailAndPerson.personDateOfBirth,
                  }
                : maskObject({
                    email: viaEmailAndPerson.userEmail,
                    firstName: viaEmailAndPerson.personFirstName,
                    lastName: viaEmailAndPerson.personLastName,
                    lastNamePrefix: viaEmailAndPerson.personLastNamePrefix,
                    dateOfBirth: null,
                  }),
              status: "partial-match" as const,
            };
          }

          if (viaPerson) {
            return {
              id: viaPerson.personId,
              person: viaPerson.hasLocationLink
                ? {
                    email: viaPerson.userEmail,
                    firstName: viaPerson.personFirstName,
                    lastName: viaPerson.personLastName,
                    lastNamePrefix: viaPerson.personLastNamePrefix,
                    dateOfBirth: viaPerson.personDateOfBirth,
                  }
                : maskObject({
                    email: viaPerson.userEmail,
                    firstName: viaPerson.personFirstName,
                    lastName: viaPerson.personLastName,
                    lastNamePrefix: viaPerson.personLastNamePrefix,
                    dateOfBirth: null,
                  }),
              status: "partial-match" as const,
            };
          }

          return {
            status: "no-match" as const,
          };
        }),
      );

      return results;
    },
  ),
);

export const getOrCreate = wrapCommand(
  "user.person.getOrCreate",
  withZod(
    insertSchema
      .pick({
        firstName: true,
        lastName: true,
        lastNamePrefix: true,
        dateOfBirth: true,
        birthCity: true,
        birthCountry: true,
      })
      .extend({
        userId: userSelectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const conditions: SQL[] = [];

      if (input.userId) {
        conditions.push(eq(s.person.userId, input.userId));
      } else {
        conditions.push(isNull(s.person.userId));
      }

      // Add conditions dynamically based on defined inputs
      if (input.firstName) {
        conditions.push(
          eq(sql`LOWER(${s.person.firstName})`, input.firstName.toLowerCase()),
        );
      }
      if (input.lastName) {
        conditions.push(
          eq(sql`LOWER(${s.person.lastName})`, input.lastName.toLowerCase()),
        );
      }
      if (input.dateOfBirth) {
        conditions.push(
          eq(
            s.person.dateOfBirth,
            dayjs(input.dateOfBirth).format("YYYY-MM-DD"),
          ),
        );
      }

      const [existing] = await query
        .select({ id: s.person.id })
        .from(s.person)
        .where(and(...conditions));

      if (existing) {
        return {
          id: existing.id,
        };
      }

      const [newPerson] = await query
        .insert(s.person)
        .values({
          userId: input.userId,
          handle: generatePersonID(),
          firstName: input.firstName,
          lastName: input.lastName,
          lastNamePrefix: input.lastNamePrefix,
          dateOfBirth: input.dateOfBirth
            ? dayjs(input.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.birthCity,
          birthCountry: input.birthCountry,
        })
        .returning({ id: s.person.id });

      if (!newPerson) {
        throw new Error("Failed to create actor");
      }

      return {
        id: newPerson.id,
      };
    },
  ),
);

export const createLocationLink = wrapCommand(
  "user.person.createLocationLink",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .insert(s.personLocationLink)
        .values({
          personId: input.personId,
          locationId: input.locationId,
          status: "linked",
          permissionLevel: "none",
        })
        .onConflictDoNothing({
          target: [
            s.personLocationLink.personId,
            s.personLocationLink.locationId,
          ],
        });

      return;
    },
  ),
);

export const byIdOrHandle = wrapQuery(
  "user.person.byIdOrHandle",
  withZod(
    z.union([z.object({ id: uuidSchema }), z.object({ handle: z.string() })]),
    personSchema,
    async (input) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [isNull(s.person.deletedAt)];

      if ("id" in input) {
        whereClausules.push(eq(s.person.id, input.id));
      }

      if ("handle" in input) {
        whereClausules.push(eq(s.person.handle, input.handle));
      }

      const res = await query
        .select({
          ...getTableColumns(s.person),
          email: s.user.email,
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .where(and(...whereClausules))
        .then((rows) => {
          const result = singleRow(rows);
          if (result.birthCountry?.code === null) {
            return {
              ...result,
              birthCountry: null,
            };
          }
          return result;
        });

      return {
        ...res,
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        handle: res.handle!,
        createdAt: dayjs(res.createdAt).toISOString(),
        updatedAt: dayjs(res.updatedAt).toISOString(),
      };
    },
  ),
);

export const list = wrapQuery(
  "user.person.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            userId: singleOrArray(uuidSchema).optional(),
            personId: singleOrArray(uuidSchema).optional(),
            locationId: singleOrArray(uuidSchema).optional(),
            actorType: singleOrArray(
              z.enum(["student", "instructor", "location_admin"]),
            ).optional(),
            q: z.string().optional(),
          })
          .default({}),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().default(0),
      })
      .default({}),
    z.object({
      items: personSchema
        .extend({
          actors: z
            .object({
              id: uuidSchema,
              createdAt: z.string(),
              type: z.enum([
                "student",
                "instructor",
                "location_admin",
                "application",
                "system",
              ]),
              locationId: uuidSchema,
            })
            .array(),
        })
        .array(),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive().nullable(),
      offset: z.number().int().nonnegative(),
    }),
    async ({ filter, limit, offset }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        filter.userId
          ? Array.isArray(filter.userId)
            ? inArray(s.person.userId, filter.userId)
            : eq(s.person.userId, filter.userId)
          : undefined,
        filter.personId
          ? Array.isArray(filter.personId)
            ? inArray(s.person.id, filter.personId)
            : eq(s.person.id, filter.personId)
          : undefined,
        filter.actorType
          ? Array.isArray(filter.actorType)
            ? inArray(s.actor.type, filter.actorType)
            : eq(s.actor.type, filter.actorType)
          : undefined,
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
      ];

      if (filter.locationId) {
        if (Array.isArray(filter.locationId)) {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                inArray(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        } else {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                eq(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        }
      }

      const personCountQuery = query
        .select({ count: countDistinct(s.person.id) })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .then(singleRow);

      const personQuery = query
        .select({
          ...getTableColumns(s.person),
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
          email: s.user.email,
          actor: s.actor,
        })
        .from(s.person)
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .$dynamic();

      const [{ count }, persons] = await Promise.all([
        personCountQuery,
        withLimitOffset(personQuery, limit, offset).then(
          aggregate({ pkey: "id", fields: { actors: "actor.id" } }),
        ),
      ]);

      if (persons.length === 0) {
        return {
          items: [],
          count,
          limit: limit ?? null,
          offset,
        };
      }

      return {
        items: persons.map((person) => ({
          ...person,
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          handle: person.handle!,
          createdAt: dayjs(person.createdAt).toISOString(),
          updatedAt: dayjs(person.updatedAt).toISOString(),
        })),
        count,
        limit: limit ?? null,
        offset,
      };
    },
  ),
);

export const listLocationsByRole = wrapQuery(
  "user.person.listLocationsByRole",
  withZod(
    z.object({
      personId: uuidSchema,
      roles: z
        .array(z.enum(["student", "instructor", "location_admin"]))
        .default(["instructor", "student", "location_admin"]),
    }),
    z.array(
      z.object({
        locationId: uuidSchema,
        roles: z.array(z.enum(["student", "instructor", "location_admin"])),
      }),
    ),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select({
          locationId: s.personLocationLink.locationId,
          role: s.actor.type,
        })
        .from(s.personLocationLink)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.personLocationLink.personId),
            eq(s.actor.locationId, s.personLocationLink.locationId),
            isNull(s.actor.deletedAt),
            inArray(s.actor.type, input.roles),
          ),
        )
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(aggregate({ pkey: "locationId", fields: { roles: "role" } }));

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      return result as any;
    },
  ),
);

export const setPrimary = wrapCommand(
  "user.person.setPrimary",
  withZod(
    z.object({
      personId: uuidSchema,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const result = await query
        .update(s.person)
        .set({
          isPrimary: true,
          updatedAt: sql`NOW()`,
        })
        .where(and(eq(s.person.id, input.personId), isNull(s.person.deletedAt)))
        .returning({ id: s.person.id })
        .then(singleRow);

      return result;
    },
  ),
);

export const replaceMetadata = wrapCommand(
  "user.person.replaceMetadata",
  withZod(
    z.object({
      personId: uuidSchema,
      metadata: z.record(z.any()),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          _metadata: sql`(((${JSON.stringify(input.metadata)})::jsonb)#>> '{}')::jsonb`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const listActiveRolesForLocation = wrapQuery(
  "user.person.listActiveRolesForLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.array(z.enum(["student", "instructor", "location_admin"])),
    async (input) => {
      const query = useQuery();

      return await query
        .select({
          type: s.actor.type,
        })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.locationId, input.locationId),
            eq(s.actor.personId, input.personId),
            isNull(s.actor.deletedAt),
          ),
        )
        .then((rows) =>
          rows
            .filter(({ type }) =>
              ["student", "instructor", "location_admin"].includes(type),
            )
            .map(
              ({ type }) => type as "student" | "instructor" | "location_admin",
            ),
        );
    },
  ),
);

export const moveToAccountByEmail = wrapCommand(
  "user.person.moveToAccountByEmail",
  withZod(
    z.object({
      personId: uuidSchema,
      email: z.string().toLowerCase().trim().email(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      async function findUserForPerson(personId: string) {
        return query
          .select()
          .from(s.user)
          .where(
            exists(
              query
                .select({ id: sql`1` })
                .from(s.person)
                .where(
                  and(
                    eq(s.person.id, personId),
                    isNull(s.person.deletedAt),
                    eq(s.person.userId, s.user.authUserId),
                  ),
                ),
            ),
          )
          .then(possibleSingleRow);
      }

      async function updatePersonUser(personId: string, userId: string) {
        return query
          .update(s.person)
          .set({ userId: userId, updatedAt: sql`NOW()` })
          .where(eq(s.person.id, personId))
          .returning({ id: s.person.id })
          .then(singleRow);
      }

      const user = await findUserForPerson(input.personId);

      const newUser = await getOrCreateFromEmail({
        email: input.email,
        displayName: user?.displayName ?? undefined,
      });
      return await updatePersonUser(input.personId, newUser.id);
    },
  ),
);

export const updateDetails = wrapCommand(
  "user.person.updateDetails",
  withZod(
    z.object({
      personId: uuidSchema,
      data: insertSchema
        .pick({
          firstName: true,
          lastName: true,
          lastNamePrefix: true,
          dateOfBirth: true,
          birthCity: true,
          birthCountry: true,
        })
        .partial(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          firstName: input.data.firstName,
          lastName: input.data.lastName,
          lastNamePrefix: input.data.lastNamePrefix,
          dateOfBirth: input.data.dateOfBirth
            ? dayjs(input.data.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.data.birthCity,
          birthCountry: input.data.birthCountry,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const mergePersons = wrapCommand(
  "user.person.mergePersons",
  withZod(
    z.object({
      personId: uuidSchema,
      targetPersonId: uuidSchema,
    }),
    async (input) => {
      return await withTransaction(async (tx) => {
        // First validate that both persons exist and belong to the same user
        const [personOne, personTwo] = await tx
          .select({
            id: s.person.id,
            userId: s.person.userId,
          })
          .from(s.person)
          .where(
            and(
              inArray(s.person.id, [input.personId, input.targetPersonId]),
              isNull(s.person.deletedAt),
            ),
          );

        if (!personOne || !personTwo) {
          throw new Error("One or both persons not found");
        }

        if (personOne.userId !== personTwo.userId) {
          throw new Error("Persons do not belong to the same user");
        }

        await Promise.all([
          // Transfer actors
          (async () => {
            const actors = await tx
              .select({
                id: s.actor.id,
                type: s.actor.type,
                locationId: s.actor.locationId,
              })
              .from(s.actor)
              .where(eq(s.actor.personId, input.personId));

            if (actors.length > 0) {
              await tx
                .insert(s.actor)
                .values(
                  actors.map((actor) => ({
                    ...actor,
                    id: undefined,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();

              const [targetPersonActors, cohortAllocationsToUpdate] =
                await Promise.all([
                  tx
                    .select({
                      id: s.actor.id,
                      type: s.actor.type,
                      locationId: s.actor.locationId,
                    })
                    .from(s.actor)
                    .where(eq(s.actor.personId, input.targetPersonId)),
                  tx
                    .select({
                      id: s.cohortAllocation.id,
                      actorId: s.cohortAllocation.actorId,
                    })
                    .from(s.cohortAllocation)
                    .where(
                      inArray(
                        s.cohortAllocation.actorId,
                        actors.map((actor) => actor.id),
                      ),
                    ),
                ]);

              for (const cohortAllocation of cohortAllocationsToUpdate) {
                const currentActor = actors.find(
                  (actor) => actor.id === cohortAllocation.actorId,
                );

                if (!currentActor) {
                  throw new Error("Actor not found");
                }

                const targetActor = targetPersonActors.filter(
                  (actor) =>
                    actor.locationId === currentActor.locationId &&
                    actor.type === currentActor.type,
                );

                if (targetActor.length !== 1) {
                  throw new Error("Target actor not found");
                }

                await tx
                  .update(s.cohortAllocation)
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  .set({ actorId: targetActor[0]!.id })
                  .where(eq(s.cohortAllocation.id, cohortAllocation.id));
              }

              await tx
                .delete(s.actor)
                .where(eq(s.actor.personId, input.personId));
            }
          })(),

          // Transfer student curricula
          await tx
            .update(s.studentCurriculum)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.studentCurriculum.personId, input.personId)),

          // Transfer location links
          (async () => {
            const links = await tx
              .select()
              .from(s.personLocationLink)
              .where(eq(s.personLocationLink.personId, input.personId));

            if (links.length > 0) {
              await tx
                .delete(s.personLocationLink)
                .where(eq(s.personLocationLink.personId, input.personId));

              await tx
                .insert(s.personLocationLink)
                .values(
                  links.map((link) => ({
                    ...link,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          tx
            .update(s.externalCertificate)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.externalCertificate.personId, input.personId)),

          tx
            .update(s.logbook)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.logbook.personId, input.personId)),
        ]);

        await tx.delete(s.person).where(eq(s.person.id, input.personId));
      });
    },
  ),
);
