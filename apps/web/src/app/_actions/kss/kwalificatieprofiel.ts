"use server";

import { KSS } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { actionClientWithMeta } from "../safe-action";

// Create kwalificatieprofiel
export const createKwalificatieprofiel = actionClientWithMeta
  .metadata({ name: "kss.kwalificatieprofiel.create" })
  .schema(KSS.createKwalificatieprofielSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.create(parsedInput);
    revalidatePath("/secretariaat/kss/kwalificatieprofielen");
    return result;
  });

// Update kwalificatieprofiel
export const updateKwalificatieprofiel = actionClientWithMeta
  .metadata({ name: "kss.kwalificatieprofiel.update" })
  .schema(KSS.updateKwalificatieprofielSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.update(parsedInput);
    revalidatePath("/secretariaat/kss/kwalificatieprofielen");
    return result;
  });

// Delete kwalificatieprofiel
export const deleteKwalificatieprofiel = actionClientWithMeta
  .metadata({ name: "kss.kwalificatieprofiel.delete" })
  .schema(KSS.deleteKwalificatieprofielSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.remove(parsedInput);
    revalidatePath("/secretariaat/kss/kwalificatieprofielen");
    return result;
  });

// Create kerntaak
export const createKerntaak = actionClientWithMeta
  .metadata({ name: "kss.kerntaak.create" })
  .schema(KSS.createKerntaakSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.createKerntaak(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// Update kerntaak
export const updateKerntaak = actionClientWithMeta
  .metadata({ name: "kss.kerntaak.update" })
  .schema(KSS.updateKerntaakSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.updateKerntaak(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// Delete kerntaak
export const deleteKerntaak = actionClientWithMeta
  .metadata({ name: "kss.kerntaak.delete" })
  .schema(KSS.deleteKerntaakSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.deleteKerntaak(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// Create kerntaak onderdeel
export const createKerntaakOnderdeel = actionClientWithMeta
  .metadata({ name: "kss.kerntaakOnderdeel.create" })
  .schema(KSS.createKerntaakOnderdeelSchema)
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.createKerntaakOnderdeel(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// Delete kerntaak onderdeel
export const deleteKerntaakOnderdeel = actionClientWithMeta
  .metadata({ name: "kss.kerntaakOnderdeel.delete" })
  .schema(KSS.deleteKerntaakOnderdeelSchema)
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.deleteKerntaakOnderdeel(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// Create werkproces
export const createWerkproces = actionClientWithMeta
  .metadata({ name: "kss.werkproces.create" })
  .schema(KSS.createWerkprocesSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.createWerkproces(parsedInput);
    revalidatePath("/secretariaat/kss/werkprocessen");
    return result;
  });

// Update werkproces
export const updateWerkproces = actionClientWithMeta
  .metadata({ name: "kss.werkproces.update" })
  .schema(KSS.updateWerkprocesSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.updateWerkproces(parsedInput);
    revalidatePath("/secretariaat/kss/werkprocessen");
    return result;
  });

// Delete werkproces
export const deleteWerkproces = actionClientWithMeta
  .metadata({ name: "kss.werkproces.delete" })
  .schema(KSS.deleteWerkprocesSchema)
  .action(async ({ parsedInput }) => {
    const result = await KSS.Kwalificatieprofiel.deleteWerkproces(parsedInput);
    revalidatePath("/secretariaat/kss/werkprocessen");
    return result;
  });

// Create beoordelingscriterium
export const createBeoordelingscriterium = actionClientWithMeta
  .metadata({ name: "kss.beoordelingscriterium.create" })
  .schema(KSS.createBeoordelingscriteriumSchema)
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.createBeoordelingscriterium(parsedInput);
    revalidatePath("/secretariaat/kss/beoordelingscriteria");
    return result;
  });

// Update beoordelingscriterium
export const updateBeoordelingscriterium = actionClientWithMeta
  .metadata({ name: "kss.beoordelingscriterium.update" })
  .schema(KSS.updateBeoordelingscriteriumSchema)
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.updateBeoordelingscriterium(parsedInput);
    revalidatePath("/secretariaat/kss/beoordelingscriteria");
    return result;
  });

// Delete beoordelingscriterium
export const deleteBeoordelingscriterium = actionClientWithMeta
  .metadata({ name: "kss.beoordelingscriterium.delete" })
  .schema(KSS.deleteBeoordelingscriteriumSchema)
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.deleteBeoordelingscriterium(parsedInput);
    revalidatePath("/secretariaat/kss/beoordelingscriteria");
    return result;
  });

// Bulk create beoordelingscriteria
export const bulkCreateBeoordelingscriteria = actionClientWithMeta
  .metadata({ name: "kss.beoordelingscriterium.bulkCreate" })
  .schema(
    z.object({
      werkprocesId: z.string().uuid(),
      criteria: z
        .array(
          z.object({
            title: z.string().min(1, "Titel is verplicht"),
            omschrijving: z.string().min(1, "Omschrijving is verplicht"),
            rang: z.number().int().positive(),
          }),
        )
        .min(1, "Minimaal één criterium is verplicht"),
    }),
  )
  .action(async ({ parsedInput }) => {
    const results = [];

    // Create each criterium using the existing single create function
    for (const criterium of parsedInput.criteria) {
      const result = await KSS.Kwalificatieprofiel.createBeoordelingscriterium({
        werkprocesId: parsedInput.werkprocesId,
        ...criterium,
      });
      results.push(result);
    }

    revalidatePath("/secretariaat/kss/kerntaken");
    return { success: true, count: results.length };
  });

// Assign werkprocessen to onderdeel
export const assignWerkprocessenToOnderdeel = actionClientWithMeta
  .metadata({ name: "kss.werkproces.assignToOnderdeel" })
  .schema(
    z.object({
      kerntaakOnderdeelId: z.string().uuid(),
      werkprocesIds: z.array(z.string().uuid()),
    }),
  )
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.assignWerkprocesToOnderdeel(parsedInput);
    revalidatePath("/secretariaat/kss/kerntaken");
    return result;
  });

// List werkprocessen by onderdeel
export const listWerkprocessenByOnderdeel = actionClientWithMeta
  .metadata({ name: "kss.werkproces.listByOnderdeel" })
  .schema(
    z.object({
      kerntaakOnderdeelId: z.string().uuid(),
    }),
  )
  .action(async ({ parsedInput }) => {
    const result =
      await KSS.Kwalificatieprofiel.listWerkprocessenByOnderdeel(parsedInput);
    return result;
  });
