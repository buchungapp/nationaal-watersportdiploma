"use server";

import dayjs from "dayjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { zfd } from "zod-form-data";
import { createBulkPvbs, retrieveLocationByHandle } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "../utils";

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
  instructieGroepId: z
    .string()
    .transform((val) => (val === "" ? null : val))
    .pipe(z.string().uuid().nullable()),
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
export const createBulkPvbsAction = actionClientWithMeta
  .metadata({
    name: "create-pvb-bulk",
  })
  .schema(createBulkPvbsSchema)
  .stateAction(async ({ parsedInput }) => {
    try {
      const { locationHandle, formData } = parsedInput;
      const location = await retrieveLocationByHandle(locationHandle);

      // Parse basic form fields with zod-form-data
      const baseData = baseFormDataSchema.parse(formData);

      // Extract the parsed basic data
      const niveauId = baseData.courseConfig.niveauId;
      const opmerkingen = baseData.courseConfig.opmerkingen;
      const selectedOnderdelen = baseData.courseConfig.selectedOnderdelen || [];

      // Parse kwalificatieprofielen using helper function - only include enabled ones
      const kwalificatieprofielen = parseDynamicArray(
        formData,
        "courseConfig.kwalificatieprofielen",
        (index) => {
          const id = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].id`,
          ) as string | null;
          if (!id) return null;

          // Check if this kwalificatieprofiel is enabled by verifying required fields are present
          // Disabled kwalificatieprofielen won't have these fields in the form data
          const titel = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].titel`,
          ) as string | null;
          const richting = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].richting`,
          ) as string | null;
          const instructieGroepId = formData.get(
            `courseConfig.kwalificatieprofielen[${index}].instructieGroepId`,
          ) as string | null;

          // If essential fields are missing, this kwalificatieprofiel is disabled
          if (!titel || !richting) {
            return null;
          }

          const kp = {
            id,
            titel,
            richting,
            hoofdcursus: undefined as { courseId: string } | undefined,
            aanvullendeCursussen: [] as Array<{ courseId: string }>,
            instructieGroepId,
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

      // Use the createBulkPvbs function from lib/nwd.ts
      const result = await createBulkPvbs({
        locationId: location.id,
        kandidaten,
        kwalificatieprofielen,
        selectedOnderdelen: selectedOnderdelen as string[],
        opmerkingen,
      });

      // Revalidate the PvB list page
      revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

      return result;
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
