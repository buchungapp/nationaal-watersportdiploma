import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  and,
  countDistinct,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  formatSearchTerms,
  generatePersonID,
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
import { insertSchema, personSchema } from "./person.schema.js";
import { getOrCreateFromEmail } from "./user.js";
import { selectSchema } from "./user.schema.js";

export * as $schema from "./person.schema.js";

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
        userId: selectSchema.shape.authUserId.optional(),
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

export const create = wrapCommand(
  "user.person.create",
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
        userId: selectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const newPerson = await query
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
        .returning({ id: s.person.id })
        .then(singleRow);

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

export const isLinkedToLocation = wrapQuery(
  "user.person.isLinkedToLocation",
  withZod(
    z.object({ personId: uuidSchema, locationId: uuidSchema }),
    z.boolean(),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select()
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.locationId, input.locationId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(possibleSingleRow);

      return result !== null;
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
        // biome-ignore lint/style/noNonNullAssertion: intentional
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
              z.enum([
                "student",
                "instructor",
                "location_admin",
                "pvb_beoordelaar",
              ]),
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
                "system",
                "pvb_beoordelaar",
                "secretariaat",
              ]),
              locationId: uuidSchema.nullable(),
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
            ? and(
                inArray(s.actor.type, filter.actorType),
                isNull(s.actor.deletedAt),
              )
            : and(eq(s.actor.type, filter.actorType), isNull(s.actor.deletedAt))
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
        isNull(s.person.deletedAt),
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
        .leftJoin(
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
        .leftJoin(
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
          // biome-ignore lint/style/noNonNullAssertion: intentional
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

export const searchForAutocomplete = wrapQuery(
  "user.person.searchForAutocomplete",
  withZod(
    z.object({
      q: z.string().min(1),
      limit: z.number().int().positive().default(10),
      excludePersonId: uuidSchema.optional(),
    }),
    z.array(
      personSchema.pick({
        id: true,
        handle: true,
        firstName: true,
        lastNamePrefix: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        userId: true,
        isPrimary: true,
      }),
    ),
    async ({ q, limit, excludePersonId }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        sql`
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
          ) @@ to_tsquery('simple', ${formatSearchTerms(q, "and")})
        `,
        isNull(s.person.deletedAt),
        excludePersonId ? ne(s.person.id, excludePersonId) : undefined,
      ];

      const persons = await query
        .select({
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          email: s.user.email,
          dateOfBirth: s.person.dateOfBirth,
          userId: s.person.userId,
          isPrimary: s.person.isPrimary,
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .where(and(...whereClausules))
        .limit(limit);

      return persons.map((person) => ({
        ...person,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: person.handle!,
      }));
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

      // biome-ignore lint/suspicious/noExplicitAny: intentional
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
          .set({ userId: userId, updatedAt: sql`NOW()`, isPrimary: false })
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
        // First validate that both persons exist
        const persons = await tx
          .select({
            id: s.person.id,
            userId: s.person.userId,
            isPrimary: s.person.isPrimary,
          })
          .from(s.person)
          .where(
            and(
              inArray(s.person.id, [input.personId, input.targetPersonId]),
              isNull(s.person.deletedAt),
            ),
          );

        if (persons.length !== 2) {
          throw new Error("One or both persons not found");
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
                  // biome-ignore lint/style/noNonNullAssertion: intentional
                  .set({ actorId: targetActor[0]!.id })
                  .where(eq(s.cohortAllocation.id, cohortAllocation.id));
              }

              await tx
                .delete(s.actor)
                .where(eq(s.actor.personId, input.personId));
            }
          })(),

          // Transfer student curricula
          tx
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

          // Transfer person roles (PK: personId + roleId)
          (async () => {
            const roles = await tx
              .select()
              .from(s.personRole)
              .where(eq(s.personRole.personId, input.personId));

            if (roles.length > 0) {
              await tx
                .delete(s.personRole)
                .where(eq(s.personRole.personId, input.personId));

              await tx
                .insert(s.personRole)
                .values(
                  roles.map((role) => ({
                    ...role,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          // Transfer KSS qualifications (unique: personId + courseId + kerntaakOnderdeelId)
          (async () => {
            const kwalificaties = await tx
              .select()
              .from(s.persoonKwalificatie)
              .where(eq(s.persoonKwalificatie.personId, input.personId));

            if (kwalificaties.length > 0) {
              await tx
                .delete(s.persoonKwalificatie)
                .where(eq(s.persoonKwalificatie.personId, input.personId));

              await tx
                .insert(s.persoonKwalificatie)
                .values(
                  kwalificaties.map((kwalificatie) => ({
                    ...kwalificatie,
                    id: undefined,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),
        ]);

        // Handle isPrimary constraint before delete
        const duplicatePerson = persons.find((p) => p.id === input.personId);

        if (duplicatePerson?.isPrimary && duplicatePerson?.userId) {
          // FIRST: Unset isPrimary on the person we're about to delete
          // This avoids constraint violation if we try to set another as primary first
          await tx
            .update(s.person)
            .set({ isPrimary: false, updatedAt: sql`NOW()` })
            .where(eq(s.person.id, input.personId));

          // THEN: Find another person for this user to make primary
          const otherPerson = await tx
            .select({ id: s.person.id })
            .from(s.person)
            .where(
              and(
                eq(s.person.userId, duplicatePerson.userId),
                ne(s.person.id, input.personId),
                isNull(s.person.deletedAt),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (otherPerson) {
            await tx
              .update(s.person)
              .set({ isPrimary: true, updatedAt: sql`NOW()` })
              .where(eq(s.person.id, otherPerson.id));
          }
          // If no other person exists, user account becomes orphaned (accepted risk)
        }

        await tx.delete(s.person).where(eq(s.person.id, input.personId));
      });
    },
  ),
);

const LOOKUP_FUZZY_THRESHOLD = 0.4;
const LOOKUP_TOMBSTONE_MAX_DEPTH = 5;

const lookupCandidateSchema = z.object({
  id: uuidSchema,
  handle: z.string(),
  firstName: z.string(),
  lastNamePrefix: z.string().nullable(),
  lastName: z.string().nullable(),
  dateOfBirth: z.string().nullable(),
  email: z.string().email().nullable(),
  similarity: z.number().min(0).max(1).nullable(),
});

const lookupResultSchema = z.object({
  match: z.enum(["strict", "fuzzy", "none"]),
  candidate: lookupCandidateSchema.nullable(),
  candidates: z.array(lookupCandidateSchema),
});

export type LookupCandidate = z.infer<typeof lookupCandidateSchema>;
export type LookupResult = z.infer<typeof lookupResultSchema>;

export const lookup = wrapQuery(
  "user.person.lookup",
  withZod(
    z
      .object({
        vaarschoolId: uuidSchema,
        handle: z.string().trim().min(1).optional(),
        email: z.string().trim().email().optional(),
        firstName: z.string().trim().min(1).optional(),
        lastNamePrefix: z.string().trim().optional(),
        lastName: z.string().trim().min(1).optional(),
        dateOfBirth: z
          .string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
          .optional(),
        limit: z.number().int().min(1).max(20).default(5),
      })
      .refine(
        (input) =>
          input.handle ||
          input.email ||
          (input.firstName && input.lastName) ||
          input.dateOfBirth,
        {
          message:
            "Provide at least one of: handle, email, firstName+lastName, or dateOfBirth",
        },
      ),
    lookupResultSchema,
    async (input) => {
      return withTransaction(async (tx) => {
        const linkExists = exists(
          tx
            .select({ one: sql`1` })
            .from(s.personLocationLink)
            .where(
              and(
                eq(s.personLocationLink.personId, s.person.id),
                eq(s.personLocationLink.locationId, input.vaarschoolId),
                eq(s.personLocationLink.status, "linked"),
              ),
            ),
        );

        const followTombstone = async (
          startId: string,
        ): Promise<string | null> => {
          let currentId = startId;
          for (let i = 0; i < LOOKUP_TOMBSTONE_MAX_DEPTH; i++) {
            const [row] = await tx
              .select({
                id: s.person.id,
                merged: s.person.mergedIntoPersonId,
              })
              .from(s.person)
              .where(eq(s.person.id, currentId));
            if (!row) return null;
            if (!row.merged) return row.id;
            currentId = row.merged;
          }
          return null;
        };

        const baseColumns = {
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          dateOfBirth: s.person.dateOfBirth,
          email: s.user.email,
        } as const;

        const findStrictMatch = async (): Promise<LookupCandidate | null> => {
          const strictConditions: (SQL | undefined)[] = [
            isNull(s.person.deletedAt),
            isNull(s.person.mergedIntoPersonId),
            linkExists,
          ];

          if (input.handle) {
            const [row] = await tx
              .select(baseColumns)
              .from(s.person)
              .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
              .where(
                and(
                  ...strictConditions,
                  eq(s.person.handle, input.handle.toLowerCase()),
                ),
              )
              .limit(1);
            if (row) {
              return {
                id: row.id,
                // biome-ignore lint/style/noNonNullAssertion: handle present when matched
                handle: row.handle!,
                firstName: row.firstName,
                lastNamePrefix: row.lastNamePrefix,
                lastName: row.lastName,
                dateOfBirth: row.dateOfBirth,
                email: row.email,
                similarity: null,
              };
            }
          }

          if (input.email) {
            const [row] = await tx
              .select(baseColumns)
              .from(s.person)
              .innerJoin(s.user, eq(s.person.userId, s.user.authUserId))
              .where(
                and(
                  ...strictConditions,
                  eq(
                    sql`LOWER(${s.user.email})`,
                    input.email.toLowerCase(),
                  ),
                ),
              )
              .limit(1);
            if (row) {
              return {
                id: row.id,
                // biome-ignore lint/style/noNonNullAssertion: handle is set
                handle: row.handle!,
                firstName: row.firstName,
                lastNamePrefix: row.lastNamePrefix,
                lastName: row.lastName,
                dateOfBirth: row.dateOfBirth,
                email: row.email,
                similarity: null,
              };
            }
          }

          if (input.firstName && input.lastName && input.dateOfBirth) {
            const [row] = await tx
              .select(baseColumns)
              .from(s.person)
              .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
              .where(
                and(
                  ...strictConditions,
                  eq(
                    sql`LOWER(${s.person.firstName})`,
                    input.firstName.toLowerCase(),
                  ),
                  eq(
                    sql`LOWER(${s.person.lastName})`,
                    input.lastName.toLowerCase(),
                  ),
                  eq(s.person.dateOfBirth, input.dateOfBirth),
                ),
              )
              .limit(1);
            if (row) {
              return {
                id: row.id,
                // biome-ignore lint/style/noNonNullAssertion: handle is set
                handle: row.handle!,
                firstName: row.firstName,
                lastNamePrefix: row.lastNamePrefix,
                lastName: row.lastName,
                dateOfBirth: row.dateOfBirth,
                email: row.email,
                similarity: null,
              };
            }
          }

          return null;
        };

        const strictCandidate = await findStrictMatch();
        if (strictCandidate) {
          const canonicalId = await followTombstone(strictCandidate.id);
          if (canonicalId && canonicalId !== strictCandidate.id) {
            const [row] = await tx
              .select(baseColumns)
              .from(s.person)
              .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
              .where(eq(s.person.id, canonicalId))
              .limit(1);
            if (row) {
              return {
                match: "strict" as const,
                candidate: {
                  id: row.id,
                  // biome-ignore lint/style/noNonNullAssertion: handle is set
                  handle: row.handle!,
                  firstName: row.firstName,
                  lastNamePrefix: row.lastNamePrefix,
                  lastName: row.lastName,
                  dateOfBirth: row.dateOfBirth,
                  email: row.email,
                  similarity: null,
                },
                candidates: [],
              };
            }
          }
          return {
            match: "strict" as const,
            candidate: strictCandidate,
            candidates: [],
          };
        }

        if (!input.firstName && !input.lastName) {
          return {
            match: "none" as const,
            candidate: null,
            candidates: [],
          };
        }

        const fuzzyTerm = [
          input.firstName ?? "",
          input.lastNamePrefix ?? "",
          input.lastName ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim();

        if (!fuzzyTerm) {
          return {
            match: "none" as const,
            candidate: null,
            candidates: [],
          };
        }

        await tx.execute(
          sql`SET LOCAL pg_trgm.similarity_threshold = ${LOOKUP_FUZZY_THRESHOLD}`,
        );

        const trgmTarget = sql`(
          COALESCE(${s.person.firstName}, '') || ' ' ||
          COALESCE(${s.person.lastNamePrefix}, '') || ' ' ||
          COALESCE(${s.person.lastName}, '')
        )`;

        const fuzzyRows = await tx
          .select({
            ...baseColumns,
            similarity: sql<number>`similarity(${trgmTarget}, ${fuzzyTerm})`,
          })
          .from(s.person)
          .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
          .where(
            and(
              isNull(s.person.deletedAt),
              isNull(s.person.mergedIntoPersonId),
              linkExists,
              sql`${trgmTarget} % ${fuzzyTerm}`,
            ),
          )
          .orderBy(sql`similarity(${trgmTarget}, ${fuzzyTerm}) DESC`)
          .limit(input.limit);

        const candidates = fuzzyRows.map((row) => ({
          id: row.id,
          // biome-ignore lint/style/noNonNullAssertion: handle is set
          handle: row.handle!,
          firstName: row.firstName,
          lastNamePrefix: row.lastNamePrefix,
          lastName: row.lastName,
          dateOfBirth: row.dateOfBirth,
          email: row.email,
          similarity: typeof row.similarity === "number" ? row.similarity : null,
        }));

        return {
          match: candidates.length > 0 ? ("fuzzy" as const) : ("none" as const),
          candidate: null,
          candidates,
        };
      });
    },
  ),
);
