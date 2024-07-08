/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  addStudentToCohortByPersonId,
  createStudentForLocation,
  setAllocationTags,
} from "~/lib/nwd";

export async function createPerson(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    firstName: z.string().trim().min(1),
    lastNamePrefix: z
      .string()
      .trim()
      .nullable()
      .transform((tussenvoegsel) =>
        tussenvoegsel === "" ? null : tussenvoegsel,
      ),
    lastName: z.string().min(1),
    dateOfBirth: z.string().pipe(z.coerce.date()),
    birthCity: z.string(),
    birthCountry: z.string().length(2).toLowerCase(),
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

    const result = await createStudentForLocation(locationId, parsed);

    revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");

    return {
      message: "Success",
      data: result,
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
      data: undefined,
      errors: {},
    };
  }
}

export async function addStudentsToCohort(
  locationId: string,
  cohortId: string,
  persons: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
    tags?: string[];
  }[],
) {
  const result = await Promise.allSettled(
    persons.map(async (row) => {
      const person = await createStudentForLocation(locationId, row);

      const allocation = await addStudentToCohortByPersonId({
        cohortId,
        locationId,
        personId: person.id,
      });

      if (row.tags && row.tags.length > 0) {
        await setAllocationTags({
          allocationId: allocation.id,
          cohortId,
          tags: row.tags,
        });
      }

      return allocation;
    }),
  );

  revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");

  const rowsWithError = result.filter(
    (result): result is PromiseRejectedResult => result.status === "rejected",
  );

  if (rowsWithError.length > 0) {
    return {
      message: "Error",
      errors: `
        ${rowsWithError.length} rows failed to import.
        ${rowsWithError.map((result) => result.reason).join("\n")}
      `,
    };
  }

  return {
    message: "Success",
    errors: {},
  };
}
