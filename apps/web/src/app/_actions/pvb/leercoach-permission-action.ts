"use server";

import { Pvb } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getUserOrThrow,
  grantPvbLeercoachPermissionAsLeercoach,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

type PvbAanvraag = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
type OwnedPerson = Awaited<
  ReturnType<typeof getUserOrThrow>
>["persons"][number];

/**
 * Pattern B (role-bound): the acting leercoach is RESOURCE-DERIVED — the owned
 * person who IS the aanvraag's assigned leercoach (compared against ALL owned
 * persons, never a primary/first person). Returns that person with its
 * instructor actor at the aanvraag's location (recorded as `aangemaaktDoor`).
 * Throws when no owned person is the leercoach, or that person lacks the
 * instructor actor at the location.
 */
function resolveActingLeercoach(
  user: { persons: OwnedPerson[] },
  aanvraag: PvbAanvraag,
) {
  const leercoachId = aanvraag.leercoach?.id;

  const actingPerson = leercoachId
    ? user.persons.find((person) => person.id === leercoachId)
    : undefined;

  if (!actingPerson) {
    throw new Error("Je bent geen leercoach voor deze aanvraag");
  }

  const leercoachActor = actingPerson.actors.find(
    (actor) =>
      actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
  );

  if (!leercoachActor) {
    throw new Error("Je bent geen leercoach voor deze aanvraag");
  }

  return { actingPerson, leercoachActor };
}

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

    // Get the aanvraag (enforces any-owned access) to derive the leercoach.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, leercoachActor } = resolveActingLeercoach(
      user,
      aanvraag,
    );

    await Pvb.Aanvraag.grantLeercoachPermission({
      pvbAanvraagId,
      aangemaaktDoor: leercoachActor.id,
      reden: remarks || "Toestemming verleend via dashboard",
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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

    // Get the aanvraag (enforces any-owned access) to derive the leercoach.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, leercoachActor } = resolveActingLeercoach(
      user,
      aanvraag,
    );

    await Pvb.Aanvraag.denyLeercoachPermission({
      pvbAanvraagId,
      aangemaaktDoor: leercoachActor.id,
      reden: reason,
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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

    // The bulk grant is resource-derived per aanvraag (each aanvraag's owned
    // leercoach acts), so there is no single acting profile to revalidate.
    // Revalidate every owned profile root the leercoach could be viewing from.
    const user = await getUserOrThrow();
    for (const person of user.persons) {
      revalidatePath(`/profiel/${person.handle}`);
    }

    return {
      success: true,
      message: `Toestemming verleend voor ${result.updatedCount} aanvragen`,
      updatedCount: result.updatedCount,
    };
  });
