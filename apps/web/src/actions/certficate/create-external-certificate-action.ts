"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createExternalCertificate } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { ACCEPTED_IMAGE_TYPES, extractFileExtension } from "./files";
import { MAX_FILE_SIZE } from "./files";

const createExternalCertificateSchema = zfd.formData({
  media: zfd.file(
    z
      .custom<File | undefined>()
      .transform((file) =>
        !file || file.size <= 0 || file.name === "undefined" ? null : file,
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
      ),
  ),
  awardedAt: zfd.text(z.string().date().nullable().default(null)),
  identifier: zfd.text(z.string().nullable().default(null)),
  issuingAuthority: zfd.text(z.string().nullable().default(null)),
  issuingLocation: zfd.text(z.string().nullable().default(null)),
  title: zfd.text(z.string()),
  additionalComments: zfd.text(z.string().nullable().default(null)),
});

const createExternalCertificateArgsSchema: [personId: z.ZodString] = [
  z.string(),
];

export const createExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "create-external-certificate",
  })
  .schema(createExternalCertificateSchema)
  .bindArgsSchemas(createExternalCertificateArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [personId] }) => {
    await createExternalCertificate({
      personId,
      media: data.media,
      fields: {
        ...data,
        metadata: null,
      },
    });

    revalidatePath("/profiel/[handle]", "page");
  });
