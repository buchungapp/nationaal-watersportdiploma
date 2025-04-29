"use server";

import { z } from "zod";
import { actionClientWithMeta } from "~/actions/safe-action";
import { submitProductFeedback } from "~/lib/nwd";

const prioritySchema = z.enum(["low", "normal", "high"]);
const typeSchema = z.enum(["bug", "product-feedback", "question"]);

const sendFeedbackSchema = z.object({
  type: typeSchema,
  query: z
    .record(z.string(), z.union([z.string(), z.string().array()]))
    .optional(),
  path: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  priority: prioritySchema,
  message: z.string(),
});

export const productFeedbackAction = actionClientWithMeta
  .schema(sendFeedbackSchema)
  .metadata({
    name: "send-feedback",
  })
  .action(async ({ parsedInput: data }) => await submitProductFeedback(data));
