"use server";

import { Pvb } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getUserOrThrow, retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

type PvbAanvraag = Awaited<ReturnType<typeof retrievePvbAanvraagByHandle>>;
type OwnedPerson = Awaited<
  ReturnType<typeof getUserOrThrow>
>["persons"][number];

/**
 * Pattern B (role-bound): the acting beoordelaar is RESOURCE-DERIVED — the
 * owned person who is the assigned beoordelaar on one of the aanvraag's
 * onderdelen (compared against ALL owned persons, never a primary/first
 * person). Returns that person together with its instructor actor at the
 * aanvraag's location, which is recorded as `aangemaaktDoor`. Throws when no
 * owned person is an assigned beoordelaar, or that person lacks the instructor
 * actor at the location.
 *
 * retrievePvbAanvraagByHandle already enforces any-owned access; this narrows
 * to the beoordelaar identity required to record an assessment.
 */
function resolveActingBeoordelaar(
  user: { persons: OwnedPerson[] },
  aanvraag: PvbAanvraag,
) {
  const assignedBeoordelaarIds = new Set(
    aanvraag.onderdelen
      .map((onderdeel) => onderdeel.beoordelaar?.id)
      .filter((id): id is string => id != null),
  );

  const actingPerson = user.persons.find((person) =>
    assignedBeoordelaarIds.has(person.id),
  );

  if (!actingPerson) {
    throw new Error("Je bent geen beoordelaar voor deze aanvraag");
  }

  const beoordelaarActor = actingPerson.actors.find(
    (actor) =>
      actor.type === "instructor" && actor.locationId === aanvraag.locatie.id,
  );

  if (!beoordelaarActor) {
    throw new Error("Je bent geen beoordelaar voor deze aanvraag");
  }

  return { actingPerson, beoordelaarActor };
}

// Start PvB assessment
export const startPvbAssessmentAction = actionClientWithMeta
  .metadata({
    name: "start-pvb-assessment",
  })
  .inputSchema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId } = parsedInput;

    const user = await getUserOrThrow();

    // Get the aanvraag (enforces any-owned access) to derive the beoordelaar.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, beoordelaarActor } = resolveActingBeoordelaar(
      user,
      aanvraag,
    );

    await Pvb.Beoordeling.startBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: "Beoordeling gestart via dashboard",
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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
  .inputSchema(
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

    // Get the aanvraag (enforces any-owned access) to derive the beoordelaar.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, beoordelaarActor } = resolveActingBeoordelaar(
      user,
      aanvraag,
    );

    await Pvb.Beoordeling.updateBeoordelingsCriterium({
      pvbOnderdeelId,
      beoordelingscriteriumId,
      behaald,
      opmerkingen,
      aangemaaktDoor: beoordelaarActor.id,
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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
  .inputSchema(
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

    // Get the aanvraag (enforces any-owned access) to derive the beoordelaar.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, beoordelaarActor } = resolveActingBeoordelaar(
      user,
      aanvraag,
    );

    const result = await Pvb.Beoordeling.updateBeoordelingsCriteria({
      updates,
      aangemaaktDoor: beoordelaarActor.id,
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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

    // Get the aanvraag (enforces any-owned access) to derive the beoordelaar.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, beoordelaarActor } = resolveActingBeoordelaar(
      user,
      aanvraag,
    );

    await Pvb.Beoordeling.abortBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: reason,
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

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
  .inputSchema(
    z.object({
      handle: z.string(),
      pvbAanvraagId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { handle, pvbAanvraagId } = parsedInput;

    const user = await getUserOrThrow();

    // Get the aanvraag (enforces any-owned access) to derive the beoordelaar.
    const aanvraag = await retrievePvbAanvraagByHandle(handle);

    const { actingPerson, beoordelaarActor } = resolveActingBeoordelaar(
      user,
      aanvraag,
    );

    const result = await Pvb.Beoordeling.finalizeBeoordeling({
      pvbAanvraagId,
      aangemaaktDoor: beoordelaarActor.id,
      reden: "Beoordeling afgerond via dashboard",
    });

    revalidatePath(`/profiel/${actingPerson.handle}/pvb-aanvraag/${handle}`);

    return {
      success: true,
      message: "Beoordeling succesvol afgerond",
      alleOnderdelenBeoordeeld: result.alleOnderdelenBeoordeeld,
    };
  });
