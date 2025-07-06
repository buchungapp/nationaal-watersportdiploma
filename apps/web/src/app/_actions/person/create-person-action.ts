"use server";

import { User } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  type ActorType,
  createPersonForLocation,
  getUserOrThrow,
} from "~/lib/nwd";
import { dateInput } from "../dates";
import { actionClientWithMeta } from "../safe-action";

const createPersonSchema = zfd
  .formData({
    email: zfd.text(z.string().trim().toLowerCase().email()),
    firstName: zfd.text(z.string().trim()),
    lastNamePrefix: zfd.text(
      z
        .string()
        .trim()
        .nullish()
        .transform((tussenvoegsel) => tussenvoegsel ?? null),
    ),
    lastName: zfd.text(z.string()),
    dateOfBirth: zfd.text(dateInput),
    birthCity: zfd.text(z.string()),
    birthCountry: zfd.json(
      z.object({
        code: zfd.text(z.string().length(2).toLowerCase()),
      }),
    ),
    "role-student": zfd.checkbox(),
    "role-instructor": zfd.checkbox(),
    "role-location_admin": zfd.checkbox(),
    "role-pvb_beoordelaar": zfd.checkbox(),
  })
  .refine(
    (data) =>
      !!data["role-student"] ||
      !!data["role-instructor"] ||
      !!data["role-location_admin"] ||
      !!data["role-pvb_beoordelaar"],
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
    if (parsed["role-pvb_beoordelaar"]) {
      roles.push("pvb_beoordelaar");
    }

    return {
      ...parsed,
      roles,
    };
  });

const createPersonForLocationArgsSchema: [locationId: z.ZodString] = [
  z.string().uuid(),
];

export const createPersonForLocationAction = actionClientWithMeta
  .metadata({ name: "create-person-for-location" })
  .schema(createPersonSchema)
  .bindArgsSchemas(createPersonForLocationArgsSchema)
  .action(
    async ({
      parsedInput: { roles, ...parsed },
      bindArgsParsedInputs: [locationId],
    }) => {
      await createPersonForLocation(locationId, roles, {
        ...parsed,
        birthCountry: parsed.birthCountry.code,
      });

      revalidatePath("/locatie/[location]/personen", "page");
    },
  );

const createPersonBaseSchema = zfd.formData({
  firstName: zfd.text(z.string().trim()),
  lastNamePrefix: zfd.text(
    z
      .string()
      .trim()
      .nullish()
      .transform((tussenvoegsel) => tussenvoegsel ?? null),
  ),
  lastName: zfd.text(z.string()),
  dateOfBirth: zfd.text(dateInput),
  birthCity: zfd.text(z.string()),
  birthCountry: zfd.json(
    z.object({
      code: zfd.text(z.string().length(2).toLowerCase()),
    }),
  ),
});

export const createPersonForUserAction = actionClientWithMeta
  .metadata({ name: "create-person-for-user" })
  .schema(createPersonBaseSchema)
  .action(async ({ parsedInput }) => {
    const user = await getUserOrThrow();

    const person = await User.Person.create({
      userId: user.authUserId,
      ...parsedInput,
      birthCountry: parsedInput.birthCountry.code,
      dateOfBirth: parsedInput.dateOfBirth.toISOString(),
    });

    revalidatePath("/account");

    return {
      personId: person.id,
    };
  });
