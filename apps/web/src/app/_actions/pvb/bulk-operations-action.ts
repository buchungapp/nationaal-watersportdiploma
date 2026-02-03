"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  cancelPvbsForMultiple,
  grantPvbLeercoachPermissionForMultiple,
  submitPvbsForMultiple,
  updatePvbBeoordelaarForMultiple,
  updatePvbLeercoachForMultiple,
  updatePvbStartTimeForMultiple,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Update start time for multiple PVB aanvragen
export const updatePvbStartTimeAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-start-time-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      startDatumTijd: z.string().datetime(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds, startDatumTijd } = parsedInput;

    const result = await updatePvbStartTimeForMultiple({
      pvbAanvraagIds,
      startDatumTijd,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
    };
  });

// Update leercoach for multiple PVB aanvragen
export const updatePvbLeercoachAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-leercoach-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      leercoachId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds, leercoachId } = parsedInput;

    const result = await updatePvbLeercoachForMultiple({
      pvbAanvraagIds,
      leercoachId,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
    };
  });

// Update beoordelaar for multiple PVB aanvragen
export const updatePvbBeoordelaarAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelaar-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      beoordelaarId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds, beoordelaarId } = parsedInput;

    const result = await updatePvbBeoordelaarForMultiple({
      pvbAanvraagIds,
      beoordelaarId,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
    };
  });

// Cancel multiple PVB aanvragen
export const cancelPvbsAction = actionClientWithMeta
  .metadata({
    name: "cancel-pvb-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds } = parsedInput;

    const result = await cancelPvbsForMultiple({
      pvbAanvraagIds,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      cancelledCount: result.cancelledCount,
    };
  });

// Submit multiple PVB aanvragen
export const submitPvbsAction = actionClientWithMeta
  .metadata({
    name: "submit-pvb-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds } = parsedInput;

    const result = await submitPvbsForMultiple({
      pvbAanvraagIds,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      submittedCount: result.submittedCount,
      results: result.results,
    };
  });

// Grant leercoach permission for multiple PVB aanvragen (on behalf of leercoach)
export const grantLeercoachPermissionAction = actionClientWithMeta
  .metadata({
    name: "grant-pvb-leercoach-permission-bulk",
  })
  .inputSchema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds } = parsedInput;

    const result = await grantPvbLeercoachPermissionForMultiple({
      pvbAanvraagIds,
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
      results: result.results,
    };
  });
