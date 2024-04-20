import { schema as s } from '@nawadi/db'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  aggregateOneToMany,
  findItem,
  handleSchema,
  possibleSingleRow,
  singleRow,
  titleSchema,
  uuidSchema,
  withZod,
} from '../../util/index.js'
import { Category, Degree, Discipline } from './index.js'

export const list = withZod(z.void(), async () => {
  const query = useQuery()

  // Prepare a database query to fetch programs and their categories using joins.
  const programsPromise = query
    .select()
    .from(s.program)
    .leftJoin(s.programCategory, eq(s.programCategory.programId, s.program.id))
    .then((rows) => aggregateOneToMany(rows, 'program', 'program_category')) // Transform joined rows into a structured format with programs and their categories.

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

    const { program_category, degreeId, disciplineId, ...programProperties } =
      program

    // Construct the final program object with additional details.
    return {
      ...programProperties,
      degree,
      discipline,
      categories: categories
        .filter(
          (
            category, // Filter categories relevant to the current program.
          ) => program_category.some((pc) => pc.categoryId === category.id),
        )
        .map(({ parentCategoryId, ...categoryKeys }) => {
          const parentCategory = categories.find(
            // Find the possible parent category for each category.
            (c) => c.id === parentCategoryId,
          )

          return {
            ...categoryKeys,
            parent: parentCategory
              ? {
                  id: parentCategory.id,
                  title: parentCategory.title,
                  handle: parentCategory.handle,
                  description: parentCategory.description,
                }
              : null,
          }
        }),
    }
  })
})

export const create = withZod(
  z.object({
    title: titleSchema,
    handle: handleSchema,
    disciplineId: uuidSchema,
    degreeId: uuidSchema,
    categories: uuidSchema.array().optional(),
  }),
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

export const fromHandle = withZod(handleSchema, async (handle) => {
  const query = useQuery()

  const program = await query
    .select()
    .from(s.program)
    .leftJoin(s.programCategory, eq(s.programCategory.programId, s.program.id))
    .where(eq(s.program.handle, handle))
    .then((rows) => aggregateOneToMany(rows, 'program', 'program_category'))
    .then((rows) => possibleSingleRow(rows))

  if (!program) {
    return null
  }

  const [categories, degree, discipline] = await Promise.all([
    Category.list(),
    Degree.fromId(program.degreeId),
    Discipline.fromId(program.disciplineId),
  ])

  const { program_category, degreeId, disciplineId, ...programProperties } =
    program

  return {
    ...programProperties,
    degree,
    discipline,
    categories: categories
      .filter((category) =>
        program_category.some((pc) => pc.categoryId === category.id),
      )
      .map(({ parentCategoryId, ...categoryKeys }) => {
        const parentCategory = categories.find((c) => c.id === parentCategoryId)

        return {
          ...categoryKeys,
          parent: parentCategory
            ? {
                id: parentCategory.id,
                title: parentCategory.title,
                handle: parentCategory.handle,
                description: parentCategory.description,
              }
            : null,
        }
      }),
  }
})
