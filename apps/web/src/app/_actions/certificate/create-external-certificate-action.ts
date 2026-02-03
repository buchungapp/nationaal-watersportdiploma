"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createExternalCertificate } from "~/lib/nwd";
import { optionalFileSchema } from "../files";
import { actionClientWithMeta } from "../safe-action";

const createExternalCertificateSchema = zfd.formData({
  media: optionalFileSchema,
  awardedAt: zfd.text(z.string().date().nullable().default(null)),
  identifier: zfd.text(z.string().nullable().default(null)),
  issuingAuthority: zfd.text(z.string().nullable().default(null)),
  issuingLocation: zfd.text(z.string().nullable().default(null)),
  title: zfd.text(z.string()),
  additionalComments: zfd.text(z.string().nullable().default(null)),
});

const createExternalCertificateArgsSchema: [personId: z.ZodString] = [
  z.string().uuid(),
];

export const createExternalCertificateAction = actionClientWithMeta
  .metadata({
    name: "create-external-certificate",
  })
  .inputSchema(createExternalCertificateSchema)
  .bindArgsSchemas(createExternalCertificateArgsSchema)
  .action(async ({ parsedInput: data, bindArgsParsedInputs: [personId] }) => {
    await createExternalCertificate({
      personId,
      media: data.media ?? null,
      fields: {
        ...data,
        metadata: null,
      },
    });

    revalidatePath("/profiel/[handle]", "page");
  });
