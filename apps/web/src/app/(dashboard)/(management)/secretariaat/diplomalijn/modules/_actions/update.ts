"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateModule } from "~/lib/nwd";

export default async function update(
  moduleId: string,
  data: {
    title: string;
    handle: string;
    weight: number;
  },
) {
  try {
    await updateModule(moduleId, data);

    revalidatePath("/secretariaat/diplomalijn/modules");

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
