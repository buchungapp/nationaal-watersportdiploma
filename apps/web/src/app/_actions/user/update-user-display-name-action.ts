"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCurrentUserDisplayName } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const updateUserDisplayNameSchema = zfd.formData({
  displayName: zfd.text(z.string().trim()),
});

export const updateUserDisplayNameAction = actionClientWithMeta
  .metadata({
    name: "update-user-display-name",
  })
  .inputSchema(updateUserDisplayNameSchema)
  .action(async ({ parsedInput: { displayName } }) => {
    await updateCurrentUserDisplayName(displayName);

    revalidatePath("/account", "page");
  });
