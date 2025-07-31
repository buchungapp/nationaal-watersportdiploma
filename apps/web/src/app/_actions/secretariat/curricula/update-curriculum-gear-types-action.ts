"use server";
import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCurriculumGearTypes } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateCurriculaGearTypesSchema = zfd.formData({
  gearTypes: zfd.repeatableOfType(zfd.text()),
});

const updateCurriculaGearTypesArgsSchema: [curriculumId: z.ZodString] = [
  z.string().uuid(),
];

export const updateCurriculaGearTypesAction = actionClientWithMeta
  .metadata({
    name: "update-curricula-gear-types",
  })
  .schema(updateCurriculaGearTypesSchema)
  .bindArgsSchemas(updateCurriculaGearTypesArgsSchema)
  .action(
    async ({
      parsedInput: { gearTypes },
      bindArgsParsedInputs: [curriculumId],
    }) => {
      await updateCurriculumGearTypes(curriculumId, gearTypes);

      revalidatePath("/", "page");
      revalidateTag("curricula");
    },
  );
