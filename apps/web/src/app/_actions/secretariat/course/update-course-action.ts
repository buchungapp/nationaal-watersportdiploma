"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { updateCourse } from "~/lib/nwd";

const updateCourseSchema = zfd.formData({
  title: zfd.text(),
  description: zfd.text(z.string().optional()),
  disciplineId: zfd.text(z.string().uuid()),
  abbreviation: zfd.text(z.string().optional()),
  categories: zfd.repeatableOfType(zfd.text(z.string().uuid())),
});

const updateCourseArgsSchema: [courseId: z.ZodString] = [z.string().uuid()];

export const updateCourseAction = actionClientWithMeta
  .metadata({
    name: "update-course",
  })
  .schema(updateCourseSchema)
  .bindArgsSchemas(updateCourseArgsSchema)
  .action(
    async ({
      parsedInput: {
        title,
        description,
        disciplineId,
        abbreviation,
        categories,
      },
      bindArgsParsedInputs: [courseId],
    }) => {
      await updateCourse(courseId, {
        title,
        description,
        disciplineId,
        abbreviation,
        categories: categories.length > 0 ? categories : undefined,
      });

      revalidatePath("/", "page");
      revalidateTag("courses");
    },
  );
