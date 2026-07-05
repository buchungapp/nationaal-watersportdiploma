"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import dayjs from "~/lib/dayjs";
import {
  assertCertificateHandlesBelongToLocation,
  storeCertificateHandles,
} from "~/lib/nwd";

const downloadCertificatesSchema = zfd.formData({
  filename: z.string().default(`${dayjs().toISOString()}-export-diplomas`),
  sort: z.enum(["student", "instructor"]).default("student"),
  previousModules: zfd.checkbox().optional(),
});

const downloadCertificatesArgsSchema: [
  locationId: z.ZodString,
  certificateHandles: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string())];

export const downloadCertificatesAction = actionClientWithMeta
  .metadata({
    name: "download-certificates",
  })
  .inputSchema(downloadCertificatesSchema)
  .bindArgsSchemas(downloadCertificatesArgsSchema)
  .action(
    async ({
      parsedInput: { filename, sort, previousModules },
      bindArgsParsedInputs: [locationId, certificateHandles],
    }) => {
      // Authorize before minting the download uuid: the bulk PDF route consumes
      // the uuid unauthenticated, so the acting profile must be a location_admin
      // and every handle must belong to this location.
      await assertCertificateHandlesBelongToLocation({
        locationId,
        handles: certificateHandles,
      });

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
