"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserOrThrow, retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Grant leercoach permission
export const grantLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "grant-leercoach-permission",
  })
  .schema(
    z.object({
      aanvraagHandle: z.string(),
      reason: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { aanvraagHandle, reason } = parsedInput;
    const user = await getUserOrThrow();

    const aanvraag = await retrievePvbAanvraagByHandle(aanvraagHandle);
    
    // Check if user is the leercoach
    if (aanvraag.leercoach?.id !== user.personId) {
      throw new Error("Je bent niet de leercoach van deze aanvraag");
    }

    // Check if aanvraag is in the right status
    if (aanvraag.status !== "wacht_op_voorwaarden") {
      throw new Error("Deze aanvraag wacht niet op toestemming");
    }

    // Check if permission hasn't already been given
    if (aanvraag.leercoach.status === "gegeven") {
      throw new Error("Je hebt al toestemming gegeven");
    }

    // Grant permission using existing grantPvbLeercoachPermission function
    const { grantPvbLeercoachPermission } = await import("~/lib/nwd");
    await grantPvbLeercoachPermission({
      pvbAanvraagId: aanvraag.id,
      reden: reason,
    });

    revalidatePath(`/profiel/[handle]/pvb-aanvraag/${aanvraagHandle}`, "page");

    return {
      success: true,
      message: "Toestemming succesvol verleend",
    };
  });

// Deny leercoach permission
export const denyLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "deny-leercoach-permission",
  })
  .schema(
    z.object({
      aanvraagHandle: z.string(),
      reason: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { aanvraagHandle, reason } = parsedInput;
    const user = await getUserOrThrow();

    const aanvraag = await retrievePvbAanvraagByHandle(aanvraagHandle);
    
    // Check if user is the leercoach
    if (aanvraag.leercoach?.id !== user.personId) {
      throw new Error("Je bent niet de leercoach van deze aanvraag");
    }

    // Check if aanvraag is in the right status
    if (aanvraag.status !== "wacht_op_voorwaarden") {
      throw new Error("Deze aanvraag wacht niet op toestemming");
    }

    // Check if permission hasn't already been given
    if (aanvraag.leercoach.status === "gegeven") {
      throw new Error("Je hebt al toestemming gegeven");
    }

    // For now, we'll need to add a denyPvbLeercoachPermission function to the core
    // Since it doesn't exist yet, we'll throw an error
    throw new Error("Toestemming weigeren is momenteel niet beschikbaar");

    // TODO: When the function is available, use:
    // await denyPvbLeercoachPermission({
    //   pvbAanvraagId: aanvraag.id,
    //   reden: reason,
    // });

    // revalidatePath(`/profiel/[handle]/pvb-aanvraag/${aanvraagHandle}`, "page");

    // return {
    //   success: true,
    //   message: "Toestemming geweigerd",
    // };
  });