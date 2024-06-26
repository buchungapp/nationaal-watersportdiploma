/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateLocationDetails } from "~/lib/nwd";

export async function updateSettings(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    name: z.string().min(1),
    websiteUrl: z.string().url(),
    email: z.string().email(),
    shortDescription: z.string().nullable(),
  });

  try {
    const parsed = expectedSchema.parse(Object.fromEntries(formData.entries()));

    await updateLocationDetails({
      id: locationId,
      ...parsed,
    });

    revalidatePath("/locatie/[location]", "layout");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
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

    return {
      message: "Error",
      errors: {},
    };
  }
}
