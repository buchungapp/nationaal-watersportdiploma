import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const insertSchema = createInsertSchema(s.module, {
  handle: (schema) =>
    schema.handle
      .trim()
      .toLowerCase()
      .min(3)
      .regex(/^[a-z0-9\-]+$/),
  title: (schema) => schema.title.trim(),
  weight: (schema) => schema.weight.int().min(1).optional(),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.module);
export type Output = z.output<typeof selectSchema>;
