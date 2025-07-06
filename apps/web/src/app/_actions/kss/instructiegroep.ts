"use server";

import { KSS } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { actionClientWithMeta } from "../safe-action";

// Create instructiegroep
export const createInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.create" })
  .schema(KSS.createInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.InstructieGroep.create(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Update instructiegroep
export const updateInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.update" })
  .schema(KSS.updateInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.InstructieGroep.update(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Delete instructiegroep
export const deleteInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.delete" })
  .schema(KSS.deleteInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.InstructieGroep.remove(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Add course to instructiegroep
export const addCourseToInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.addCourse" })
  .schema(KSS.addCourseToInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.InstructieGroep.addCourse(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Remove course from instructiegroep
export const removeCourseFromInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.removeCourse" })
  .schema(KSS.removeCourseFromInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.InstructieGroep.removeCourse(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });
