/* eslint-disable @typescript-eslint/no-unsafe-return */
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  type ActorType,
  createPersonForLocation,
  updateEmailForPerson,
  updatePersonDetails,
} from "~/lib/nwd";

export async function createPerson(
  locationId: string,
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z
    .object({
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
      ["role-student"]: z.string().optional(),
      ["role-instructor"]: z.string().optional(),
      ["role-location_admin"]: z.string().optional(),
    })
    .refine(
      (data) =>
        !!data["role-student"] ||
        !!data["role-instructor"] ||
        !!data["role-location_admin"],
      {
        message: "At least one role must be selected",
        path: ["roles"],
      },
    )
    .transform((parsed) => {
      const roles: ActorType[] = [];
      if (parsed["role-student"]) {
        roles.push("student");
      }
      if (parsed["role-instructor"]) {
        roles.push("instructor");
      }
      if (parsed["role-location_admin"]) {
        roles.push("location_admin");
      }

      return {
        ...parsed,
        roles,
      };
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
    await createPersonForLocation(locationId, parsed.roles, parsed);

    revalidatePath("/locatie/[location]/personen", "page");

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

export async function createPersonBulk(
  locationId: string,
  roles: [ActorType, ...ActorType[]],
  persons: {
    email: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string;
    dateOfBirth: Date;
    birthCity: string;
    birthCountry: string;
  }[],
) {
  const result = await Promise.allSettled(
    persons.map(async (row) => createPersonForLocation(locationId, roles, row)),
  );

  revalidatePath("/locatie/[location]/personen", "page");

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

export async function updateEmail(
  props: {
    personId: string;
    locationId: string;
  },
  _previousState: unknown,
  formData: FormData,
) {
  const email = formData.get("email") as string;

  await updateEmailForPerson({
    ...props,
    email,
  });

  revalidatePath("/locatie/[location]/personen", "page");
  revalidatePath("/locatie/[location]/personen/[id]", "page");

  return {
    state: "success",
  };
}

export async function updatePerson(
  {
    locationId,
    personId,
  }: {
    locationId: string;
    personId: string;
  },
  _prevState: unknown,
  formData: FormData,
) {
  const expectedSchema = z.object({
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

    await updatePersonDetails({
      locationId,
      personId,
      ...parsed,
    });

    revalidatePath("/locatie/[location]/personen", "page");
    revalidatePath("/locatie/[location]/personen/[id]", "page");

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
