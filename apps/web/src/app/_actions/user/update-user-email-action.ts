"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateUserEmail } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateUserEmailSchema = zfd.formData({
  email: zfd.text(z.string().email()),
});

const updateUserEmailArgsSchema: [userId: z.ZodOptional<z.ZodString>] = [
  z.string().uuid().optional(),
];

export const updateUserEmailAction = actionClientWithMeta
  .metadata({
    name: "update-user-email",
  })
  .schema(updateUserEmailSchema)
  .bindArgsSchemas(updateUserEmailArgsSchema)
  .action(
    async ({ parsedInput: { email }, bindArgsParsedInputs: [userId] }) => {
      await updateUserEmail(email, userId);

      revalidatePath("/", "page");
    },
  );
