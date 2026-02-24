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

        // Transfer actors first so allocations point to the target person's actors.
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

          await tx.delete(s.actor).where(eq(s.actor.personId, input.personId));
        }

        const sourceStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
          })
          .from(s.studentCurriculum)
          .where(eq(s.studentCurriculum.personId, input.personId));

        const targetStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
          })
          .from(s.studentCurriculum)
          .where(eq(s.studentCurriculum.personId, input.targetPersonId));

        const targetCurriculumByIdentity = new Map<
          string,
          {
            id: string;
            curriculumId: string;
            gearTypeId: string;
            createdAt: string;
          }
        >(
          targetStudentCurricula.map((curriculum) => [
            `${curriculum.curriculumId}:${curriculum.gearTypeId}`,
            curriculum,
          ]),
        );

        const conflictingCurriculumPairs: {
          sourceStudentCurriculumId: string;
          targetStudentCurriculumId: string;
        }[] = [];

        const nonConflictingStudentCurriculumIds: string[] = [];

        for (const sourceStudentCurriculum of sourceStudentCurricula) {
          const matchingTargetStudentCurriculum = targetCurriculumByIdentity.get(
            `${sourceStudentCurriculum.curriculumId}:${sourceStudentCurriculum.gearTypeId}`,
          );

          if (!matchingTargetStudentCurriculum) {
            nonConflictingStudentCurriculumIds.push(sourceStudentCurriculum.id);
            continue;
          }

          conflictingCurriculumPairs.push({
            sourceStudentCurriculumId: sourceStudentCurriculum.id,
            targetStudentCurriculumId: matchingTargetStudentCurriculum.id,
          });
        }

        if (nonConflictingStudentCurriculumIds.length > 0) {
          await tx
            .update(s.studentCurriculum)
            .set({
              personId: input.targetPersonId,
            })
            .where(
              inArray(
                s.studentCurriculum.id,
                nonConflictingStudentCurriculumIds,
              ),
            );
        }

        for (const {
          sourceStudentCurriculumId,
          targetStudentCurriculumId,
        } of conflictingCurriculumPairs) {
          const targetCompletedCompetencies = await tx
            .select({
              competencyId: s.studentCompletedCompetency.competencyId,
            })
            .from(s.studentCompletedCompetency)
            .where(
              and(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  targetStudentCurriculumId,
                ),
                isNull(s.studentCompletedCompetency.deletedAt),
              ),
            );

          if (targetCompletedCompetencies.length > 0) {
            await tx
              .update(s.studentCompletedCompetency)
              .set({
                isMergeConflictDuplicate: true,
              })
              .where(
                and(
                  eq(
                    s.studentCompletedCompetency.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  inArray(
                    s.studentCompletedCompetency.competencyId,
                    targetCompletedCompetencies.map(
                      (competency) => competency.competencyId,
                    ),
                  ),
                  isNull(s.studentCompletedCompetency.deletedAt),
                ),
              );
          }

          await Promise.all([
            tx
              .update(s.studentCompletedCompetency)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  sourceStudentCurriculumId,
                ),
              ),
            tx
              .update(s.certificate)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(s.certificate.studentCurriculumId, sourceStudentCurriculumId),
              ),
          ]);

          const [sourceAllocations, targetAllocations] = await Promise.all([
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    targetStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
          ]);

          const targetAllocationByIdentity = new Map<
            string,
            {
              id: string;
              cohortId: string;
              actorId: string;
              createdAt: string;
            }
          >(
            targetAllocations.map((allocation) => [
              `${allocation.cohortId}:${allocation.actorId}`,
              allocation,
            ]),
          );

          for (const sourceAllocation of sourceAllocations) {
            const collidingTargetAllocation = targetAllocationByIdentity.get(
              `${sourceAllocation.cohortId}:${sourceAllocation.actorId}`,
            );

            if (!collidingTargetAllocation) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, sourceAllocation.id));
              continue;
            }

            const [sourceHasLinkedCertificates, targetHasLinkedCertificates] =
              await Promise.all([
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(s.certificate.cohortAllocationId, sourceAllocation.id),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(
                        s.certificate.cohortAllocationId,
                        collidingTargetAllocation.id,
                      ),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
              ]);

            let winnerAllocation = sourceAllocation;
            let loserAllocation = collidingTargetAllocation;

            if (sourceHasLinkedCertificates !== targetHasLinkedCertificates) {
              if (targetHasLinkedCertificates) {
                winnerAllocation = collidingTargetAllocation;
                loserAllocation = sourceAllocation;
              }
            } else if (
              dayjs(sourceAllocation.createdAt).isAfter(
                collidingTargetAllocation.createdAt,
              ) ||
              (dayjs(sourceAllocation.createdAt).isSame(
                collidingTargetAllocation.createdAt,
              ) &&
                sourceAllocation.id > collidingTargetAllocation.id)
            ) {
              winnerAllocation = collidingTargetAllocation;
              loserAllocation = sourceAllocation;
            }

            const winnerProgressCompetencies = await tx
              .selectDistinct({
                competencyId: s.studentCohortProgress.competencyId,
              })
              .from(s.studentCohortProgress)
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  winnerAllocation.id,
                ),
              );

            if (winnerProgressCompetencies.length > 0) {
              await tx
                .delete(s.studentCohortProgress)
                .where(
                  and(
                    eq(
                      s.studentCohortProgress.cohortAllocationId,
                      loserAllocation.id,
                    ),
                    inArray(
                      s.studentCohortProgress.competencyId,
                      winnerProgressCompetencies.map(
                        (competency) => competency.competencyId,
                      ),
                    ),
                  ),
                );
            }

            await tx
              .update(s.studentCohortProgress)
              .set({
                cohortAllocationId: winnerAllocation.id,
              })
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  loserAllocation.id,
                ),
              );

            await Promise.all([
              tx
                .update(s.certificate)
                .set({
                  cohortAllocationId: null,
                })
                .where(
                  and(
                    eq(s.certificate.cohortAllocationId, loserAllocation.id),
                    isNull(s.certificate.deletedAt),
                  ),
                ),
              tx
                .update(s.cohortAllocation)
                .set({
                  deletedAt: new Date().toISOString(),
                  updatedAt: sql`NOW()`,
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, loserAllocation.id)),
            ]);

            if (winnerAllocation.id === sourceAllocation.id) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, winnerAllocation.id));
            }
          }

          await tx
            .update(s.cohortAllocation)
            .set({
              studentCurriculumId: targetStudentCurriculumId,
            })
            .where(
              eq(
                s.cohortAllocation.studentCurriculumId,
                sourceStudentCurriculumId,
              ),
            );

          await tx
            .delete(s.studentCurriculum)
            .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId));
        }

        await Promise.all([
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
