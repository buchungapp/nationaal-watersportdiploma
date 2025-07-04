"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Pvb, getUserOrThrow, retrievePvbAanvraagByHandle } from "~/lib/nwd";
import { actionClientWithMeta } from "../safe-action";

// Start PvB assessment (beoordelaar)
export const startPvbAssessmentAction = actionClientWithMeta
  .metadata({
    name: "start-pvb-assessment",
  })
  .schema(
    z.object({
      aanvraagHandle: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { aanvraagHandle } = parsedInput;
    const user = await getUserOrThrow();

    const aanvraag = await retrievePvbAanvraagByHandle(aanvraagHandle);
    
    // Check if user is the beoordelaar
    const isBeoordelaar = aanvraag.onderdelen.some(
      (onderdeel) => onderdeel.beoordelaar?.id === user.personId
    );
    
    if (!isBeoordelaar) {
      throw new Error("Je bent niet de beoordelaar van deze aanvraag");
    }

    if (aanvraag.status !== "gereed_voor_beoordeling") {
      throw new Error("Deze aanvraag is niet gereed voor beoordeling");
    }

    await Pvb.Aanvraag.startBeoordeling({
      pvbAanvraagId: aanvraag.id,
    });

    revalidatePath(`/profiel/[handle]/pvb-aanvraag/${aanvraagHandle}`, "page");

    return {
      success: true,
      message: "Beoordeling succesvol gestart",
    };
  });

// Update beoordelingscriterium status
export const updatePvbBeoordelingsCriteriumAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelingscriterium",
  })
  .schema(
    z.object({
      pvbOnderdeelId: z.string().uuid(),
      beoordelingscriteriumId: z.string().uuid(),
      behaald: z.boolean().nullable(),
      opmerkingen: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { pvbOnderdeelId, beoordelingscriteriumId, behaald, opmerkingen } = parsedInput;
    const user = await getUserOrThrow();

    // Update the beoordelingscriterium
    await Pvb.Onderdeel.updateBeoordelingsCriterium({
      pvbOnderdeelId,
      beoordelingscriteriumId,
      behaald,
      opmerkingen,
    });

    return {
      success: true,
      message: "Beoordelingscriterium bijgewerkt",
    };
  });

// Update multiple beoordelingscriteria at once
export const updatePvbBeoordelingsCriteriaAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-beoordelingscriteria",
  })
  .schema(
    z.object({
      pvbOnderdeelId: z.string().uuid(),
      updates: z.array(
        z.object({
          beoordelingscriteriumId: z.string().uuid(),
          behaald: z.boolean().nullable(),
          opmerkingen: z.string().optional(),
        })
      ),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { pvbOnderdeelId, updates } = parsedInput;
    const user = await getUserOrThrow();

    // Update all criteria
    await Promise.all(
      updates.map((update) =>
        Pvb.Onderdeel.updateBeoordelingsCriterium({
          pvbOnderdeelId,
          beoordelingscriteriumId: update.beoordelingscriteriumId,
          behaald: update.behaald,
          opmerkingen: update.opmerkingen,
        })
      )
    );

    return {
      success: true,
      message: "Beoordelingscriteria bijgewerkt",
    };
  });

// Update onderdeel uitslag
export const updatePvbOnderdeelUitslagAction = actionClientWithMeta
  .metadata({
    name: "update-pvb-onderdeel-uitslag",
  })
  .schema(
    z.object({
      pvbOnderdeelId: z.string().uuid(),
      uitslag: z.enum(["behaald", "niet_behaald", "nog_niet_bekend"]),
      opmerkingen: z.string().optional(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { pvbOnderdeelId, uitslag, opmerkingen } = parsedInput;
    const user = await getUserOrThrow();

    await Pvb.Onderdeel.updateUitslag({
      pvbOnderdeelId,
      uitslag,
      opmerkingen,
    });

    return {
      success: true,
      message: "Onderdeel uitslag bijgewerkt",
    };
  });

// Abort PvB
export const abortPvbAction = actionClientWithMeta
  .metadata({
    name: "abort-pvb",
  })
  .schema(
    z.object({
      aanvraagHandle: z.string(),
      reden: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { aanvraagHandle, reden } = parsedInput;
    const user = await getUserOrThrow();

    const aanvraag = await retrievePvbAanvraagByHandle(aanvraagHandle);
    
    // Check if user is the beoordelaar
    const isBeoordelaar = aanvraag.onderdelen.some(
      (onderdeel) => onderdeel.beoordelaar?.id === user.personId
    );
    
    if (!isBeoordelaar) {
      throw new Error("Je bent niet de beoordelaar van deze aanvraag");
    }

    if (aanvraag.status !== "in_beoordeling") {
      throw new Error("Deze aanvraag is niet in beoordeling");
    }

    await Pvb.Aanvraag.abortBeoordeling({
      pvbAanvraagId: aanvraag.id,
      reden,
    });

    revalidatePath(`/profiel/[handle]/pvb-aanvraag/${aanvraagHandle}`, "page");

    return {
      success: true,
      message: "PvB beoordeling afgebroken",
    };
  });

// Finalize assessment
export const finalizePvbAssessmentAction = actionClientWithMeta
  .metadata({
    name: "finalize-pvb-assessment",
  })
  .schema(
    z.object({
      aanvraagHandle: z.string(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const { aanvraagHandle } = parsedInput;
    const user = await getUserOrThrow();

    const aanvraag = await retrievePvbAanvraagByHandle(aanvraagHandle);
    
    // Check if user is the beoordelaar
    const isBeoordelaar = aanvraag.onderdelen.some(
      (onderdeel) => onderdeel.beoordelaar?.id === user.personId
    );
    
    if (!isBeoordelaar) {
      throw new Error("Je bent niet de beoordelaar van deze aanvraag");
    }

    if (aanvraag.status !== "in_beoordeling") {
      throw new Error("Deze aanvraag is niet in beoordeling");
    }

    // Check if all onderdelen have been assessed
    const allAssessed = aanvraag.onderdelen.every(
      (onderdeel) => onderdeel.uitslag !== "nog_niet_bekend"
    );

    if (!allAssessed) {
      throw new Error("Niet alle onderdelen zijn beoordeeld");
    }

    await Pvb.Aanvraag.finalizeBeoordeling({
      pvbAanvraagId: aanvraag.id,
    });

    revalidatePath(`/profiel/[handle]/pvb-aanvraag/${aanvraagHandle}`, "page");

    return {
      success: true,
      message: "Beoordeling succesvol afgerond",
    };
  });