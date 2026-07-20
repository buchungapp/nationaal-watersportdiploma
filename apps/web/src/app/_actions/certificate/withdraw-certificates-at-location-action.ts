"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { withdrawCertificatesAtLocation } from "~/lib/nwd";

const withdrawCertificatesAtLocationArgsSchema: [
  locationId: z.ZodString,
  certificateIds: z.ZodArray<z.ZodString>,
] = [z.string().uuid(), z.array(z.string().uuid())];

export const withdrawCertificatesAtLocationAction = actionClientWithMeta
  .metadata({
    name: "withdraw-certificates-at-location",
  })
  .bindArgsSchemas(withdrawCertificatesAtLocationArgsSchema)
  .action(async ({ bindArgsParsedInputs: [locationId, certificateIds] }) => {
    await withdrawCertificatesAtLocation({
      locationId,
      certificateIds,
    });

    revalidatePath("/locatie/[location]/diplomas", "page");
  });
