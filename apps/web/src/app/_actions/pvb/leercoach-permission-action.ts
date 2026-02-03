"use server";

import { Pvb } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  grantPvbLeercoachPermissionAsLeercoach,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Grant leercoach permission
export const grantLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "grant-leercoach-permission",
  })
  .inputSchema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
      remarks: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId, remarks } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the leercoach actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the leercoach actor for this person
    const leercoachActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!leercoachActor) {
      throw new Error("Je bent geen leercoach voor deze aanvraag");
    }

    await Pvb.Aanvraag.grantLeercoachPermission({
      pvbAanvraagId,
      aangemaaktDoor: leercoachActor.id,
      reden: remarks || "Toestemming verleend via dashboard",
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

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
  .inputSchema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
      reason: z.string().min(1, "Reden is verplicht"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId, reason } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the leercoach actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the leercoach actor for this person
    const leercoachActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!leercoachActor) {
      throw new Error("Je bent geen leercoach voor deze aanvraag");
    }

    await Pvb.Aanvraag.denyLeercoachPermission({
      pvbAanvraagId,
      aangemaaktDoor: leercoachActor.id,
      reden: reason,
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Toestemming succesvol geweigerd",
    };
  });

// Bulk grant leercoach permission
export const bulkGrantLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "bulk-grant-leercoach-permission",
  })
  .inputSchema(
    z.object({
      pvbAanvraagIds: z
        .array(z.string().uuid())
        .nonempty("Selecteer minimaal één aanvraag"),
      remarks: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { pvbAanvraagIds, remarks } = parsedInput;

    const result = await grantPvbLeercoachPermissionAsLeercoach({
      pvbAanvraagIds,
      reden: remarks || "Toestemming verleend via dashboard",
    });

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    revalidatePath(`/profiel/${primaryPerson.handle}`);

    return {
      success: true,
      message: `Toestemming verleend voor ${result.updatedCount} aanvragen`,
      updatedCount: result.updatedCount,
    };
  });
