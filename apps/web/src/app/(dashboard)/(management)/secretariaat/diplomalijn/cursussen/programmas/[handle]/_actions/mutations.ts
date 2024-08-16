"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { copyCurriculum } from "~/lib/nwd";

export async function copyCurriculumAction(
  { curriculumId }: { curriculumId: string },
  _prevState: unknown,
  formData: FormData,
) {
  const revisionName = formData.get("revision") as string;

  try {
    const res = await copyCurriculum({
      curriculumId,
      revision: revisionName,
    });

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
      id: res.id,
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
        id: null,
      };
    }

    return {
      message: "Error",
      errors: {},
      id: null,
    };
  }
}
