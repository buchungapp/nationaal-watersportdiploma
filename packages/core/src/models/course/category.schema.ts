import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const insertSchema = createInsertSchema(s.category, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9-]+$/),
  title: (schema) => schema.title.trim(),
  parentCategoryId: (schema) => schema.parentCategoryId.uuid(),
  description: (schema) => schema.description.trim(),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.category);

const baseCategorySchema = selectSchema.omit({
  parentCategoryId: true,
});

export const outputSchema = baseCategorySchema.extend({
  parent: baseCategorySchema.nullable(),
});

export type Output = z.output<typeof outputSchema>;
