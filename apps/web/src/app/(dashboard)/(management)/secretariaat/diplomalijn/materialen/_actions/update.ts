"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateGearType } from "~/lib/nwd";

export default async function update(
  gearTypeId: string,
  data: {
    title: string;
    handle: string;
  },
) {
  try {
    await updateGearType(gearTypeId, data);

    revalidatePath("/secretariaat/diplomalijn/materialen");

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
