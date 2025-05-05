"use server";

import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/actions/safe-action";
import { storeCertificateHandles } from "~/lib/nwd";

const downloadCertificatesSchema = zfd.formData({
  filename: z.string().catch(`${dayjs().toISOString()}-export-diplomas`),
  sort: z.enum(["student", "instructor"]).catch("student"),
});

const downloadCertificatesArgsSchema: [
  certificateHandles: z.ZodArray<z.ZodString>,
] = [z.array(z.string())];

export const downloadCertificatesAction = actionClientWithMeta
  .metadata({
    name: "download-certificates",
  })
  .schema(downloadCertificatesSchema)
  .bindArgsSchemas(downloadCertificatesArgsSchema)
  .action(
    async ({
      parsedInput: { filename, sort },
      bindArgsParsedInputs: [certificateHandles],
    }) => {
      const uuid = await storeCertificateHandles({
        handles: certificateHandles,
        fileName: filename,
        sort,
      });

      redirect(`/api/export/certificate/pdf/${uuid}`);
    },
  );
