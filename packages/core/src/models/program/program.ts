import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { SQLWrapper, and, eq, getTableColumns, inArray } from 'drizzle-orm'
import { aggregate } from 'drizzle-toolbelt'
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
import { Category, Degree, Discipline } from './index.js'
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
          disciplineId: item.disciplineId,
          degreeId: item.degreeId,
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
  z.object({
    filter: z
      .object({
        id: singleOrArray(uuidSchema).optional(),
      })
      .default({}),
  }),
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
      .leftJoin(
        s.programCategory,
        eq(s.programCategory.programId, s.program.id),
      )
      .where(and(...whereClausules))
      .then((rows) => {
        return Object.values(
          rows.reduce(
            (acc, { program, program_category }) => {
              if (!acc[program.id]) {
                acc[program.id] = {
                  ...program,
                  categories: [],
                }
              }

              if (!!program_category) {
                acc[program.id]!.categories.push(program_category)
              }

              return acc
            },
            {} as Record<
              string,
              (typeof rows)[number]['program'] & {
                categories: NonNullable<
                  (typeof rows)[number]['program_category']
                >[]
              }
            >,
          ),
        )
      }) // Transform joined rows into a structured format with programs and their categories.

    // Fetch additional lists of categories, degrees, and disciplines in parallel to optimize loading times.
    const [programs, categories, degrees, disciplines] = await Promise.all([
      programsPromise,
      Category.list(),
      Degree.list(),
      Discipline.list(),
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

      // Find the corresponding discipline for each program enforcing that it must exist.
      const discipline = findItem({
        items: disciplines,
        predicate(item) {
          return item.id === program.disciplineId
        },
        enforce: true, // Enforce finding the discipline, throw error if not found.
      })

      const {
        categories: programCategories,
        degreeId,
        disciplineId,
        ...programProperties
      } = program

      // Construct the final program object with additional details.
      return {
        ...programProperties,
        degree,
        discipline,
        categories: categories.filter(
          (
            category, // Filter categories relevant to the current program.
          ) => programCategories.some((pc) => pc.categoryId === category.id),
        ),
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
      .select({
        ...getTableColumns(s.program),
        category: s.programCategory,
      })
      .from(s.program)
      .leftJoin(
        s.programCategory,
        eq(s.programCategory.programId, s.program.id),
      )
      .where(eq(s.program.handle, handle))
      .then(
        aggregate({
          pkey: 'id',
          fields: { categories: 'category.id' },
        }),
      )
      .then((rows) => possibleSingleRow(rows))

    if (!program) {
      return null
    }

    const [allCategories, degree, discipline] = await Promise.all([
      Category.list(),
      Degree.fromId(program.degreeId),
      Discipline.fromId(program.disciplineId),
    ])

    assert(degree, 'Degree not found')
    assert(discipline, 'Discipline not found')

    const { categories, degreeId, disciplineId, ...programProperties } = program

    return {
      ...programProperties,
      degree,
      discipline,
      categories: allCategories.filter((category) =>
        categories.some((pc) => pc.categoryId === category.id),
      ),
    }
  },
)

export const fromId = withZod(
  uuidSchema,
  outputSchema.nullable(),
  async (id) => {
    const query = useQuery()

    const program = await query
      .select({
        ...getTableColumns(s.program),
        category: s.programCategory,
      })
      .from(s.program)
      .leftJoin(
        s.programCategory,
        eq(s.programCategory.programId, s.program.id),
      )
      .where(eq(s.program.id, id))
      .then(
        aggregate({
          pkey: 'id',
          fields: { categories: 'category.id' },
        }),
      )
      .then((rows) => possibleSingleRow(rows))

    if (!program) {
      return null
    }

    const [allCategories, degree, discipline] = await Promise.all([
      Category.list(),
      Degree.fromId(program.degreeId),
      Discipline.fromId(program.disciplineId),
    ])

    assert(degree, 'Degree not found')
    assert(discipline, 'Discipline not found')

    const { categories, degreeId, disciplineId, ...programProperties } = program

    return {
      ...programProperties,
      degree,
      discipline,
      categories: allCategories.filter((category) =>
        categories.some((pc) => pc.categoryId === category.id),
      ),
    }
  },
)
