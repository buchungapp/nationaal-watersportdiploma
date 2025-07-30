"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { removeStudentCurricula } from "~/lib/nwd";
import { voidActionSchema } from "../utils";

const removeStudentCurriculaArgsSchema: [
  studentCurriculaIds: z.ZodArray<z.ZodString, "atleastone">,
] = [z.array(z.string().uuid()).nonempty()];

export const removeStudentCurriculaAction = actionClientWithMeta
  .metadata({
    name: "remove-student-curricula",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(removeStudentCurriculaArgsSchema)
  .action(async ({ bindArgsParsedInputs: [studentCurriculaIds] }) => {
    await removeStudentCurricula({
      studentCurriculaIds,
    });

    revalidatePath("/", "page");
  });
