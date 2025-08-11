"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import dayjs from "~/lib/dayjs";
import { storeCertificateHandles } from "~/lib/nwd";

const downloadCertificatesSchema = zfd.formData({
  filename: z.string().default(`${dayjs().toISOString()}-export-diplomas`),
  sort: z.enum(["student", "instructor"]).default("student"),
  previousModules: zfd.checkbox().optional(),
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
      parsedInput: { filename, sort, previousModules },
      bindArgsParsedInputs: [certificateHandles],
    }) => {
      const uuid = await storeCertificateHandles({
        handles: certificateHandles,
        fileName: filename,
        sort,
        previousModules,
      });

      return {
        redirectUrl: `/api/export/certificate/pdf/bulk/${uuid}`,
      };
    },
  );
