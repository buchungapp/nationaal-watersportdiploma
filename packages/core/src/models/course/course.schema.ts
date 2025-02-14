import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";
import { outputSchema as categorySelectSchema } from "./category.schema.js";
import { selectSchema as disciplineSelectSchema } from "./discipline.schema.js";

export const insertSchema = createInsertSchema(s.course, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  title: (schema) => schema.title.trim(),
  disciplineId: (schema) => schema.disciplineId.uuid(),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.course);

export const outputSchema = selectSchema.omit({ disciplineId: true }).extend({
  discipline: disciplineSelectSchema,
  categories: categorySelectSchema.array(),
});

export type Output = z.output<typeof outputSchema>;
