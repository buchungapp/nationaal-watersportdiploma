"use server";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { actionClientWithMeta } from "~/app/_actions/safe-action";
import {
  createExportData,
  exportDataToBlob,
  mapToExportFields,
  transformRows,
} from "~/lib/export";
import { qualificationsListFieldMappers } from "./qualifications-list-mappers";

const exportQualificationsListSchema = zfd.formData({
  field: z.record(
    z.string(),
    z.object({ selected: zfd.checkbox(), label: zfd.text() }),
  ),
  format: zfd.text(z.enum(["csv", "xlsx"])),
});

type ExportData = {
  instructors: Array<{
    id: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string | null;
    handle: string;
    dateOfBirth: string | null;
    birthCity: string | null;
    birthCountry: {
      name: string;
      code: string;
    } | null;
    email: string | null;
  }>;
  courses: Array<{
    id: string;
    handle: string;
    title: string | null;
    abbreviation: string | null;
  }>;
  kwalificaties: Array<{
    personId: string;
    courseId: string;
    richting: string;
    hoogsteNiveau: number;
  }>;
  locationHandle: string;
};

const bindArgsSchemas: [exportData: z.ZodType<ExportData>] = [
  z.object({
    instructors: z.array(
      z.object({
        id: z.string(),
        firstName: z.string(),
        lastNamePrefix: z.string().nullable(),
        lastName: z.string().nullable(),
        handle: z.string(),
        dateOfBirth: z.string().nullable(),
        birthCity: z.string().nullable(),
        birthCountry: z
          .object({
            name: z.string(),
            code: z.string().length(2),
          })
          .nullable(),
        email: z.string().email().nullable(),
      }),
    ),
    courses: z.array(
      z.object({
        id: z.string(),
        handle: z.string(),
        title: z.string().nullable(),
        abbreviation: z.string().nullable(),
      }),
    ),
    kwalificaties: z.array(
      z.object({
        personId: z.string(),
        courseId: z.string(),
        richting: z.string(),
        hoogsteNiveau: z.number(),
      }),
    ),
    locationHandle: z.string(),
  }),
];

export const exportQualificationsListAction = actionClientWithMeta
  .metadata({
    name: "export-qualifications-list",
  })
  .inputSchema(exportQualificationsListSchema)
  .bindArgsSchemas(bindArgsSchemas)
  .action(
    async ({
      parsedInput: { field, format },
      bindArgsParsedInputs: [exportData],
    }) => {
      const { instructors, courses, kwalificaties } = exportData;

      // Get field mappers with courses
      const fieldMappers = qualificationsListFieldMappers(courses);

      const selectedFields = Object.entries(field)
        .filter(([_, value]) => value.selected)
        .map(([key, value]) => ({
          id: key,
          label: value.label,
        }));

      const headers = selectedFields.map((field) => field.label);

      // Group kwalificaties by person
      const kwalificatiesByPerson = new Map<string, typeof kwalificaties>();
      for (const kwal of kwalificaties) {
        if (!kwalificatiesByPerson.has(kwal.personId)) {
          kwalificatiesByPerson.set(kwal.personId, []);
        }
        kwalificatiesByPerson.get(kwal.personId)?.push(kwal);
      }

      // Sort instructors
      const sortedInstructors = [...instructors].sort((a, b) => {
        const nameA = formatName(a);
        const nameB = formatName(b);
        return nameA.localeCompare(nameB);
      });

      const rows = sortedInstructors.map((instructor) =>
        mapToExportFields(
          {
            instructor,
            kwalificaties: kwalificatiesByPerson.get(instructor.id) ?? [],
            courses,
          },
          selectedFields.map((field) => field.id),
          fieldMappers,
        ),
      );

      const exportDataObject = await createExportData(
        headers,
        transformRows(rows, selectedFields),
        {
          type: format,
          sheetName: "Kwalificaties",
        },
      );

      return {
        data: exportDataToBlob(exportDataObject, format),
        format,
      };
    },
  );

function formatName(person: {
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string | null;
}): string {
  const parts = [person.firstName];
  if (person.lastNamePrefix) parts.push(person.lastNamePrefix);
  if (person.lastName) parts.push(person.lastName);
  return parts.join(" ");
}
