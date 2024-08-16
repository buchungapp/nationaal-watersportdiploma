"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { updateCategory } from "~/lib/nwd";

export default async function update(
  categoryId: string,
  data: {
    title: string;
    description: string;
    handle: string;
    weight: number;
    parentCategoryId: string;
  },
) {
  try {
    await updateCategory(categoryId, data);

    revalidatePath("/secretariaat/diplomalijn/categorieen");

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
