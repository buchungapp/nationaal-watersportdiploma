import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { selectSchema as competencySelectSchema } from "../course/competency.schema.js";
import { selectSchema as moduleSelectSchema } from "../course/module.schema.js";
export const insertSchema = createInsertSchema(s.curriculum, {
  programId: (schema) => schema.programId.uuid(),
  revision: (schema) => schema.revision.trim(),
  startedAt: (schema) => schema.startedAt.datetime({ offset: true }),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.curriculum);

export const outputSchema = selectSchema.extend({
  modules: moduleSelectSchema
    .extend({
      isRequired: z.boolean(),
      type: competencySelectSchema.shape.type.nullable(),
      competencies: competencySelectSchema
        .extend({
          isRequired: z.boolean(),
          requirement: z.string().nullable(),
        })
        .array(),
    })
    .array(),
});

export type Output = z.output<typeof outputSchema>;
