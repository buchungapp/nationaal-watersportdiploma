"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateUserDisplayName, updateUserEmail } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateUserSchema = zfd.formData({
  displayName: zfd.text(z.string().trim().optional()),
  email: zfd.text(z.string().email().optional()),
});

const updateUserArgsSchema: [userId: z.ZodOptional<z.ZodString>] = [
  z.string().uuid().optional(),
];

export const updateUserAction = actionClientWithMeta
  .metadata({
    name: "update-user",
  })
  .schema(updateUserSchema)
  .bindArgsSchemas(updateUserArgsSchema)
  .action(
    async ({
      parsedInput: { displayName, email },
      bindArgsParsedInputs: [userId],
    }) => {
      if (displayName && displayName.length > 0) {
        await updateUserDisplayName(displayName, userId);
      }

      if (email && email.length > 0) {
        await updateUserEmail(email, userId);
      }

      revalidatePath("/", "page");
    },
  );
