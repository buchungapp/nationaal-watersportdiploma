"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  grantPvbLeercoachPermission,
  retrievePvbAanvraagByHandle,
  submitPvbAanvraag,
  updatePvbBeoordelaar,
  updatePvbLeercoach,
  updatePvbStartTime,
  withdrawPvbAanvraag,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Update PVB leercoach
export const updatePvbLeercoachAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-leercoach",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
      leercoachId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle, leercoachId } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await updatePvbLeercoach({
      pvbAanvraagId: aanvraag.id,
      leercoachId,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "Leercoach succesvol bijgewerkt",
    };
  });

// Update PVB beoordelaar
export const updatePvbBeoordelaarAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelaar",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
      beoordelaarId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle, beoordelaarId } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await updatePvbBeoordelaar({
      pvbAanvraagId: aanvraag.id,
      beoordelaarId,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "Beoordelaar succesvol bijgewerkt",
    };
  });

// Update PVB start time
export const updatePvbStartTimeAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-start-time",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
      startDatumTijd: z.string().datetime(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle, startDatumTijd } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await updatePvbStartTime({
      pvbAanvraagId: aanvraag.id,
      startDatumTijd,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "Startdatum/tijd succesvol bijgewerkt",
    };
  });

// Grant PVB leercoach permission
export const grantPvbLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "grant-pvb-leercoach-permission",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
      reason: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle, reason } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await grantPvbLeercoachPermission({
      pvbAanvraagId: aanvraag.id,
      reden: reason,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "Toestemming namens leercoach succesvol verleend",
    };
  });

// Submit PVB aanvraag
export const submitPvbAanvraagAction = actionClientWithMeta
  .metadata({
    name: "submit-pvb-aanvraag",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await submitPvbAanvraag({
      pvbAanvraagId: aanvraag.id,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);
    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "PvB aanvraag succesvol geactiveerd",
    };
  });

// Withdraw PVB aanvraag
export const withdrawPvbAanvraagAction = actionClientWithMeta
  .metadata({
    name: "withdraw-pvb-aanvraag",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      handle: z.string(),
      reason: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, handle, reason } = parsedInput;

    const aanvraag = await retrievePvbAanvraagByHandle(handle);
    await withdrawPvbAanvraag({
      pvbAanvraagId: aanvraag.id,
      reden: reason,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);
    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${handle}`);

    return {
      success: true,
      message: "PvB aanvraag succesvol ingetrokken",
    };
  });
