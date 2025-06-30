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
    courses: z
      .array(
        z.object({
          id: z.string().uuid(),
          isMain: z.boolean(),
        }),
      )
      .min(1, "Selecteer minimaal één cursus")
      .refine(
        (courses) => courses.filter((c) => c.isMain).length === 1,
        "Exact één cursus moet als 'main' gemarkeerd zijn",
      ),
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
          const aanvraagInput = {
            type: "intern" as const,
            locatieId: location.id,
            kandidaatId: kandidaat.id,
            leercoachId: kandidaat.leercoach || null,
            opmerkingen: parsedInput.courseConfig.opmerkingen || null,
            startDatumTijd: kandidaat.startDatumTijd || null,
            courses: parsedInput.courseConfig.courses.map((course) => ({
              courseId: course.id,
              isMainCourse: course.isMain,
              opmerkingen: null,
            })) as [
              {
                courseId: string;
                isMainCourse: boolean;
                opmerkingen: string | null;
              },
              ...{
                courseId: string;
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
