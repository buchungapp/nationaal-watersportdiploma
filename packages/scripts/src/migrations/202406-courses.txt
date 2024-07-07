import { Course, withDatabase, withTransaction } from '@nawadi/core'
import { schema as s } from '@nawadi/db'
import { eq, getTableColumns, isNull } from 'drizzle-orm'
import { aggregate } from 'drizzle-toolbelt'

import 'dotenv/config'

async function main() {
  return withTransaction(async (tx) => {
    const programsToMigrate = await tx
      .select({
        ...getTableColumns(s.program),
        category: s.programCategory,
      })
      .from(s.program)
      .leftJoin(
        s.programCategory,
        eq(s.programCategory.programId, s.program.id),
      )
      .where(isNull(s.program.courseId))
      .then(
        aggregate({
          pkey: 'id',
          fields: { categories: 'category.id' },
        }),
      )

    const categoriesLength = programsToMigrate.reduce(
      (acc, program) => acc + program.categories.length,
      0,
    )

    console.log(
      `Found ${programsToMigrate.length} programs with ${categoriesLength} categories to migrate`,
    )

    for (const program of programsToMigrate) {
      const expectedCourseName = program.title?.slice(0, -1).trim()

      const course = await Course.findOne({ title: expectedCourseName }).then(
        async (course) => {
          if (course) {
            return course
          }

          return Course.create({
            title: expectedCourseName,
            handle: program.handle.slice(0, -2).trim(),
            disciplineId: program.disciplineId!,
            createdAt: program.createdAt,
            categories: program.categories.map(
              (category) => category.categoryId,
            ),
          })
        },
      )

      await tx
        .update(s.program)
        .set({ courseId: course.id, title: null })
        .where(eq(s.program.id, program.id))
    }

    console.log(`Migrated ${programsToMigrate.length} programs`)
  })
}

const pgUri = process.env.PGURI

if (!pgUri) {
  throw new Error('PGURI environment variable is required')
}

withDatabase(
  {
    pgUri,
  },
  async () => await main(),
)
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Error:', error)
    process.exit(1)
  })
