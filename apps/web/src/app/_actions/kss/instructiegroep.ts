"use server";

import { KSS } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { isSystemAdmin } from "~/lib/authorization";
import { getUserOrThrow } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Defense in depth: the /secretariaat edge middleware gates the pages, but a
// server action is an independently callable endpoint, so we check here too.
async function assertSecretariaat() {
  const user = await getUserOrThrow();
  if (!isSystemAdmin(user.email)) {
    throw new Error("Geen toegang tot deze functie");
  }
}

// Create instructiegroep
export const createInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.create" })
  .inputSchema(KSS.createInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    await assertSecretariaat();
    const result = await KSS.InstructieGroep.create(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Update instructiegroep
export const updateInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.update" })
  .inputSchema(KSS.updateInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    await assertSecretariaat();
    const result = await KSS.InstructieGroep.update(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Delete instructiegroep
export const deleteInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.delete" })
  .inputSchema(KSS.deleteInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    await assertSecretariaat();
    const result = await KSS.InstructieGroep.remove(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Add course to instructiegroep
export const addCourseToInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.addCourse" })
  .inputSchema(KSS.addCourseToInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    await assertSecretariaat();
    const result = await KSS.InstructieGroep.addCourse(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });

// Remove course from instructiegroep
export const removeCourseFromInstructiegroep = actionClientWithMeta
  .metadata({ name: "kss.instructiegroep.removeCourse" })
  .inputSchema(KSS.removeCourseFromInstructiegroepSchema)
  .action(async ({ parsedInput }) => {
    await assertSecretariaat();
    const result = await KSS.InstructieGroep.removeCourse(parsedInput);
    revalidatePath("/secretariaat/kss/instructiegroepen");
    return result;
  });
