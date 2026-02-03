"use server";

import { User } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const setPrimaryPersonSchema = z.object({
  personId: zfd.text(z.string().uuid()),
});

export const setPrimaryPersonForUserAction = actionClientWithMeta
  .metadata({ name: "set-primary-person-for-user" })
  .inputSchema(setPrimaryPersonSchema)
  .action(async ({ parsedInput: { personId } }) => {
    const user = await getUserOrThrow();

    await User.setPrimaryPerson({
      userId: user.authUserId,
      personId,
    });

    revalidatePath("/account", "page");
  });
