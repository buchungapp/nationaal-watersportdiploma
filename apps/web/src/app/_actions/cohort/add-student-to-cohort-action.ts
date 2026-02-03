"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  addStudentToCohortByPersonId,
  createStudentForLocation,
} from "~/lib/nwd";
import { dateInput } from "../dates";
import { actionClientWithMeta } from "../safe-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "../utils";

const addStudentToCohortSchema = zfd.formData(
  z.union([
    z.object({
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
      birthCountry: z.object({
        code: zfd.text(z.string().length(2).toLowerCase()),
      }),
    }),
    z.object({
      person: z.object({
        id: zfd.text(z.string()),
      }),
    }),
  ]),
);

const addStudentToCohortArgsSchema: [
  locationId: z.ZodString,
  cohortId: z.ZodString,
] = [z.string().uuid(), z.string().uuid()];

export const addStudentToCohortAction = actionClientWithMeta
  .metadata({
    name: "add-student-to-cohort",
  })
  .inputSchema(addStudentToCohortSchema)
  .bindArgsSchemas(addStudentToCohortArgsSchema)
  .action(
    async ({
      parsedInput: data,
      bindArgsParsedInputs: [locationId, cohortId],
    }) => {
      let personId: string | null = null;
      if ("person" in data) {
        personId = data.person.id;
      } else {
        try {
          const result = await createStudentForLocation(locationId, {
            ...data,
            birthCountry: data.birthCountry.code,
          });
          personId = result.id;
        } catch (error) {
          throw new Error(DEFAULT_SERVER_ERROR_MESSAGE);
        }
      }

      const result = await addStudentToCohortByPersonId({
        cohortId,
        locationId,
        personId,
      }).catch(() => {
        throw new Error(DEFAULT_SERVER_ERROR_MESSAGE);
      });

      revalidatePath("/locatie/[location]/cohorten/[cohort]", "page");
      revalidatePath("/locatie/[location]/cohorten/[cohort]/diplomas", "page");

      return {
        allocation: {
          id: result.id,
        },
      };
    },
  );
