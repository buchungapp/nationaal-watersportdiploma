import { schema as s } from '@nawadi/db'
import dayjs from 'dayjs'
import { SQL, and, eq, sql } from 'drizzle-orm'
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
      dateOfBirth: true,
      birthCity: true,
      birthCountry: true,
    })
    .required()
    .extend({
      userId: selectSchema.shape.authUserId,
    }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    const conditions: SQL[] = [eq(s.person.userId, input.userId)]

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
    .select()
    .from(s.person)
    .where(eq(s.person.id, id))

  return result
}
