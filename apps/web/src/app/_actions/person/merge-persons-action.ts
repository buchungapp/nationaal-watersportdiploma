"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { mergePersons } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const mergePersonsSchema = zfd.formData({
  confirm: zfd
    .checkbox()
    .refine((val) => val, "You must confirm to merge persons"),
});

const mergePersonsArgsSchema: [
  primaryPersonId: z.ZodString,
  secondaryPersonId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const mergePersonsAction = actionClientWithMeta
  .metadata({
    name: "merge-persons",
  })
  .schema(mergePersonsSchema)
  .bindArgsSchemas(mergePersonsArgsSchema)
  .action(
    async ({
      parsedInput: { confirm },
      bindArgsParsedInputs: [primaryPersonId, secondaryPersonId],
    }) => {
      if (!confirm) {
        throw new Error("You must confirm to merge persons");
      }

      await mergePersons(primaryPersonId, secondaryPersonId);

      revalidatePath("/", "page");
    },
  );
