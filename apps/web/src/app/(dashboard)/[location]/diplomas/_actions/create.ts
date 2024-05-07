"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createCompletedCertificate } from "~/lib/nwd";

export async function createCertificate(
  locationId: string,
  curriculumId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    personId: z.string().uuid(),
    gearTypeId: z.string().uuid(),
    "competencies[]": z.array(z.string().uuid()),
  });

  try {
    const parsed = expectedSchema.parse({
      personId: formData.get("personId"),
      gearTypeId: formData.get("gearTypeId"),
      "competencies[]": formData
        .getAll("competencies[]")
        .flatMap((arr) => String(arr).split(",")),
    });

    await createCompletedCertificate(locationId, parsed.personId, {
      curriculumId: curriculumId,
      gearTypeId: parsed.gearTypeId,
      competencies: parsed["competencies[]"],
    });

    revalidatePath("/[location]/diplomas", "page");

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

    return {
      message: "Error",
      errors: {},
    };
  }
}
