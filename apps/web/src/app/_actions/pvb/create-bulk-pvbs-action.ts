"use server";

import { Pvb } from "@nawadi/core";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserOrThrow, retrieveLocationByHandle } from "~/lib/nwd";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "../utils";

const actionClient = createSafeActionClient();

const createBulkPvbsSchema = z.object({
  locationHandle: z.string(),
  courseConfig: z.object({
    niveauId: z.string().uuid(),
    selectedOnderdelen: z
      .array(z.string().uuid())
      .min(1, "Selecteer minimaal één onderdeel"),
    kwalificatieprofielen: z
      .array(
        z.object({
          id: z.string().uuid(),
          titel: z.string(),
          richting: z.string(),
          hoofdcursus: z
            .object({
              courseId: z.string().uuid(),
              instructieGroepId: z.string().uuid(),
            })
            .optional(),
          aanvullendeCursussen: z
            .array(
              z.object({
                courseId: z.string().uuid(),
                instructieGroepId: z.string().uuid(),
              }),
            )
            .default([]),
        }),
      )
      .min(1, "Selecteer minimaal één kwalificatieprofiel"),
    opmerkingen: z.string().optional(),
  }),
  kandidaten: z
    .array(
      z.object({
        id: z.string().uuid(),
        leercoach: z.string().uuid().optional(),
        beoordelaar: z.string().uuid().optional(),
        startDatumTijd: z.string().optional(),
      }),
    )
    .min(1, "Selecteer minimaal één kandidaat"),
});

export const createBulkPvbsAction = actionClient
  .schema(createBulkPvbsSchema)
  .stateAction(async ({ parsedInput }) => {
    try {
      const location = await retrieveLocationByHandle(
        parsedInput.locationHandle,
      );
      const user = await getUserOrThrow();

      const results = [];

      // Create PvB aanvraag for each kandidaat
      for (const kandidaat of parsedInput.kandidaten) {
        try {
          // Collect all courses (hoofdcursussen and aanvullende cursussen)
          const allCourses: Array<{
            courseId: string;
            instructieGroepId: string;
            isMainCourse: boolean;
            opmerkingen: string | null;
          }> = [];

          for (const kp of parsedInput.courseConfig.kwalificatieprofielen) {
            // Add hoofdcursus if selected
            if (kp.hoofdcursus) {
              allCourses.push({
                courseId: kp.hoofdcursus.courseId,
                instructieGroepId: kp.hoofdcursus.instructieGroepId,
                isMainCourse: true, // First hoofdcursus is main
                opmerkingen: null,
              });
            }

            // Add aanvullende cursussen
            for (const aanvullendeCursus of kp.aanvullendeCursussen) {
              allCourses.push({
                courseId: aanvullendeCursus.courseId,
                instructieGroepId: aanvullendeCursus.instructieGroepId,
                isMainCourse: false,
                opmerkingen: null,
              });
            }
          }

          // Ensure at least one course is marked as main
          if (
            allCourses.length > 0 &&
            !allCourses.some((c) => c.isMainCourse)
          ) {
            const firstCourse = allCourses[0];
            if (firstCourse) {
              firstCourse.isMainCourse = true;
            }
          }

          const aanvraagInput = {
            type: "intern" as const,
            locatieId: location.id,
            kandidaatId: kandidaat.id,
            leercoachId: kandidaat.leercoach || null,
            opmerkingen: parsedInput.courseConfig.opmerkingen || null,
            startDatumTijd: kandidaat.startDatumTijd || null,
            courses: allCourses as [
              {
                courseId: string;
                instructieGroepId: string;
                isMainCourse: boolean;
                opmerkingen: string | null;
              },
              ...{
                courseId: string;
                instructieGroepId: string;
                isMainCourse: boolean;
                opmerkingen: string | null;
              }[],
            ],
            onderdelen: parsedInput.courseConfig.selectedOnderdelen.map(
              (onderdeelId) => ({
                kerntaakOnderdeelId: onderdeelId,
                beoordelaarId: kandidaat.beoordelaar || null,
                opmerkingen: null,
              }),
            ) as [
              {
                kerntaakOnderdeelId: string;
                beoordelaarId: string | null;
                opmerkingen: string | null;
              },
              ...{
                kerntaakOnderdeelId: string;
                beoordelaarId: string | null;
                opmerkingen: string | null;
              }[],
            ],
          };

          const result = await Pvb.Aanvraag.createAanvraag(aanvraagInput);

          results.push({
            kandidaatId: kandidaat.id,
            success: true,
            aanvraagId: result.id,
          });
        } catch (error) {
          console.error(
            `Failed to create PvB for kandidaat ${kandidaat.id}:`,
            error,
          );
          results.push({
            kandidaatId: kandidaat.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Revalidate the PvB list page
      revalidatePath(
        `/(dashboard)/(management)/locatie/${parsedInput.locationHandle}/pvb-aanvragen`,
      );

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        message: `${successCount} PvB aanvragen succesvol aangemaakt${failureCount > 0 ? `, ${failureCount} gefaald` : ""}`,
        results,
        successCount,
        failureCount,
      };
    } catch (error) {
      console.error("Bulk PvB creation failed:", error);
      throw new Error(DEFAULT_SERVER_ERROR_MESSAGE);
    }
  });
