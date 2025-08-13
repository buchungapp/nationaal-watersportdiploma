"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateUserDisplayName } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateUserDisplayNameSchema = zfd.formData({
  displayName: zfd.text(z.string().trim()),
});

const updateUserDisplayNameArgsSchema: [userId: z.ZodOptional<z.ZodString>] = [
  z.string().uuid().optional(),
];

export const updateUserDisplayNameAction = actionClientWithMeta
  .metadata({
    name: "update-user-display-name",
  })
  .schema(updateUserDisplayNameSchema)
  .bindArgsSchemas(updateUserDisplayNameArgsSchema)
  .action(
    async ({
      parsedInput: { displayName },
      bindArgsParsedInputs: [userId],
    }) => {
      await updateUserDisplayName(displayName, userId);

      revalidatePath("/", "page");
    },
  );
