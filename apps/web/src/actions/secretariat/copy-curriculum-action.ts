"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { copyCurriculum } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

const copyCurriculumSchema = zfd.formData({
  revision: zfd.text(),
});

const copyCurriculumArgsSchema: [curriculumId: z.ZodString] = [z.string()];

export const copyCurriculumAction = actionClientWithMeta
  .metadata({
    name: "copy-curriculum",
  })
  .schema(copyCurriculumSchema)
  .bindArgsSchemas(copyCurriculumArgsSchema)
  .action(
    async ({
      parsedInput: { revision },
      bindArgsParsedInputs: [curriculumId],
    }) => {
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
