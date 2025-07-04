"use server";

import { Pvb } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  retrieveLocationByHandle,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Add course to PVB aanvraag
export const addPvbCourseAction = actionClientWithMeta
  .metadata({
    name: "add-pvb-course",
  })
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
export const removePvbCourseAction = actionClientWithMeta
  .metadata({
    name: "remove-pvb-course",
  })
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
export const setMainPvbCourseAction = actionClientWithMeta
  .metadata({
    name: "set-main-pvb-course",
  })
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
