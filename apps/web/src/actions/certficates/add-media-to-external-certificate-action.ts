"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateExternalCertificate } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { extractFileExtension } from "./files";
import { MAX_FILE_SIZE } from "./files";
import { ACCEPTED_IMAGE_TYPES } from "./files";

const addMediaToExternalCertificateSchema = zfd.formData({
  media: zfd.file(
    z
      .custom<File | undefined>()
      .transform((file) =>
        !file || file.size <= 0 || file.name === "undefined" ? null : file,
      )
      .refine((file) => file !== null, {
        message: "A file must be uploaded",
      })
      .refine((file) => file.size <= MAX_FILE_SIZE, {
        message: `De media moet een maximum van ${MAX_FILE_SIZE}MB zijn.`,
      })
      .refine(
        (file) =>
          file.type in ACCEPTED_IMAGE_TYPES &&
          ACCEPTED_IMAGE_TYPES[
            file.type as keyof typeof ACCEPTED_IMAGE_TYPES
          ].includes(extractFileExtension(file)),
        {
          message: "Alleen afbeeldingen of PDF's zijn toegestaan.",
        },
      ),
  ),
});

const addMediaToExternalCertificateArgsSchema: [
  personId: z.ZodString,
  externalCertificateId: z.ZodString,
] = [z.string(), z.string()];

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
