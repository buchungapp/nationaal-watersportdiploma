"use server";

import { Pvb } from "@nawadi/core";
import dayjs from "dayjs";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import {
  getPrimaryPerson,
  getUserOrThrow,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "../utils";

const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

// Helper function to parse dynamic arrays from FormData
function parseDynamicArray<T>(
  formData: FormData,
  prefix: string,
  parser: (index: number) => T | null,
): T[] {
  const results: T[] = [];
  let index = 0;

  while (formData.get(`${prefix}[${index}].id`)) {
    const item = parser(index);
    if (item) {
      results.push(item);
    }
    index++;
  }

  return results;
}

// Schema for the basic form fields that zod-form-data can handle directly
const baseFormDataSchema = zfd.formData({
  locationHandle: zfd.text(),
  courseConfig: z.object({
    niveauId: zfd.text(z.string().uuid()),
    opmerkingen: zfd.text(z.string().optional()),
    selectedOnderdelen: zfd.repeatable(),
  }),
});

// Schema for kwalificatieprofiel
const kwalificatieprofielSchema = z.object({
  id: z.string().uuid(),
  titel: z.string(),
  richting: z.string(),
  hoofdcursus: z
    .object({
      courseId: z.string().uuid(),
    })
    .optional(),
  aanvullendeCursussen: z.array(
    z.object({
      courseId: z.string().uuid(),
    }),
  ),
  instructieGroepId: z.string().uuid().nullable(),
});

// Schema for kandidaat
const kandidaatSchema = z.object({
  id: z.string(),
  leercoach: z.string().uuid().optional(),
  beoordelaar: z.string().uuid().optional(),
  startDatumTijd: z
    .string()
    .optional()
    .transform((data) => {
      if (!data || !dayjs(data).isValid()) return null;
      return dayjs(data).toISOString();
    }),
});

// Combined schema for validation
const createBulkPvbsSchema = z.object({
  locationHandle: z.string(),
  formData: z.instanceof(FormData),
});

/**
 * Create multiple PvB aanvragen (requests) in bulk.
 *
 * This action allows location administrators to create PvB requests for multiple
 * instructors at once. Each request can have:
 * - Multiple kwalificatieprofielen (qualification profiles)
 * - Multiple courses (hoofdcursus + aanvullende cursussen)
 * - Multiple onderdelen (components) to be assessed
 * - Assigned leercoach and beoordelaar per kandidaat
 *
 * The action validates:
 * - User has location admin rights
 * - Selected niveau (level) is valid
 * - At least one kandidaat (candidate) is selected
 * - At least one hoofdcursus (main course) is selected
 * - At least one onderdeel (component) is selected
 * - No duplicate qualifications exist for the candidate
 */
export const createBulkPvbsAction = actionClient
  .schema(createBulkPvbsSchema)
  .stateAction(async ({ parsedInput }) => {
    try {
      const { locationHandle, formData } = parsedInput;
      const location = await retrieveLocationByHandle(locationHandle);
      const user = await getUserOrThrow();

      const primaryPerson = await getPrimaryPerson(user);
      const locationAdminActor = primaryPerson.actors.find(
        (actor) =>
          actor.type === "location_admin" && actor.locationId === location.id,
      );

      if (!locationAdminActor) {
        throw new Error("Aanvrager is geen locatiebeheerder");
      }

      // Parse basic form fields with zod-form-data
      const baseData = baseFormDataSchema.parse(formData);

      // Extract the parsed basic data
      const niveauId = baseData.courseConfig.niveauId;
      const opmerkingen = baseData.courseConfig.opmerkingen;
      const selectedOnderdelen = baseData.courseConfig.selectedOnderdelen || [];

      // Parse kwalificatieprofielen using helper function
      const kwalificatieprofielen = parseDynamicArray(
        formData,
        "courseConfig.kwalificatieprofielen",
        (index) => {
          const id = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].id`,
          ) as string | null;
          if (!id) return null;

          const kp = {
            id,
            titel: formData.get(
              `courseConfig.kwalificatieprofielen[${index}].titel`,
            ) as string,
            richting: formData.get(
              `courseConfig.kwalificatieprofielen[${index}].richting`,
            ) as string,
            hoofdcursus: undefined as { courseId: string } | undefined,
            aanvullendeCursussen: [] as Array<{ courseId: string }>,
            instructieGroepId: formData.get(
              `courseConfig.kwalificatieprofielen[${index}].instructieGroepId`,
            ) as string | null,
          };

          // Get hoofdcursus
          const hoofdcursusId = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].hoofdcursus.courseId`,
          ) as string | null;
          if (hoofdcursusId) {
            kp.hoofdcursus = { courseId: hoofdcursusId };
          }

          // Get aanvullende cursussen
          let courseIndex = 0;
          while (
            formData.get(
              `courseConfig.kwalificatieprofielen[${index}].aanvullendeCursussen[${courseIndex}].courseId`,
            )
          ) {
            const courseId = formData.get(
              `courseConfig.kwalificatieprofielen[${index}].aanvullendeCursussen[${courseIndex}].courseId`,
            ) as string;
            if (courseId) {
              kp.aanvullendeCursussen.push({ courseId });
            }
            courseIndex++;
          }

          return kwalificatieprofielSchema.parse(kp);
        },
      );

      // Parse kandidaten using helper function
      const kandidaten = parseDynamicArray(formData, "kandidaten", (index) => {
        const id = formData.get(`kandidaten[${index}].id`) as string | null;
        if (!id) return null;

        const kandidaat = {
          id,
          leercoach:
            (formData.get(`kandidaten[${index}].leercoach`) as string) ||
            undefined,
          beoordelaar:
            (formData.get(`kandidaten[${index}].beoordelaar`) as string) ||
            undefined,
          startDatumTijd:
            (formData.get(`kandidaten[${index}].startDatumTijd`) as string) ||
            undefined,
        };

        return kandidaatSchema.parse(kandidaat);
      });

      // Validation
      if (!niveauId || niveauId.trim() === "") {
        throw new Error("Selecteer een niveau");
      }

      if (kandidaten.length === 0) {
        throw new Error("Selecteer minimaal één kandidaat");
      }

      if (!kwalificatieprofielen.some((kp) => kp.hoofdcursus)) {
        throw new Error("Selecteer minimaal één hoofdcursus");
      }

      if (!selectedOnderdelen || selectedOnderdelen.length === 0) {
        throw new Error("Selecteer minimaal één onderdeel");
      }

      const results = [];

      // Create PvB aanvraag for each kandidaat
      for (const kandidaat of kandidaten) {
        try {
          // Collect all courses
          const allCourses: Array<{
            courseId: string;
            instructieGroepId: string;
            isMainCourse: boolean;
            opmerkingen: string | null;
          }> = [];

          // Process kwalificatieprofielen and their courses
          for (const kp of kwalificatieprofielen) {
            if (kp.hoofdcursus && kp.instructieGroepId) {
              const instructieGroepId = kp.instructieGroepId;

              allCourses.push({
                courseId: kp.hoofdcursus.courseId,
                instructieGroepId,
                isMainCourse: true,
                opmerkingen: null,
              });
            }

            for (const aanvullendeCursus of kp.aanvullendeCursussen) {
              if (kp.instructieGroepId) {
                const instructieGroepId = kp.instructieGroepId;

                allCourses.push({
                  courseId: aanvullendeCursus.courseId,
                  instructieGroepId,
                  isMainCourse: false,
                  opmerkingen: null,
                });
              }
            }
          }

          // Validate that we have at least one course
          if (allCourses.length === 0) {
            throw new Error(
              "Geen geldige cursussen gevonden. Zorg ervoor dat alle hoofdcursussen zijn geselecteerd.",
            );
          }

          // Ensure at least one course is marked as main
          if (!allCourses.some((c) => c.isMainCourse)) {
            const firstCourse = allCourses[0];
            if (firstCourse) {
              firstCourse.isMainCourse = true;
            }
          }

          const aanvraagInput = {
            type: "intern" as const,
            aangevraagdDoor: locationAdminActor.id,
            locatieId: location.id,
            kandidaatId: kandidaat.id,
            leercoachId: kandidaat.leercoach || null,
            opmerkingen: opmerkingen || null,
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
            onderdelen: selectedOnderdelen.map((onderdeelId: string) => ({
              kerntaakOnderdeelId: onderdeelId,
              beoordelaarId: kandidaat.beoordelaar || null,
              opmerkingen: null,
            })) as [
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
          // Log errors only in development
          if (process.env.NODE_ENV === "development") {
            console.error(
              `Failed to create PvB for kandidaat ${kandidaat.id}:`,
              error,
            );
          }
          results.push({
            kandidaatId: kandidaat.id,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      // Revalidate the PvB list page
      revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

      const successCount = results.filter((r) => r.success).length;
      const failureCount = results.filter((r) => !r.success).length;

      return {
        message: `${successCount} PvB aanvragen succesvol aangemaakt${failureCount > 0 ? `, ${failureCount} gefaald` : ""}`,
        results,
        successCount,
        failureCount,
      };
    } catch (error) {
      // Log errors only in development
      if (process.env.NODE_ENV === "development") {
        console.error("Bulk PvB creation failed:", error);
      }
      throw new Error(
        error instanceof Error ? error.message : DEFAULT_SERVER_ERROR_MESSAGE,
      );
    }
  });
