import { schema as s } from "@nawadi/db";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertSchema = createInsertSchema(s.actor, {
  locationId: (schema) => schema.locationId.uuid(),
  personId: (schema) => schema.personId.uuid(),
});
export const selectSchema = createSelectSchema(s.actor);
