"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { removeLogbook } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { voidActionSchema } from "../utils";

const removeLogbookArgsSchema: [
  personId: z.ZodString,
  logbookId: z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString>]>,
] = [
  z.string().uuid(),
  z.union([z.string().uuid(), z.string().uuid().array()]),
];

export const removeLogbookAction = actionClientWithMeta
  .metadata({
    name: "remove-logbook",
  })
  .schema(voidActionSchema)
  .bindArgsSchemas(removeLogbookArgsSchema)
  .action(async ({ bindArgsParsedInputs: [personId, logbookId] }) => {
    if (Array.isArray(logbookId)) {
      await Promise.all(
        logbookId.map((id) =>
          removeLogbook({
            id,
            personId,
          }),
        ),
      );
    } else {
      await removeLogbook({
        id: logbookId,
        personId,
      });
    }

    revalidatePath("/profiel/[handle]", "page");
  });
