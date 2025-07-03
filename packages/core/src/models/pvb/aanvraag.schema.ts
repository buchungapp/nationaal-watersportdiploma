import { schema } from "@nawadi/db";
import { z } from "zod";
import { dateTimeSchema, uuidSchema } from "../../utils/index.js";

export const pvbAanvraagStatus = z.enum(schema.aanvraagStatus.enumValues);

export const aanvraagInternPvbSchema = z.object({
  aangevraagdDoor: uuidSchema,
  locatieId: uuidSchema,
  kandidaatId: uuidSchema,
  leercoachId: uuidSchema.nullable(),
  opmerkingen: z.string().nullable(),
  startDatumTijd: dateTimeSchema.nullable(),
  courses: z
    .object({
      courseId: uuidSchema,
      instructieGroepId: uuidSchema,
      isMainCourse: z.boolean(),
      opmerkingen: z.string().nullable(),
    })
    .array()
    .nonempty(),
  onderdelen: z
    .object({
      kerntaakOnderdeelId: uuidSchema,
      beoordelaarId: uuidSchema.nullable(),
      opmerkingen: z.string().nullable(),
    })
    .array()
    .nonempty(),
});

export const aanvraagExternPvbSchema = z.object({
  aangevraagdDoor: uuidSchema,
  locatieId: uuidSchema,
  kandidaatId: uuidSchema,
  leercoachId: uuidSchema.nullable(),
  opmerkingen: z.string().nullable(),
  startDatumTijd: dateTimeSchema.nullable(),
  courses: z
    .object({
      courseId: uuidSchema,
      instructieGroepId: uuidSchema,
      isMainCourse: z.boolean(),
      opmerkingen: z.string().nullable(),
    })
    .array()
    .nonempty(),
  onderdelen: z
    .object({
      kerntaakOnderdeelId: uuidSchema,
      opmerkingen: z.string().nullable(),
    })
    .array()
    .nonempty(),
});

export const aanvraagSchema = z.discriminatedUnion("type", [
  aanvraagInternPvbSchema.extend({ type: z.literal("intern") }),
  aanvraagExternPvbSchema.extend({ type: z.literal("extern") }),
]);

export const createAanvraagOutputSchema = z.object({
  id: uuidSchema,
});

// Schema for adding a pvbOnderdeel
export const addOnderdeelSchema = z.object({
  pvbAanvraagId: uuidSchema,
  kerntaakOnderdeelId: uuidSchema,
  beoordelaarId: uuidSchema.nullable(),
  startDatumTijd: dateTimeSchema.nullable(),
  opmerkingen: z.string().nullable(),
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const addOnderdeelOutputSchema = z.object({
  id: uuidSchema,
});

// Schema for updating leercoach
export const updateLeercoachSchema = z.object({
  pvbAanvraagId: uuidSchema,
  leercoachId: uuidSchema.nullable(),
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const updateLeercoachOutputSchema = z.object({
  success: z.boolean(),
});

// Schema for updating beoordelaar
export const updateBeoordelaarSchema = z.object({
  pvbOnderdeelId: uuidSchema,
  beoordelaarId: uuidSchema.nullable(),
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const updateBeoordelaarOutputSchema = z.object({
  success: z.boolean(),
});

// Schema for adding a course
export const addCourseSchema = z.object({
  pvbAanvraagId: uuidSchema,
  courseId: uuidSchema,
  instructieGroepId: uuidSchema,
  isMainCourse: z.boolean(),
  opmerkingen: z.string().nullable(),
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const addCourseOutputSchema = z.object({
  id: uuidSchema,
});

// Schema for removing a course
export const removeCourseSchema = z.object({
  pvbAanvraagId: uuidSchema,
  courseId: uuidSchema,
  instructieGroepId: uuidSchema,
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const removeCourseOutputSchema = z.object({
  success: z.boolean(),
});

// Schema for setting main course
export const setMainCourseSchema = z.object({
  pvbAanvraagId: uuidSchema,
  courseId: uuidSchema,
  instructieGroepId: uuidSchema,
  aangemaaktDoor: uuidSchema,
  reden: z.string().optional(),
});

export const setMainCourseOutputSchema = z.object({
  success: z.boolean(),
});
