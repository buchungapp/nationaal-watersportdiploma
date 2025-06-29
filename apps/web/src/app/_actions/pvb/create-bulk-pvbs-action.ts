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
    type: z.enum(["instructeur", "assistent"]),
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

      // Get course IDs for the type (simplified - you might need to adjust this based on your course structure)
      // For now, I'll use a placeholder approach - you'll need to implement proper course selection
      const courseId = "placeholder-course-id"; // TODO: Implement proper course selection logic
      const onderdeelId = "placeholder-onderdeel-id"; // TODO: Implement proper onderdeel selection logic

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
            courses: [
              {
                courseId: courseId,
                isMainCourse: true,
                opmerkingen: null,
              },
            ] as [
              {
                courseId: string;
                isMainCourse: boolean;
                opmerkingen: string | null;
              },
            ],
            onderdelen: [
              {
                kerntaakOnderdeelId: onderdeelId,
                beoordelaarId: kandidaat.beoordelaar || null,
                opmerkingen: null,
              },
            ] as [
              {
                kerntaakOnderdeelId: string;
                beoordelaarId: string | null;
                opmerkingen: string | null;
              },
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
