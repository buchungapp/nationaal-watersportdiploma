import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { SQLWrapper, and, eq, inArray } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  findItem,
  handleSchema,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import {
  Degree,
  findOne as findOneCourse,
  list as listCourse,
} from './index.js'
import { insertSchema, outputSchema } from './program.schema.js'

export const create = withZod(
  insertSchema.extend({
    categories: uuidSchema.array().optional(),
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const rows = await tx
        .insert(s.program)
        .values({
          title: item.title,
          handle: item.handle,
          degreeId: item.degreeId,
          courseId: item.courseId,
        })
        .returning({ id: s.program.id })

      const row = singleRow(rows)

      if (!!item.categories && item.categories.length > 0) {
        await tx.insert(s.programCategory).values(
          item.categories.map((categoryId) => ({
            programId: row.id,
            categoryId,
          })),
        )
      }

      return row
    }),
)

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          id: singleOrArray(uuidSchema).optional(),
        })
        .default({}),
    })
    .default({}),
  outputSchema.array(),
  async ({ filter }) => {
    const query = useQuery()

    const whereClausules: SQLWrapper[] = []

    if (filter.id) {
      if (Array.isArray(filter.id)) {
        whereClausules.push(inArray(s.program.id, filter.id))
      } else {
        whereClausules.push(eq(s.program.id, filter.id))
      }
    }

    // Prepare a database query to fetch programs and their categories using joins.
    const programsPromise = query
      .select()
      .from(s.program)
      .where(and(...whereClausules))

    // Fetch additional lists of categories, degrees, and disciplines in parallel to optimize loading times.
    const [programs, degrees, courses] = await Promise.all([
      programsPromise,
      Degree.list(),
      listCourse(),
    ])

    // Map over the programs to enrich them with additional data like degree, discipline, and categories.
    return programs.map((program) => {
      // Find the corresponding degree for each program enforcing that it must exist.
      const degree = findItem({
        items: degrees,
        predicate(item) {
          return item.id === program.degreeId
        },
        enforce: true, // Enforce finding the degree, throw error if not found.
      })

      // Find the corresponding course for each program enforcing that it must exist.
      const course = findItem({
        items: courses,
        predicate(item) {
          return item.id === program.courseId
        },
        enforce: true, // Enforce finding the course, throw error if not found.
      })

      const { courseId, degreeId, disciplineId, ...programProperties } = program

      // Construct the final program object with additional details.
      return {
        ...programProperties,
        degree,
        course,
      }
    })
  },
)

export const fromHandle = withZod(
  handleSchema,
  outputSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const program = await query
      .select()
      .from(s.program)

      .where(eq(s.program.handle, handle))
      .then(possibleSingleRow)

    if (!program) {
      return null
    }

    const [course, degree] = await Promise.all([
      findOneCourse({
        id: program.courseId!,
      }),
      Degree.fromId(program.degreeId),
    ])

    assert(degree, 'Degree not found')
    assert(course, 'Course not found')

    const { courseId, degreeId, disciplineId, ...programProperties } = program

    return {
      ...programProperties,
      degree,
      course,
    }
  },
)

export const fromId = withZod(
  uuidSchema,
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const program = await query
      .select()
      .from(s.program)

      .where(eq(s.program.id, id))
      .then(possibleSingleRow)

    if (!program) {
      return null
    }

    const [course, degree] = await Promise.all([
      findOneCourse({ id: program.courseId! }),
      Degree.fromId(program.degreeId),
    ])

    assert(degree, 'Degree not found')
    assert(course, 'Course not found')

    const { courseId, degreeId, disciplineId, ...programProperties } = program

    return {
      ...programProperties,
      degree,
      course,
    }
  },
)
