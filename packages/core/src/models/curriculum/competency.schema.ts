import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type { z } from "zod";

export const insertSchema = createInsertSchema(s.curriculumCompetency, {
  competencyId: (schema) => schema.competencyId.uuid(),
  curriculumId: (schema) => schema.curriculumId.uuid(),
  moduleId: (schema) => schema.moduleId.uuid(),
  requirement: (schema) => schema.requirement.trim(),
});
export type Input = z.input<typeof insertSchema>;

export const selectSchema = createSelectSchema(s.curriculumCompetency);
export type Output = z.output<typeof selectSchema>;
