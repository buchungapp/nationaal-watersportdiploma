"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/actions/safe-action";
import { withdrawCertificatesInCohort } from "~/lib/nwd";

const withdrawCertificatesInCohortArgsSchema: [
  cohortId: z.ZodString,
  certificateIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid())];

export const withdrawCertificatesInCohortAction = actionClientWithMeta
  .metadata({
    name: "withdraw-certificates-in-cohort",
  })
  .bindArgsSchemas(withdrawCertificatesInCohortArgsSchema)
  .action(async ({ bindArgsParsedInputs: [cohortId, certificateIds] }) => {
    await withdrawCertificatesInCohort({
      cohortId,
      certificateIds,
    });

    revalidatePath("/locatie/[location]/diplomas", "page");
    revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
  });
