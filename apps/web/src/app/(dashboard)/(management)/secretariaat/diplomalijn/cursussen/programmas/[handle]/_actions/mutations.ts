"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  copyCurriculum,
  linkGearTypeToCurriculum,
  removeCurriculum,
  startCurriculum,
  unlinkGearTypeFromCurriculum,
} from "~/lib/nwd";

export async function copyCurriculumAction(
  { curriculumId }: { curriculumId: string },
  _prevState: unknown,
  formData: FormData,
) {
  const revisionName = formData.get("revision") as string;

  try {
    const res = await copyCurriculum({
      curriculumId,
      revision: revisionName,
    });

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
      id: res.id,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
        id: null,
      };
    }

    return {
      message: "Error",
      errors: {},
      id: null,
    };
  }
}

export async function removeCurriculumAction(
  { curriculumId }: { curriculumId: string },
  _prevState: unknown,
  _formData: FormData,
) {
  try {
    await removeCurriculum(curriculumId);

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}

export async function startCurriculumAction(
  { curriculumId }: { curriculumId: string },
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    startAt: z.preprocess(
      (value) => new Date(String(value)).toISOString(),
      z.string().datetime(),
    ),
  });

  try {
    const { startAt } = expectedSchema.parse({
      startAt: formData.get("startAt"),
    });

    await startCurriculum({
      curriculumId,
      startAt,
    });

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}

export async function unlinkGearTypeFromCurriculumAction(
  {
    gearTypeId,
    curriculumId,
  }: {
    gearTypeId: string;
    curriculumId: string;
  },
  _prevState: unknown,
  _formData: FormData,
) {
  try {
    await unlinkGearTypeFromCurriculum({ gearTypeId, curriculumId });

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}

export async function linkGearTypeToCurriculumAction(
  {
    curriculumId,
  }: {
    curriculumId: string;
  },
  _prevState: unknown,
  formData: FormData,
) {
  const gearTypeId = formData.get("gearTypeId") as string;

  try {
    await linkGearTypeToCurriculum({ gearTypeId, curriculumId });

    revalidatePath(
      "/(dashboard)/(management)/secretariaat/diplomalijn/cursussen/programmas/[handle]",
      "page",
    );

    return {
      message: "Success",
      errors: {} as Record<string, string>,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        message: "Error",
        errors: error.issues.reduce(
          (acc, issue) => {
            acc[issue.path.join(".")] = issue.message;
            return acc;
          },
          {} as Record<string, string>,
        ),
      };
    }

    return {
      message: "Error",
      errors: {},
    };
  }
}
