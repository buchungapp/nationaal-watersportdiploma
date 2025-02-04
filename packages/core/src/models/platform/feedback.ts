import { schema as s } from "@nawadi/db";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../main.js";
import {
  singleRow,
  successfulCreateResponse,
  withZod,
} from "../../utils/index.js";

const mapToPriorityNumber = (priority: string) => {
  switch (priority) {
    case "low":
      return 0;
    case "normal":
      return 1;
    case "high":
      return 2;
    default:
      return 1;
  }
};

const baseFeedbackSchema = z.object({
  message: z.string().nullish(),
  path: z.string().nullish(),
  query: z
    .record(z.union([z.string().nullish(), z.array(z.string().nullish())]))
    .optional(),
  headers: z.record(z.string().nullish()).optional(),
  base: z.record(z.string().nullish()).optional(),
  priority: z
    .union([z.literal("low"), z.literal("normal"), z.literal("high")])
    .default("normal"),
  insertedBy: z.string().uuid(),
});

export const create = withZod(
  z.discriminatedUnion("type", [
    baseFeedbackSchema.extend({
      type: z.literal("bug"),
    }),
    baseFeedbackSchema.extend({
      type: z.literal("product-feedback"),
    }),
    baseFeedbackSchema.extend({
      type: z.literal("question"),
    }),
    baseFeedbackSchema.extend({
      type: z.literal("other"),
    }),
    baseFeedbackSchema.extend({
      type: z.literal("program-feedback"),
      programId: z.string().uuid(),
      moduleId: z.string().uuid().optional(),
      competencyId: z.string().uuid().optional(),
    }),
  ]),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    const insert = await query
      .insert(s.feedback)
      .values({
        type: input.type,
        message: input.message,
        path: input.path,
        query: sql`(((${JSON.stringify(input.query)})::jsonb)#>> '{}')::jsonb`,
        headers: sql`(((${JSON.stringify(input.headers)})::jsonb)#>> '{}')::jsonb`,
        base: sql`(((${JSON.stringify(input.base)})::jsonb)#>> '{}')::jsonb`,
        metadata: sql`(((${JSON.stringify(
          input.type === "program-feedback"
            ? {
                programId: input.programId,
                moduleId: input.moduleId,
                competencyId: input.competencyId,
              }
            : {},
        )})::jsonb)#>> '{}')::jsonb`,
        priority: mapToPriorityNumber(input.priority),
        insertedBy: input.insertedBy,
      })
      .returning({ id: s.feedback.id })
      .then(singleRow);

    return insert;
  },
);
