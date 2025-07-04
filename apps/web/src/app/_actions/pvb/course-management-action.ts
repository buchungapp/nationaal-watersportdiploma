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

// Add course to PVB aanvraag
export const addPvbCourseAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagId: z.string().uuid(),
      courseId: z.string().uuid(),
      instructieGroepId: z.string().uuid(),
      isMainCourse: z.boolean(),
      opmerkingen: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const {
      locationHandle,
      pvbAanvraagId,
      courseId,
      instructieGroepId,
      isMainCourse,
      opmerkingen,
    } = parsedInput;

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

    const result = await Pvb.Aanvraag.addCourse({
      pvbAanvraagId,
      courseId,
      instructieGroepId,
      isMainCourse,
      opmerkingen: opmerkingen ?? null,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Cursus toegevoegd via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${pvbAanvraagId}`);

    return {
      success: true,
      id: result.id,
    };
  });

// Remove course from PVB aanvraag
export const removePvbCourseAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagId: z.string().uuid(),
      courseId: z.string().uuid(),
      instructieGroepId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagId, courseId, instructieGroepId } =
      parsedInput;

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

    const result = await Pvb.Aanvraag.removeCourse({
      pvbAanvraagId,
      courseId,
      instructieGroepId,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Cursus verwijderd via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${pvbAanvraagId}`);

    return {
      success: result.success,
    };
  });

// Set main course for PVB aanvraag
export const setMainPvbCourseAction = actionClient
  .schema(
    z.object({
      locationHandle: z.string(),
      pvbAanvraagId: z.string().uuid(),
      courseId: z.string().uuid(),
      instructieGroepId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { locationHandle, pvbAanvraagId, courseId, instructieGroepId } =
      parsedInput;

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

    await Pvb.Aanvraag.setMainCourse({
      pvbAanvraagId,
      courseId,
      instructieGroepId,
      aangemaaktDoor: locationAdminActor.id,
      reden: "Hoofdcursus gewijzigd via locatiebeheer",
    });

    revalidatePath(`/locatie/${locationHandle}/pvb-aanvragen/${pvbAanvraagId}`);

    return {
      success: true,
    };
  });
