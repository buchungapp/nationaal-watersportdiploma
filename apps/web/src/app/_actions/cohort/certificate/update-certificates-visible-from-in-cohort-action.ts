"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { dateInputToIsoString } from "~/app/_actions/dates";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { updateCertificatesVisibleFromInCohort } from "~/lib/nwd";

const updateCertificatesVisibleFromInCohortSchema = zfd.formData({
  visibleFrom: zfd.text(dateInputToIsoString(z.string().datetime())),
  updateDefaultVisibleFrom: zfd.checkbox().optional(),
});

const updateCertificatesVisibleFromInCohortArgsSchema: [
  cohortId: z.ZodString,
  certificateIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid()).min(1)];

export const updateCertificatesVisibleFromInCohortAction = actionClientWithMeta
  .metadata({
    name: "update-certificates-visible-from-in-cohort",
  })
  .inputSchema(updateCertificatesVisibleFromInCohortSchema)
  .bindArgsSchemas(updateCertificatesVisibleFromInCohortArgsSchema)
  .action(
    async ({
      parsedInput: { visibleFrom, updateDefaultVisibleFrom },
      bindArgsParsedInputs: [cohortId, certificateIds],
    }) => {
      await updateCertificatesVisibleFromInCohort({
        cohortId,
        certificateIds,
        visibleFrom,
        updateDefaultVisibleFrom: updateDefaultVisibleFrom ?? false,
      });

      revalidatePath("/locatie/[location]/diplomas", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
      revalidatePath(
        "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
        "page",
      );
      revalidatePath("/profiel/[handle]", "page");
    },
  );
