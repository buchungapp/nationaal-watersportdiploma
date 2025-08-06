"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateGearType } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateGearTypeSchema = zfd.formData({
  title: zfd.text(),
});

const updateGearTypeArgsSchema: [gearTypeId: z.ZodString] = [z.string().uuid()];

export const updateGearTypeAction = actionClientWithMeta
  .metadata({
    name: "update-gear-type",
  })
  .schema(updateGearTypeSchema)
  .bindArgsSchemas(updateGearTypeArgsSchema)
  .action(
    async ({ parsedInput: { title }, bindArgsParsedInputs: [gearTypeId] }) => {
      await updateGearType(gearTypeId, title);

      revalidatePath("/", "page");
      revalidateTag("gear-types");
    },
  );
