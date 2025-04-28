import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertSchema = createInsertSchema(s.certificate, {
  studentCurriculumId: (schema) => schema.studentCurriculumId.uuid(),
  locationId: (schema) => schema.locationId.uuid(),
  issuedAt: (schema) => schema.issuedAt.datetime(),
  visibleFrom: (schema) => schema.visibleFrom.datetime(),
});

export const selectSchema = createSelectSchema(s.certificate);
