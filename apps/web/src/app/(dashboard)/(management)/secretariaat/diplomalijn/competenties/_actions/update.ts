"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateCompetency } from "~/lib/nwd";

export default async function update(
  competencyId: string,
  data: {
    title: string;
    handle: string;
    weight: number;
    type: "knowledge" | "skill";
  },
) {
  try {
    await updateCompetency(competencyId, data);

    revalidatePath("/secretariaat/diplomalijn/competenties");

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
