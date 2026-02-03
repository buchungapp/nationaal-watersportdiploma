"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { removeExternalCertificate } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { voidActionSchema } from "../utils";

const removeExternalCertificateArgsSchema: [
  personId: z.ZodString,
  externalCertificateId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const removeExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "remove-external-certificate",
  })
  .inputSchema(voidActionSchema)
  .bindArgsSchemas(removeExternalCertificateArgsSchema)
  .action(
    async ({ bindArgsParsedInputs: [personId, externalCertificateId] }) => {
      await removeExternalCertificate({
        personId,
        id: externalCertificateId,
      });

      revalidatePath("/profiel/[handle]", "page");
    },
  );
