"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateModule } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateModuleSchema = zfd.formData({
  title: zfd.text(),
  weight: zfd.numeric(z.number().min(0)),
});

const updateModuleArgsSchema: [moduleId: z.ZodString] = [z.string().uuid()];

export const updateModuleAction = actionClientWithMeta
  .metadata({
    name: "update-module",
  })
  .schema(updateModuleSchema)
  .bindArgsSchemas(updateModuleArgsSchema)
  .action(
    async ({
      parsedInput: { title, weight },
      bindArgsParsedInputs: [moduleId],
    }) => {
      await updateModule(moduleId, { title, weight });

      revalidatePath("/", "page");
      revalidateTag("modules");
    },
  );
