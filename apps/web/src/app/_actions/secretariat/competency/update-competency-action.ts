"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCompetency } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateCompetencySchema = zfd.formData({
  title: zfd.text(),
  type: zfd.text(z.enum(["skill", "knowledge"])),
  weight: zfd.numeric(z.number().min(0)),
});

const updateCompetencyArgsSchema: [competencyId: z.ZodString] = [
  z.string().uuid(),
];

export const updateCompetencyAction = actionClientWithMeta
  .metadata({
    name: "update-competency",
  })
  .schema(updateCompetencySchema)
  .bindArgsSchemas(updateCompetencyArgsSchema)
  .action(
    async ({
      parsedInput: { title, type, weight },
      bindArgsParsedInputs: [competencyId],
    }) => {
      await updateCompetency(competencyId, { title, type, weight });

      revalidatePath("/", "page");
      revalidateTag("competencies");
    },
  );
