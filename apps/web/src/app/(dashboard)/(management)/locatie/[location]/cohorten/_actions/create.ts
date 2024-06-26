"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCohort } from "~/lib/nwd";

export async function createCohortAction(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    label: z.string(),
    accessStartTime: z.preprocess(
      (value) => new Date(String(value)).toISOString(),
      z.string().datetime(),
    ),
    accessEndTime: z.preprocess(
      (value) => new Date(String(value)).toISOString(),
      z.string().datetime(),
    ),
  });

  try {
    const parsed = expectedSchema.parse({
      label: formData.get("label"),
      accessStartTime: formData.get("accessStartTime"),
      accessEndTime: formData.get("accessEndTime"),
    });

    await createCohort({
      locationId,
      label: parsed.label,
      accessStartTimestamp: parsed.accessStartTime,
      accessEndTimestamp: parsed.accessEndTime,
    });

    revalidatePath("/[location]/cohorten", "page");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    if (error instanceof Error) {
      return {
        message: "Error",
        errors: {
          generic: error.message,
        },
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}
