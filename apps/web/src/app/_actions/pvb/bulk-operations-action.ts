"use server";

import { Pvb } from "@nawadi/core";
import { createSafeActionClient } from "next-safe-action";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "../utils";

const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

// Update start time for multiple PVB aanvragen
export const updatePvbStartTimeAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      startDatumTijd: z.string().datetime(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds, startDatumTijd } = parsedInput;

    const location = await retrieveLocationByHandle(locationHandle);
    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    const locationAdminActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "location_admin" && actor.locationId === location.id,
    );

    if (!locationAdminActor) {
      throw new Error("Je hebt geen rechten om deze actie uit te voeren");
    }

    const result = await Pvb.Aanvraag.updateStartTimeForMultiple({
      pvbAanvraagIds,
      startDatumTijd,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Aanvangsdatum/tijd aangepast via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
    };
  });

// Update leercoach for multiple PVB aanvragen
export const updatePvbLeercoachAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      leercoachId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds, leercoachId } = parsedInput;

    const location = await retrieveLocationByHandle(locationHandle);
    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    const locationAdminActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "location_admin" && actor.locationId === location.id,
    );

    if (!locationAdminActor) {
      throw new Error("Je hebt geen rechten om deze actie uit te voeren");
    }

    const result = await Pvb.Aanvraag.updateLeercoachForMultiple({
      pvbAanvraagIds,
      leercoachId,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Leercoach toegewezen via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      updatedCount: result.updatedCount,
    };
  });

// Cancel multiple PVB aanvragen
export const cancelPvbsAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds } = parsedInput;

    const location = await retrieveLocationByHandle(locationHandle);
    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    const locationAdminActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "location_admin" && actor.locationId === location.id,
    );

    if (!locationAdminActor) {
      throw new Error("Je hebt geen rechten om deze actie uit te voeren");
    }

    const result = await Pvb.Aanvraag.cancelMultiple({
      pvbAanvraagIds,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Aanvraag geannuleerd via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      cancelledCount: result.cancelledCount,
    };
  });

// Submit multiple PVB aanvragen
export const submitPvbsAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagIds } = parsedInput;

    const location = await retrieveLocationByHandle(locationHandle);
    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    const locationAdminActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "location_admin" && actor.locationId === location.id,
    );

    if (!locationAdminActor) {
      throw new Error("Je hebt geen rechten om deze actie uit te voeren");
    }

    const result = await Pvb.Aanvraag.submitMultiple({
      pvbAanvraagIds,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Aanvraag ingediend via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen`);

    return {
      success: result.success,
      submittedCount: result.submittedCount,
      results: result.results,
    };
  });
