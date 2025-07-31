"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { updateCurriculumCompetencyRequirement } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const updateCurriculaCompetencyRequirementSchema = zfd.formData({
  requirement: zfd.text(),
});

const updateCurriculaCompetencyRequirementArgsSchema: [
  competencyId: z.ZodString,
] = [z.string().uuid()];

export const updateCurriculaCompetencyRequirementAction = actionClientWithMeta
  .metadata({
    name: "update-curricula-competency-requirement",
  })
  .schema(updateCurriculaCompetencyRequirementSchema)
  .bindArgsSchemas(updateCurriculaCompetencyRequirementArgsSchema)
  .action(
    async ({
      parsedInput: { requirement },
      bindArgsParsedInputs: [competencyId],
    }) => {
      await updateCurriculumCompetencyRequirement(competencyId, requirement);

      revalidatePath("/", "page");
      revalidateTag("curricula");
    },
  );
