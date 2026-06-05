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
        throw new Error("Cohort not found");
      }

      const authUser = await getUserOrThrow();
      const primaryPerson = await getPrimaryPerson(authUser);

      const isLocationAdmin = await isActiveActorTypeInLocationServerHelper({
        actorType: ["location_admin"],
        locationId: cohort.locationId,
        personId: primaryPerson.id,
      });

      if (!isLocationAdmin) {
        throw new Error("Geen toegang");
      }

      const students = await listStudentsWithCurriculaByCohortId(cohortId);
      // #region agent log
      fetch("http://127.0.0.1:7863/ingest/173945db-8a6f-4fd3-964e-6ba5e92e056e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "00aa10",
        },
        body: JSON.stringify({
          sessionId: "00aa10",
          hypothesisId: "A",
          location: "export-instructor-programmes.ts:pre-aggregate",
          message: "students loaded for export",
          data: {
            total: students.length,
            claimed: students.filter((s) => s.instructor?.id).length,
            missingProgram: students.filter(
              (s) => s.instructor?.id && s.studentCurriculum && !s.studentCurriculum.program,
            ).length,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      let rows: string[][];
      try {
        rows = aggregateInstructorProgrammeRows(students);
        // #region agent log
        fetch("http://127.0.0.1:7863/ingest/173945db-8a6f-4fd3-964e-6ba5e92e056e", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "00aa10",
          },
          body: JSON.stringify({
            sessionId: "00aa10",
            hypothesisId: "A",
            runId: "post-fix",
            location: "export-instructor-programmes.ts:post-aggregate",
            message: "aggregate succeeded",
            data: { rowCount: rows.length },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
      } catch (aggregateError) {
        // #region agent log
        fetch("http://127.0.0.1:7863/ingest/173945db-8a6f-4fd3-964e-6ba5e92e056e", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "00aa10",
          },
          body: JSON.stringify({
            sessionId: "00aa10",
            hypothesisId: "A",
            location: "export-instructor-programmes.ts:aggregate-error",
            message: "aggregate failed",
            data: {
              error:
                aggregateError instanceof Error
                  ? aggregateError.message
                  : String(aggregateError),
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
        // #endregion
        throw aggregateError;
      }

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
