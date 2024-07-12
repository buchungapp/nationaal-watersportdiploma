/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updatePersonDetails } from "~/lib/nwd";

export async function updatePerson(
  {
    personId,
  }: {
    personId: string;
  },
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    firstName: z.string().trim().min(1),
    lastNamePrefix: z
      .string()
      .trim()
      .nullable()
      .transform((tussenvoegsel) =>
        tussenvoegsel === "" ? null : tussenvoegsel,
      ),
    lastName: z.string().min(1),
    dateOfBirth: z.string().pipe(z.coerce.date()),
    birthCity: z.string(),
    birthCountry: z.string().length(2).toLowerCase(),
  });

  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    const parsed = expectedSchema.parse(data);

    await updatePersonDetails({
      personId,
      ...parsed,
    });

    revalidatePath("/profiel/[handle]", "page");

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
