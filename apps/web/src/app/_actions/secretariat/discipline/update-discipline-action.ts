"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateDiscipline } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateDisciplineSchema = zfd.formData({
  title: zfd.text(),
  weight: zfd.numeric(z.number().min(0)),
});

const updateDisciplineArgsSchema: [disciplineId: z.ZodString] = [
  z.string().uuid(),
];

export const updateDisciplineAction = actionClientWithMeta
  .metadata({
    name: "update-discipline",
  })
  .schema(updateDisciplineSchema)
  .bindArgsSchemas(updateDisciplineArgsSchema)
  .action(
    async ({
      parsedInput: { title, weight },
      bindArgsParsedInputs: [disciplineId],
    }) => {
      await updateDiscipline(disciplineId, { title, weight });

      revalidatePath("/", "page");
      revalidateTag("disciplines");
    },
  );
