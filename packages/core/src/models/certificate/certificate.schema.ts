import { schema as s } from "@nawadi/db";
import { createSelectSchema } from "drizzle-zod";

export const selectSchema = createSelectSchema(s.certificate);
