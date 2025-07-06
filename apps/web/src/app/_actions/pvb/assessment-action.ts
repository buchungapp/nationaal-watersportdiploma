"use server";

import { Pvb } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  getPrimaryPerson,
  getUserOrThrow,
  retrievePvbAanvraagByHandle,
} from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Start PvB assessment
export const startPvbAssessmentAction = actionClientWithMeta
  .metadata({
    name: "start-pvb-assessment",
  })
  .schema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the beoordelaar actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the beoordelaar actor for this person
    const beoordelaarActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!beoordelaarActor) {
      throw new Error("Je bent geen beoordelaar voor deze aanvraag");
    }

    await Pvb.Beoordeling.startBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: "Beoordeling gestart via dashboard",
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Beoordeling succesvol gestart",
    };
  });

// Update single PvB beoordelingscriterium
export const updatePvbBeoordelingsCriteriumAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelingscriterium",
  })
  .schema(
    z.object({
      handle: z.string(),
      pvbOnderdeelId: z.string().uuid(),
      beoordelingscriteriumId: z.string().uuid(),
      behaald: z.boolean().nullable(),
      opmerkingen: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const {
      handle,
      pvbOnderdeelId,
      beoordelingscriteriumId,
      behaald,
      opmerkingen,
    } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the beoordelaar actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the beoordelaar actor for this person
    const beoordelaarActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!beoordelaarActor) {
      throw new Error("Je bent geen beoordelaar voor deze aanvraag");
    }

    await Pvb.Beoordeling.updateBeoordelingsCriterium({
      pvbOnderdeelId,
      beoordelingscriteriumId,
      behaald,
      opmerkingen,
      aangemaaktDoor: beoordelaarActor.id,
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Criterium succesvol bijgewerkt",
    };
  });

// Update multiple PvB beoordelingscriteria
export const updatePvbBeoordelingsCriteriaAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelingscriteria",
  })
  .schema(
    z.object({
      handle: z.string(),
      updates: z.array(
        z.object({
          pvbOnderdeelId: z.string().uuid(),
          beoordelingscriteriumId: z.string().uuid(),
          behaald: z.boolean().nullable(),
          opmerkingen: z.string().optional(),
        }),
      ),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, updates } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the beoordelaar actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the beoordelaar actor for this person
    const beoordelaarActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!beoordelaarActor) {
      throw new Error("Je bent geen beoordelaar voor deze aanvraag");
    }

    const result = await Pvb.Beoordeling.updateBeoordelingsCriteria({
      updates,
      aangemaaktDoor: beoordelaarActor.id,
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: `${result.updatedCount} criteria succesvol bijgewerkt`,
    };
  });

// Abort PvB assessment
export const abortPvbAction = actionClientWithMeta
  .metadata({
    name: "abort-pvb-assessment",
  })
  .schema(
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

    // Get the aanvraag to find the beoordelaar actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the beoordelaar actor for this person
    const beoordelaarActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!beoordelaarActor) {
      throw new Error("Je bent geen beoordelaar voor deze aanvraag");
    }

    await Pvb.Beoordeling.abortBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: reason,
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Beoordeling succesvol afgebroken",
    };
  });

// Finalize PvB assessment
export const finalizePvbAssessmentAction = actionClientWithMeta
  .metadata({
    name: "finalize-pvb-assessment",
  })
  .schema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId } = parsedInput;

    const user = await getUserOrThrow();
    const primaryPerson = await getPrimaryPerson(user);

    // Get the aanvraag to find the beoordelaar actor
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    // Find the beoordelaar actor for this person
    const beoordelaarActor = primaryPerson.actors.find(
      (actor) =>
        actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
    );

    if (!beoordelaarActor) {
      throw new Error("Je bent geen beoordelaar voor deze aanvraag");
    }

    const result = await Pvb.Beoordeling.finalizeBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: "Beoordeling afgerond via dashboard",
    });

    revalidatePath(`/profiel/${primaryPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Beoordeling succesvol afgerond",
      alleOnderdelenBeoordeeld: result.alleOnderdelenBeoordeeld,
    };
  });
