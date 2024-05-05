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
    "competencies[]": z.array(z.string().uuid()),
  });

  const data: Record<string, string | string[] | null> = {};
  for (const [key, value] of formData.entries()) {
    const currentValue = data[key];

    if (typeof currentValue === "undefined" || currentValue === null) {
      data[key] = value as string;
      continue;
    }

    if (Array.isArray(currentValue)) {
      currentValue.push(value as string);
      continue;
    }

    data[key] = [currentValue, value as string];
  }

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    const parsed = expectedSchema.parse(data);

    await createCompletedCertificate(parsed.locationId, parsed.personId, {
      curriculumId: parsed.curriculumId,
      gearTypeId: parsed.gearTypeId,
      competencies: parsed["competencies[]"],
    });

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
