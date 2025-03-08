"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createLogbook, removeLogbook, updateLogbook } from "~/lib/nwd";

export async function createLogbookAction(
  {
    personId,
  }: {
    personId: string;
  },
  prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    startedAt: z.preprocess(
      (value) => new Date(String(value)).toISOString(),
      z.string().datetime(),
    ),
    endedAt: z.preprocess(
      (value) => (value ? new Date(String(value)).toISOString() : null),
      z.string().datetime().nullable(),
    ),
    departurePort: z.string().nullable().default(null),
    arrivalPort: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    windPower: z.number().nullable().default(null),
    windDirection: z.string().nullable().default(null),
    boatType: z.string().nullable().default(null),
    boatLength: z.number().nullable().default(null),
    sailedNauticalMiles: z.number().nullable().default(null),
    sailedHoursInDark: z.number().nullable().default(null),
    primaryRole: z.string().nullable().default(null),
    crewNames: z.string().nullable().default(null),
    conditions: z.string().nullable().default(null),
    additionalComments: z.string().nullable().default(null),
  });

  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    console.log(data);
    const parsed = expectedSchema.parse(data);

    console.log(parsed);

    await createLogbook({
      personId,
      fields: parsed,
    });

    revalidatePath("/profiel/[handle]", "page");

    return {
      message: "Success",
      errors: {},
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

export async function updateLogbookAction(
  {
    personId,
    logbookId,
  }: {
    personId: string;
    logbookId: string;
  },
  prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    startedAt: z
      .preprocess(
        (value) => new Date(String(value)).toISOString(),
        z.string().datetime(),
      )
      .optional(),
    endedAt: z
      .preprocess(
        (value) => (value ? new Date(String(value)).toISOString() : null),
        z.string().datetime().nullable(),
      )
      .optional(),
    departurePort: z.string().nullable().optional(),
    arrivalPort: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    windPower: z.number().nullable().optional(),
    windDirection: z.string().nullable().optional(),
    boatType: z.string().nullable().optional(),
    boatLength: z.number().nullable().optional(),
    sailedNauticalMiles: z.number().nullable().optional(),
    sailedHoursInDark: z.number().nullable().optional(),
    primaryRole: z.string().nullable().optional(),
    crewNames: z.string().nullable().optional(),
    conditions: z.string().nullable().optional(),
    additionalComments: z.string().nullable().optional(),
  });

  const data: Record<string, FormDataEntryValue | null> = Object.fromEntries(
    formData.entries(),
  );

  // Set all empty strings to null
  for (const key in data) {
    if (data[key] === "") {
      data[key] = null;
    }
  }

  try {
    const parsed = expectedSchema.parse(data);

    await updateLogbook({
      id: logbookId,
      personId,
      fields: parsed,
    });

    revalidatePath("/profiel/[handle]", "page");

    return {
      message: "Success",
      errors: {},
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

export async function removeLogbookAction({
  personId,
  logbookId,
}: {
  personId: string;
  logbookId: string;
}) {
  try {
    await removeLogbook({
      id: logbookId,
      personId,
    });

    revalidatePath("/profiel/[handle]", "page");

    return {
      message: "Success",
      errors: {},
    };
  } catch (error) {
    return {
      message: "Error",
      errors: {},
    };
  }
}
