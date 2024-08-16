import { schema as s } from '@nawadi/db'
import { asc, count, desc, eq, isNotNull, isNull } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  withZod,
} from '../../utils/index.js'
import { insertSchema, outputSchema } from './category.schema.js'

export const create = withZod(
  insertSchema.pick({
    title: true,
    handle: true,
    description: true,
    parentCategoryId: true,
  }),
  successfulCreateResponse,
  async (item) =>
    withTransaction(async (tx) => {
      const currentHeighestWeight = await tx
        .select({ weight: s.category.weight })
        .from(s.category)
        .orderBy(desc(s.category.weight))
        .limit(1)
        .then((rows) => rows[0]?.weight ?? 0)

      const rows = await tx
        .insert(s.category)
        .values({
          title: item.title,
          handle: item.handle,
          description: item.description,
          parentCategoryId: item.parentCategoryId,
          weight: currentHeighestWeight + 1,
        })
        .returning({ id: s.category.id })

      const row = singleRow(rows)
      return row
    }),
)

export const update = withZod(
  insertSchema
    .pick({
      id: true,
      title: true,
      handle: true,
      description: true,
      parentCategoryId: true,
      weight: true,
    })
    .required({ id: true }),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const row = await query
      .update(s.category)
      .set({
        title: item.title,
        handle: item.handle,
        description: item.description,
        parentCategoryId: item.parentCategoryId,
        weight: item.weight,
      })
      .where(eq(s.category.id, item.id))
      .returning({
        id: s.category.id,
      })
      .then(singleRow)

    return row
  },
)

export const list = withZod(z.void(), outputSchema.array(), async () => {
  const query = useQuery()

  const rows = await query
    .select()
    .from(s.category)
    .orderBy(asc(s.category.weight))

  return rows.map(({ parentCategoryId, ...row }) => ({
    ...row,
    parent: rows.find(({ id }) => id === parentCategoryId) ?? null,
  }))
})

export const listParentCategories = withZod(
  z.void(),
  outputSchema
    .omit({ parent: true })
    .extend({
      hasActiveChildren: z.boolean(),
    })
    .array(),
  async () => {
    const query = useQuery()

    const categoryCountPerParent = query
      .select({
        parentCategoryId: s.category.parentCategoryId,
        count: count().as('count'),
      })
      .from(s.category)
      .where(isNotNull(s.category.parentCategoryId))
      .groupBy(s.category.parentCategoryId)
      .as('categoryCountPerParent')

    const rows = await query
      .select({
        id: s.category.id,
        title: s.category.title,
        handle: s.category.handle,
        description: s.category.description,
        weight: s.category.weight,

        createdAt: s.category.createdAt,
        updatedAt: s.category.updatedAt,
        deletedAt: s.category.deletedAt,

        parentCategoryId: s.category.parentCategoryId,

        activeChildrenCount: categoryCountPerParent.count,
      })
      .from(s.category)
      .leftJoin(
        categoryCountPerParent,
        eq(s.category.id, categoryCountPerParent.parentCategoryId),
      )
      .where(isNull(s.category.parentCategoryId))
      .orderBy(asc(s.category.weight))

    return rows.map(({ parentCategoryId, activeChildrenCount, ...row }) => ({
      ...row,
      hasActiveChildren: activeChildrenCount > 0,
      parent: rows.find(({ id }) => id === parentCategoryId) ?? null,
    }))
  },
)

export const fromHandle = withZod(
  handleSchema,
  outputSchema.nullable(),
  async (handle) => {
    const query = useQuery()

    const self = alias(s.category, 'parent')

    const rows = await query
      .select()
      .from(s.category)
      .leftJoin(self, eq(s.category.parentCategoryId, self.id))
      .where(eq(s.category.handle, handle))

    const row = possibleSingleRow(rows)

    if (!row) {
      return null
    }

    return {
      ...row.category,
      parent: row.parent,
    }
  },
)
