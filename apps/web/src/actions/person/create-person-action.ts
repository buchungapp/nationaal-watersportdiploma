"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { type ActorType, createPersonForLocation } from "~/lib/nwd";
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
    dateOfBirth: zfd.text(z.string().pipe(z.coerce.date())),
    birthCity: zfd.text(z.string()),
    birthCountry: zfd.text(z.string().length(2).toLowerCase()),
    "role-student": zfd.checkbox(),
    "role-instructor": zfd.checkbox(),
    "role-location_admin": zfd.checkbox(),
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

const createPersonArgsSchema: [locationId: z.ZodString] = [z.string().uuid()];

export const createPersonAction = actionClientWithMeta
  .metadata({ name: "create-person" })
  .schema(createPersonSchema)
  .bindArgsSchemas(createPersonArgsSchema)
  .action(
    async ({
      parsedInput: { roles, ...parsed },
      bindArgsParsedInputs: [locationId],
    }) => {
      await createPersonForLocation(locationId, roles, parsed);

      revalidatePath("/locatie/[location]/personen", "page");
    },
  );
