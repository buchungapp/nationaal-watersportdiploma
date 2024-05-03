import { schema as s } from '@nawadi/db'
import dayjs from 'dayjs'
import { SQL, SQLWrapper, getTableColumns, and, eq, isNull, sql } from 'drizzle-orm'
import { aggregate } from 'drizzle-toolbelt'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
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
    .required()
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
        dateOfBirth: dayjs(input.dateOfBirth).format('YYYY-MM-DD'),
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

  const [result] = await query
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

  return result
}

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          userId: z.string().uuid().optional(),
          locationId: uuidSchema.optional(),
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
      conditions.push(eq(s.actor.locationId, input.filter.locationId))
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
      .innerJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
      .innerJoin(
        s.actor,
        and(eq(s.actor.personId, s.person.id), isNull(s.actor.deletedAt)),
      )
      .where(and(...conditions))
      .then(aggregate({ pkey: 'id', fields: { actors: 'actor.id' } }))
  },
)
