"use server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import { studentProgress } from "~/app/(dashboard)/(management)/locatie/[location]/cohorten/[cohort]/(overview)/_student-progress";
import {
  createExportData,
  exportDataToBlob,
  mapToExportFields,
  transformRows,
} from "~/lib/export";
import {
  listStudentsWithCurriculaByCohortId,
  retrieveCohortById,
} from "~/lib/nwd";
import { typedObjectKeys } from "~/utils/types";
import { studentListFieldMappers } from "./student-list-mappers";

const [firstFieldId, ...fieldIds] = typedObjectKeys(studentListFieldMappers);

const exportStudentListSchema = zfd.formData({
  field: z.record(
    // biome-ignore lint/style/noNonNullAssertion: intentional
    z.enum([firstFieldId!, ...fieldIds]),
    z.object({ selected: zfd.checkbox(), label: zfd.text() }),
  ),
  format: zfd.text(z.enum(["csv", "xlsx"])),
});

const bindArgsSchemas: [cohortId: z.ZodString] = [z.string().uuid()];

export const exportStudentListAction = actionClientWithMeta
  .metadata({
    name: "export-student-list",
  })
  .inputSchema(exportStudentListSchema)
  .bindArgsSchemas(bindArgsSchemas)
  .action(
    async ({
      parsedInput: { field, format },
      bindArgsParsedInputs: [cohortId],
    }) => {
      const cohort = await retrieveCohortById(cohortId);
      if (!cohort) {
        throw new Error("Cohort not found");
      }

      const students = await listStudentsWithCurriculaByCohortId(cohortId);
      const studentProgressData = await studentProgress([
        ...new Set(students.map((student) => student.person.id)),
      ]);

      const selectedFields = Object.entries(field)
        .filter(([_, value]) => value.selected)
        .map(([key, value]) => ({
          id: key,
          label: value.label,
        }));

      const headers = selectedFields.map((field) => field.label);

      const rows = students.map((student) =>
        mapToExportFields(
          {
            student,
            cohort,
            studentProgress:
              studentProgressData.find(
                (progress) => progress.personId === student.person.id,
              )?.curricula ?? null,
          },
          selectedFields.map((field) => field.id),
          studentListFieldMappers,
        ),
      );

      const data = await createExportData(
        headers,
        transformRows(rows, selectedFields),
        {
          type: format,
          sheetName: "Cursisten",
        },
      );

      return {
        data: exportDataToBlob(data, format),
        format,
      };
    },
  );
