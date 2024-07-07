import { schema as s } from '@nawadi/db'
import dayjs from 'dayjs'
import {
  SQL,
  and,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  sql,
} from 'drizzle-orm'
import { aggregate } from 'drizzle-toolbelt'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema } from './person.schema.js'
import { selectSchema } from './user.schema.js'

export const getOrCreate = withZod(
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
    const query = useQuery()

    const conditions: SQL[] = []

    if (input.userId) {
      conditions.push(eq(s.person.userId, input.userId))
    } else {
      conditions.push(isNull(s.person.userId))
    }

    // Add conditions dynamically based on defined inputs
    if (input.firstName) {
      conditions.push(
        eq(sql`LOWER(${s.person.firstName})`, input.firstName.toLowerCase()),
      )
    }
    if (input.lastName) {
      conditions.push(
        eq(sql`LOWER(${s.person.lastName})`, input.lastName.toLowerCase()),
      )
    }
    if (input.dateOfBirth) {
      conditions.push(
        eq(s.person.dateOfBirth, dayjs(input.dateOfBirth).format('YYYY-MM-DD')),
      )
    }

    const [existing] = await query
      .select({ id: s.person.id })
      .from(s.person)
      .where(and(...conditions))

    if (existing) {
      return {
        id: existing.id,
      }
    }

    const [newPerson] = await query
      .insert(s.person)
      .values({
        userId: input.userId,
        firstName: input.firstName,
        lastName: input.lastName,
        lastNamePrefix: input.lastNamePrefix,
        dateOfBirth: input.dateOfBirth
          ? dayjs(input.dateOfBirth).format('YYYY-MM-DD')
          : undefined,
        birthCity: input.birthCity,
        birthCountry: input.birthCountry,
      })
      .returning({ id: s.person.id })

    if (!newPerson) {
      throw new Error('Failed to create actor')
    }

    return {
      id: newPerson.id,
    }
  },
)

export const createLocationLink = withZod(
  z.object({
    personId: uuidSchema,
    locationId: uuidSchema,
  }),
  z.void(),
  async (input) => {
    const query = useQuery()

    await query
      .insert(s.personLocationLink)
      .values({
        personId: input.personId,
        locationId: input.locationId,
        status: 'linked',
        permissionLevel: 'none',
      })
      .onConflictDoNothing({
        target: [
          s.personLocationLink.personId,
          s.personLocationLink.locationId,
        ],
      })

    return
  },
)

export const fromId = async (id: string) => {
  const query = useQuery()

  return await query
    .select({
      ...getTableColumns(s.person),
      birthCountry: {
        code: s.country.alpha_2,
        name: s.country.nl,
      },
    })
    .from(s.person)
    .innerJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
    .where(eq(s.person.id, id))
    .then((rows) => {
      const result = singleRow(rows)
      if (result.birthCountry.code === null) {
        return {
          ...result,
          birthCountry: null,
        }
      }
      return result
    })
}

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          userId: z.string().uuid().optional(),
          locationId: singleOrArray(uuidSchema).optional(),
        })
        .default({}),
    })
    .default({}),
  async (input) => {
    const query = useQuery()

    const conditions: SQL[] = []

    if (input.filter.userId != null) {
      conditions.push(eq(s.person.userId, input.filter.userId))
    }

    if (input.filter.locationId) {
      if (Array.isArray(input.filter.locationId)) {
        const existsQuery = query
          .select({ personId: s.personLocationLink.personId })
          .from(s.personLocationLink)
          .where(
            and(
              inArray(s.personLocationLink.locationId, input.filter.locationId),
              eq(s.personLocationLink.status, 'linked'),
              eq(s.personLocationLink.personId, s.person.id),
            ),
          )
        conditions.push(exists(existsQuery))
      } else {
        const existsQuery = query
          .select({ personId: s.personLocationLink.personId })
          .from(s.personLocationLink)
          .where(
            and(
              eq(s.personLocationLink.locationId, input.filter.locationId),
              eq(s.personLocationLink.status, 'linked'),
              eq(s.personLocationLink.personId, s.person.id),
            ),
          )
        conditions.push(exists(existsQuery))
      }
    }

    return await query
      .select({
        ...getTableColumns(s.person),
        birthCountry: {
          code: s.country.alpha_2,
          name: s.country.nl,
        },
        actor: s.actor,
      })
      .from(s.person)
      .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.personId, s.person.id),
          isNull(s.actor.deletedAt),
          !!input.filter.locationId
            ? Array.isArray(input.filter.locationId)
              ? inArray(s.actor.locationId, input.filter.locationId)
              : eq(s.actor.locationId, input.filter.locationId)
            : undefined,
        ),
      )
      .where(and(...conditions))
      .then(aggregate({ pkey: 'id', fields: { actors: 'actor.id' } }))
  },
)

export const listLocationsByRole = withZod(
  z.object({
    personId: uuidSchema,
    roles: z
      .array(z.enum(['student', 'instructor', 'location_admin']))
      .default(['instructor', 'student', 'location_admin']),
  }),
  z.array(
    z.object({
      locationId: uuidSchema,
      roles: z.array(z.enum(['student', 'instructor', 'location_admin'])),
    }),
  ),
  async (input) => {
    const query = useQuery()

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
          eq(s.personLocationLink.status, 'linked'),
        ),
      )
      .then(aggregate({ pkey: 'locationId', fields: { roles: 'role' } }))

    return result as any
  },
)

export const setPrimary = withZod(
  z.object({
    personId: uuidSchema,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const result = await query
      .update(s.person)
      .set({
        isPrimary: true,
      })
      .where(and(eq(s.person.id, input.personId), isNull(s.person.deletedAt)))
      .returning({ id: s.person.id })
      .then(singleRow)

    return result
  },
)

export const replaceMetadata = withZod(
  z.object({
    personId: uuidSchema,
    metadata: z.record(z.any()),
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.person)
      .set({
        _metadata: sql`(((${JSON.stringify(input.metadata)})::jsonb)#>> '{}')::jsonb`,
      })
      .where(eq(s.person.id, input.personId))
      .returning({ id: s.person.id })
      .then(singleRow)
  },
)

export const listActiveRolesForLocation = withZod(
  z.object({
    personId: uuidSchema,
    locationId: uuidSchema,
  }),
  z.array(z.enum(['student', 'instructor', 'location_admin'])),
  async (input) => {
    const query = useQuery()

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
            ['student', 'instructor', 'location_admin'].includes(type),
          )
          .map(
            ({ type }) => type as 'student' | 'instructor' | 'location_admin',
          ),
      )
  },
)
