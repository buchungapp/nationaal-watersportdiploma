/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function updateSettings(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    name: z.string().min(1).nullable(),
    websiteUrl: z.string().url().nullable(),
    email: z.string().email().nullable(),
    shortDescription: z.string().nullable(),
    logo: z.any(z.instanceof(File)).nullable(),
    iconLogo: z.any(z.instanceof(File)).nullable(),
    diplomaLogo: z.any(z.instanceof(File)).nullable(),
  });

  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );

  // Set all empty strings to null, and empty files to null
  for (const key in data) {
    const value = data[key];
    if (
      value === "" ||
      (value !== null && value instanceof File && value.size === 0)
    ) {
      data[key] = null;
    }
  }

  console.log(data);

  try {
    const parsed = expectedSchema.parse(data);
    console.log(parsed);

    revalidatePath("/locatie/[location]/instellingen", "page");

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
