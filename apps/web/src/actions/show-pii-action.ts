"use server";

import dayjs from "dayjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { certificateParamsSchema } from "~/app/(certificate)/diploma/_utils/parse-certificate-params";
import { retrieveCertificateById } from "~/lib/nwd";
import { actionClientWithMeta } from "./safe-action";

const showPiiSchema = zfd.formData({
  handle: zfd.text(certificateParamsSchema.shape.handle),
  issuedDate: zfd.text(certificateParamsSchema.shape.issuedDate),
});

const showPiiArgsSchema: [certificateId: z.ZodString] = [z.string().uuid()];

export const showPiiAction = actionClientWithMeta
  .metadata({
    name: "show-pii",
  })
  .schema(showPiiSchema)
  .bindArgsSchemas(showPiiArgsSchema)
  .action(
    async ({ parsedInput: data, bindArgsParsedInputs: [certificateId] }) => {
      const certificate = await retrieveCertificateById(certificateId);

      const isValid =
        data.handle === certificate.handle &&
        data.issuedDate.format("YYYYMMDD") ===
          dayjs(certificate.issuedAt).format("YYYYMMDD");

      if (!isValid) {
        throw new Error("Invalid certificate");
      }

      redirect(
        `/diploma/${certificateId}/?nummer=${data.handle}&datum=${data.issuedDate.format("YYYYMMDD")}`,
      );
    },
  );
