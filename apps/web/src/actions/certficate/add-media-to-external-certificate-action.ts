"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateExternalCertificate } from "~/lib/nwd";
import { requiredFileSchema } from "../files";
import { actionClientWithMeta } from "../safe-action";

const addMediaToExternalCertificateSchema = zfd.formData({
  media: requiredFileSchema,
});

const addMediaToExternalCertificateArgsSchema: [
  personId: z.ZodString,
  externalCertificateId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const addMediaToExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "add-media-to-external-certificate",
  })
  .schema(addMediaToExternalCertificateSchema)
  .bindArgsSchemas(addMediaToExternalCertificateArgsSchema)
  .action(
    async ({
      parsedInput: data,
      bindArgsParsedInputs: [personId, externalCertificateId],
    }) => {
      await updateExternalCertificate({
        personId,
        media: data.media,
        id: externalCertificateId,
      });

      revalidatePath("/profiel/[handle]", "page");
    },
  );
