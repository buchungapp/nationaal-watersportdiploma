"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { isSystemAdmin } from "~/lib/authorization";
import { copyCurriculum, getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const copyCurriculumSchema = zfd.formData({
  revision: zfd.text(),
});

const copyCurriculumArgsSchema: [curriculumId: z.ZodString] = [
  z.string().uuid(),
];

export const copyCurriculumAction = actionClientWithMeta
  .metadata({
    name: "copy-curriculum",
  })
  .inputSchema(copyCurriculumSchema)
  .bindArgsSchemas(copyCurriculumArgsSchema)
  .action(
    async ({
      parsedInput: { revision },
      bindArgsParsedInputs: [curriculumId],
    }) => {
      // Defense in depth: the /secretariaat edge middleware gates the pages, but
      // a server action is an independently callable endpoint, so we check here
      // too (copyCurriculum itself performs no authorization).
      const user = await getUserOrThrow();
      if (!isSystemAdmin(user.email)) {
        throw new Error("Geen toegang tot deze functie");
      }

      const result = await copyCurriculum({
        curriculumId,
        revision,
      });

      revalidatePath(
        "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
        "page",
      );

      return result;
    },
  );
