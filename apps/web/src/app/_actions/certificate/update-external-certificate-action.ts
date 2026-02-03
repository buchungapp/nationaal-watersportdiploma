"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateExternalCertificate } from "~/lib/nwd";
import { optionalFileSchema } from "../files";
import { actionClientWithMeta } from "../safe-action";

const updateExternalCertificateSchema = zfd.formData({
  media: optionalFileSchema,
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
] = [z.string().uuid(), z.string().uuid()];

export const updateExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "update-external-certificate",
  })
  .inputSchema(updateExternalCertificateSchema)
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
