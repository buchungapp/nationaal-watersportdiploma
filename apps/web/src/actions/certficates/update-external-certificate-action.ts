"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateExternalCertificate } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { extractFileExtension } from "./files";
import { ACCEPTED_IMAGE_TYPES } from "./files";
import { MAX_FILE_SIZE } from "./files";

const updateExternalCertificateSchema = zfd.formData({
  media: zfd.file(
    z
      .custom<File>()
      .transform((file) =>
        file.size <= 0 || file.name === "undefined" ? undefined : file,
      )
      .refine((file) => !file || file.size <= MAX_FILE_SIZE, {
        message: `Het bestand mag maximaal ${Math.floor(MAX_FILE_SIZE / 1000000)}MB groot zijn.`,
      })
      .refine(
        (file) =>
          !file ||
          (file.type in ACCEPTED_IMAGE_TYPES &&
            ACCEPTED_IMAGE_TYPES[
              file.type as keyof typeof ACCEPTED_IMAGE_TYPES
            ].includes(extractFileExtension(file))),
        {
          message: "Alleen afbeeldingen of PDF's zijn toegestaan.",
        },
      )
      .optional(),
  ),
  removeMedia: zfd.text(
    z
      .string()
      .transform((value) => value === "on")
      .optional(),
  ),
  awardedAt: zfd.text(z.string().date().nullable().optional()),
  identifier: zfd.text(z.string().nullable().optional()),
  issuingAuthority: zfd.text(z.string().nullable().optional()),
  issuingLocation: zfd.text(z.string().nullable().optional()),
  title: zfd.text(z.string().optional()),
  additionalComments: zfd.text(z.string().nullable().optional()),
});

const updateExternalCertificateArgsSchema: [
  personId: z.ZodString,
  externalCertificateId: z.ZodString,
] = [z.string(), z.string()];

export const updateExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "update-external-certificate",
  })
  .schema(updateExternalCertificateSchema)
  .bindArgsSchemas(updateExternalCertificateArgsSchema)
  .action(
    async ({
      parsedInput: data,
      bindArgsParsedInputs: [personId, externalCertificateId],
    }) => {
      await updateExternalCertificate({
        id: externalCertificateId,
        personId,
        media: data.removeMedia ? null : data.media,
        fields: data,
      });

      revalidatePath("/profiel/[handle]", "page");
    },
  );
