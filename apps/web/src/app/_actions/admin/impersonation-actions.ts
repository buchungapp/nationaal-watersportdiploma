"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { startImpersonation, stopImpersonation } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const impersonateSchema = z.object({
  targetUserId: z.string().uuid(),
});

export const startImpersonationAction = actionClientWithMeta
  .metadata({ name: "start-impersonation" })
  .inputSchema(impersonateSchema)
  .action(async ({ parsedInput: { targetUserId } }) => {
    await startImpersonation(targetUserId);
    revalidatePath("/", "layout");
  });

export const stopImpersonationAction = actionClientWithMeta
  .metadata({ name: "stop-impersonation" })
  .inputSchema(z.object({}))
  .action(async () => {
    await stopImpersonation();
    revalidatePath("/", "layout");
  });
