"use server";

import { z } from "zod";
import { createCompletedCertificate } from "~/lib/nwd";

export async function createCertificate(
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    locationId: z.string().uuid(),
    personId: z.string().uuid(),
    gearTypeId: z.string().uuid(),
    curriculumId: z.string().uuid(),
    competencies: z.array(z.string().uuid()),
  });

  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );
  console.log(data);

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    const parsed = expectedSchema.parse(data);

    await createCompletedCertificate(
      parsed.locationId,
      parsed.personId,
      parsed,
    );

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    console.log(error);

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
