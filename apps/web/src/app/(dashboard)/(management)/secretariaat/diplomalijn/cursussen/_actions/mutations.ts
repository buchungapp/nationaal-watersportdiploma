"use server";

import { revalidatePath } from "next/cache";
import { copyCurriculum } from "~/lib/nwd";

export async function copyCurriculumAction(
  { curriculumId }: { curriculumId: string },
  _prevState: unknown,
  formData: FormData,
) {
  const revisionName = formData.get("revision") as string;

  const res = await copyCurriculum({
    curriculumId,
    revision: revisionName,
  });

  revalidatePath(
    "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
  );

  return res;
}
