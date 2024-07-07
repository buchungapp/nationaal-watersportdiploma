"use server";

import { submitProductFeedback } from "~/lib/nwd";

export async function productFeedbackAction(input: {
  type: "bug" | "product-feedback" | "question";
  query?: Record<string, string | string[]>;
  path?: string;
  headers?: Record<string, string>;
  priority?: "low" | "normal" | "high";
  message: string;
}) {
  return await submitProductFeedback(input);
}
