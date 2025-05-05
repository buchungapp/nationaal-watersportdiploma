"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { dateInputToIsoString } from "~/actions/dates";
import { actionClientWithMeta } from "~/actions/safe-action";
import {
  issueCertificatesInCohort,
  updateDefaultCertificateVisibleFromDate,
} from "~/lib/nwd";

const issueCertificatesInCohortSchema = zfd.formData({
  visibleFrom: zfd.text(dateInputToIsoString(z.string().datetime().optional())),
});

const issueCertificatesInCohortArgsSchema: [
  cohortId: z.ZodString,
  allocationIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid())];

export const issueCertificatesInCohortAction = actionClientWithMeta
  .metadata({
    name: "issue-certificates-in-cohort",
  })
  .schema(issueCertificatesInCohortSchema)
  .bindArgsSchemas(issueCertificatesInCohortArgsSchema)
  .action(
    async ({
      parsedInput: { visibleFrom },
      bindArgsParsedInputs: [cohortId, allocationIds],
    }) => {
      await issueCertificatesInCohort({
        cohortId,
        studentAllocationIds: allocationIds,
        visibleFrom: visibleFrom ?? undefined,
      });

      if (visibleFrom) {
        await updateDefaultCertificateVisibleFromDate({
          cohortId,
          visibleFrom,
        });
      }

      revalidatePath("/locatie/[location]/diplomas", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    },
  );
