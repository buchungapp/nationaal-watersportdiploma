"use server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { createExportData, exportDataToBlob } from "~/lib/export";
import {
  getPrimaryPerson,
  getUserOrThrow,
  isActiveActorTypeInLocationServerHelper,
  listStudentsWithCurriculaByCohortId,
  retrieveCohortById,
} from "~/lib/nwd";
import { aggregateInstructorProgrammeRows } from "./aggregate-instructor-programmes";

const exportInstructorProgrammesSchema = zfd.formData({
  format: zfd.text(z.enum(["csv", "xlsx"])),
});

const bindArgsSchemas: [cohortId: z.ZodString] = [z.string().uuid()];

const HEADERS = ["Instructeur", "Programma", "Aantal cursisten"];

export const exportInstructorProgrammesAction = actionClientWithMeta
  .metadata({
    name: "export-instructor-programmes",
  })
  .inputSchema(exportInstructorProgrammesSchema)
  .bindArgsSchemas(bindArgsSchemas)
  .action(
    async ({
      parsedInput: { format },
      bindArgsParsedInputs: [cohortId],
    }) => {
      const cohort = await retrieveCohortById(cohortId);
      if (!cohort) {
        throw new Error("Cohort niet gevonden");
      }

      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      await isActiveActorTypeInLocationServerHelper({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      });

      const students = await listStudentsWithCurriculaByCohortId(cohortId);
      const rows = aggregateInstructorProgrammeRows(students);

      const data = await createExportData(HEADERS, rows, {
        type: format,
        sheetName: "Instructeurs",
      });

      return {
        data: exportDataToBlob(data, format),
        format,
      };
    },
  );
