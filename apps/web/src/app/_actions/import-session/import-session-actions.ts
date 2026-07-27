"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { materializeImportSessionPreview } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

export const materializeImportSessionPreviewAction = actionClientWithMeta
  .metadata({ name: "import-session.materialize-preview" })
  .inputSchema(
    z.object({
      importSessionId: z.string().uuid(),
      locationHandle: z.string(),
      cohortHandle: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const result = await materializeImportSessionPreview(
      parsedInput.importSessionId,
    );

    revalidatePath(
      `/locatie/${parsedInput.locationHandle}/cohorten/${parsedInput.cohortHandle}/imports`,
    );

    return result;
  });
