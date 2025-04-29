"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { removeExternalCertificate } from "~/lib/nwd";
import { actionClientWithMeta, voidActionSchema } from "../safe-action";

const removeExternalCertificateArgsSchema: [
  personId: z.ZodString,
  externalCertificateId: z.ZodString,
] = [z.string(), z.string()];

export const removeExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "remove-external-certificate",
  })
  .schema(voidActionSchema)
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
