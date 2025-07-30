"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { withdrawCertificates } from "~/lib/nwd";
import { voidActionSchema } from "../utils";

const withdrawCertificatesArgsSchema: [
  certificateIds: z.ZodArray<z.ZodString>,
] = [z.array(z.string().uuid())];

export const withdrawCertificatesAction = actionClientWithMeta
  .metadata({
    name: "withdraw-certificates",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(withdrawCertificatesArgsSchema)
  .action(async ({ bindArgsParsedInputs: [certificateIds] }) => {
    await withdrawCertificates({
      certificateIds,
    });

    revalidatePath("/", "page");
  });
