import { z } from "zod";
import { uuidSchema } from "../../utils/index.js";

// Output schemas for queries
export const instructiegroepOutputSchema = z.object({
  id: uuidSchema,
  title: z.string(),
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
});

export const instructiegroepWithCoursesOutputSchema =
  instructiegroepOutputSchema.extend({
    courses: z.array(
      z.object({
        id: uuidSchema,
        handle: z.string(),
        title: z.string().nullable(),
        code: z.string().nullable(),
      }),
    ),
  });

export const listInstructiegroepSchema = z.object({
  filter: z
    .object({
      id: uuidSchema.optional(),
      richting: z
        .enum(["instructeur", "leercoach", "pvb_beoordelaar"])
        .optional(),
    })
    .default({}),
});

// Mutation schemas
export const createInstructiegroepSchema = z.object({
  title: z.string().min(1, "Titel is verplicht"),
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
});

export const createInstructiegroepOutputSchema = z.object({
  id: uuidSchema,
});

export const updateInstructiegroepSchema = z.object({
  id: uuidSchema,
  title: z.string().min(1, "Titel is verplicht").optional(),
  richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]).optional(),
});

export const updateInstructiegroepOutputSchema = z.object({
  success: z.boolean(),
});

export const deleteInstructiegroepSchema = z.object({
  id: uuidSchema,
});

export const deleteInstructiegroepOutputSchema = z.object({
  success: z.boolean(),
});

// Instructiegroep cursus schemas
export const addCourseToInstructiegroepSchema = z.object({
  instructieGroepId: uuidSchema,
  courseId: uuidSchema,
});

export const addCourseToInstructiegroepOutputSchema = z.object({
  success: z.boolean(),
});

export const removeCourseFromInstructiegroepSchema = z.object({
  instructieGroepId: uuidSchema,
  courseId: uuidSchema,
});

export const removeCourseFromInstructiegroepOutputSchema = z.object({
  success: z.boolean(),
});
