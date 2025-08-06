"use server";
import { revalidateTag } from "next/cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateGearTypeCurricula } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateGearTypeCurriculaSchema = zfd.formData({
  curricula: zfd.repeatableOfType(zfd.text()),
});

const updateGearTypeCurriculaArgsSchema: [gearTypeId: z.ZodString] = [
  z.string().uuid(),
];

export const updateGearTypeCurriculaAction = actionClientWithMeta
  .metadata({
    name: "update-gear-type-curricula",
  })
  .schema(updateGearTypeCurriculaSchema)
  .bindArgsSchemas(updateGearTypeCurriculaArgsSchema)
  .action(
    async ({
      parsedInput: { curricula },
      bindArgsParsedInputs: [gearTypeId],
    }) => {
      await updateGearTypeCurricula(gearTypeId, curricula);

      revalidatePath("/", "page");
      revalidateTag("curricula");
      revalidateTag("gear-types");
    },
  );
