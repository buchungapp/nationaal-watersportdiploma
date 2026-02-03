"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createCompletedCertificate } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const issueCertificateSchema = zfd.formData({
  person: z.object({ id: zfd.text(z.string().uuid()) }),
  gearType: z.object({ id: zfd.text(z.string().uuid()) }),
  curriculum: z.object({ id: zfd.text(z.string().uuid()) }),
  competencies: zfd
    .repeatableOfType(
      zfd.text(
        z.preprocess(
          (value) => (value ? (value as string).split(",") : null),
          z.string().uuid().array(),
        ),
      ),
    )
    .transform((competencies) => competencies.flat()),
});

const issueCertificateArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const issueCertificateAction = actionClientWithMeta
  .metadata({
    name: "issue-certificate",
  })
  .inputSchema(issueCertificateSchema)
  .bindArgsSchemas(issueCertificateArgsSchema)
  .action(
    async ({
      parsedInput: {
        person: { id: personId },
        gearType: { id: gearTypeId },
        curriculum: { id: curriculumId },
        competencies,
      },
      bindArgsParsedInputs: [locationId],
    }) => {
      await createCompletedCertificate(locationId, personId, {
        curriculumId,
        gearTypeId,
        competencies,
      });

      revalidatePath("/locatie/[location]/diplomas", "page");
    },
  );
