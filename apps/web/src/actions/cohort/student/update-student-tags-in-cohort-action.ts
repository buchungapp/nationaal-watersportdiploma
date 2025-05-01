"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { setAllocationTags } from "~/lib/nwd";
import { actionClientWithMeta } from "../../safe-action";

const tagSchema = z.object({
  allocationId: z.string(),
  tags: z.string().array(),
});

const updateStudentTagsInCohortSchema = tagSchema.or(tagSchema.array());

const updateStudentTagsInCohortArgsSchema: [cohortId: z.ZodString] = [
  z.string(),
];

export const updateStudentTagsInCohortAction = actionClientWithMeta
  .metadata({
    name: "update-student-tags-in-cohort",
  })
  .schema(updateStudentTagsInCohortSchema)
  .bindArgsSchemas(updateStudentTagsInCohortArgsSchema)
  .action(async ({ parsedInput: tags, bindArgsParsedInputs: [cohortId] }) => {
    const tagsArray = Array.isArray(tags) ? tags : [tags];

    for (const tag of tagsArray) {
      await setAllocationTags({
        cohortId,
        allocationId: tag.allocationId,
        tags: tag.tags,
      });
    }

    revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
    revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");
    revalidatePath(
      "/locatie/[location]/cohorten/[cohort]/[student-allocation]",
      "page",
    );
  });
