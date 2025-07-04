import { schema as s } from "@nawadi/db";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { singleRow } from "../../utils/data-helpers.js";
import { withZod, wrapCommand } from "../../utils/index.js";

import { logPvbEvent } from "./index.js";

// Start the assessment (transition to in_beoordeling)
export const startBeoordeling = wrapCommand(
  "pvb.startBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current status
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "gereed_voor_beoordeling") {
        throw new Error(
          "Alleen aanvragen die gereed zijn voor beoordeling kunnen worden gestart",
        );
      }

      // Update status to in_beoordeling
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "in_beoordeling",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling gestart",
      });

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "beoordeling_gestart",
        data: {
          gestartDoor: input.aangemaaktDoor,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling gestart",
      });

      return {
        success: true,
      };
    },
  ),
);

// Complete the assessment (transition to afgerond)
export const completeBeoordeling = wrapCommand(
  "pvb.completeBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current status
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "in_beoordeling") {
        throw new Error(
          "Alleen aanvragen die in beoordeling zijn kunnen worden afgerond",
        );
      }

      // Update status to afgerond
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "afgerond",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling afgerond",
      });

      // Log the completion event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "beoordeling_afgerond",
        data: {
          afgerondDoor: input.aangemaaktDoor,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Beoordeling afgerond",
      });

      return {
        success: true,
      };
    },
  ),
);

// Update a single beoordelingscriterium
export const updateBeoordelingsCriterium = wrapCommand(
  "pvb.updateBeoordelingsCriterium",
  withZod(
    z.object({
      pvbOnderdeelId: z.string().uuid(),
      beoordelingscriteriumId: z.string().uuid(),
      behaald: z.boolean().nullable(),
      opmerkingen: z.string().optional(),
      aangemaaktDoor: z.string().uuid(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get the kerntaakId from the pvbOnderdeel
      const onderdeelResults = await query
        .select({ 
          kerntaakId: s.pvbOnderdeel.kerntaakId,
          pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId 
        })
        .from(s.pvbOnderdeel)
        .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId))
        .limit(1);

      const onderdeel = singleRow(onderdeelResults);

      // Check if the criterium already exists
      const existingResults = await query
        .select({ id: s.pvbOnderdeelBeoordelingsCriterium.id })
        .from(s.pvbOnderdeelBeoordelingsCriterium)
        .where(
          and(
            eq(s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId, input.pvbOnderdeelId),
            eq(s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId, input.beoordelingscriteriumId)
          )
        )
        .limit(1);

      const existing = existingResults.length > 0;

      if (existing) {
        // Update existing
        await query
          .update(s.pvbOnderdeelBeoordelingsCriterium)
          .set({
            behaald: input.behaald,
            opmerkingen: input.opmerkingen,
          })
          .where(
            and(
              eq(s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId, input.pvbOnderdeelId),
              eq(s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId, input.beoordelingscriteriumId)
            )
          );
      } else {
        // Insert new
        await query.insert(s.pvbOnderdeelBeoordelingsCriterium).values({
          pvbOnderdeelId: input.pvbOnderdeelId,
          kerntaakId: onderdeel.kerntaakId,
          beoordelingscriteriumId: input.beoordelingscriteriumId,
          behaald: input.behaald,
          opmerkingen: input.opmerkingen,
        });
      }

      return {
        success: true,
      };
    },
  ),
);

// Update multiple beoordelingscriteria at once
export const updateBeoordelingsCriteria = wrapCommand(
  "pvb.updateBeoordelingsCriteria",
  withZod(
    z.object({
      updates: z.array(
        z.object({
          pvbOnderdeelId: z.string().uuid(),
          beoordelingscriteriumId: z.string().uuid(),
          behaald: z.boolean().nullable(),
          opmerkingen: z.string().optional(),
        })
      ),
      aangemaaktDoor: z.string().uuid(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number(),
    }),
    async (input) => {
      let updatedCount = 0;

      for (const update of input.updates) {
        try {
          await updateBeoordelingsCriterium({
            ...update,
            aangemaaktDoor: input.aangemaaktDoor,
          });
          updatedCount++;
        } catch (error) {
          console.error(`Failed to update criterium ${update.beoordelingscriteriumId}:`, error);
        }
      }

      return {
        success: true,
        updatedCount,
      };
    },
  ),
);

// Update onderdeel uitslag
export const updateOnderdeelUitslag = wrapCommand(
  "pvb.updateOnderdeelUitslag",
  withZod(
    z.object({
      pvbOnderdeelId: z.string().uuid(),
      uitslag: z.enum(["behaald", "niet_behaald", "nog_niet_bekend"]),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get the pvbAanvraagId for logging
      const onderdeelResults = await query
        .select({ pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId })
        .from(s.pvbOnderdeel)
        .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId))
        .limit(1);

      const onderdeel = singleRow(onderdeelResults);

      // Update the uitslag
      await query
        .update(s.pvbOnderdeel)
        .set({ uitslag: input.uitslag })
        .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId));

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: onderdeel.pvbAanvraagId,
        pvbOnderdeelId: input.pvbOnderdeelId,
        gebeurtenisType: "onderdeel_uitslag_gewijzigd",
        data: {
          nieuweUitslag: input.uitslag,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? `Uitslag gewijzigd naar ${input.uitslag}`,
      });

      return {
        success: true,
      };
    },
  ),
);

// Abort the assessment (transition to afgebroken)
export const abortBeoordeling = wrapCommand(
  "pvb.abortBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current status
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "in_beoordeling") {
        throw new Error(
          "Alleen aanvragen die in beoordeling zijn kunnen worden afgebroken",
        );
      }

      // Update status to afgebroken
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "afgebroken",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      // Log the abort event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "aanvraag_ingetrokken",
        data: {
          afgebrokenDoor: input.aangemaaktDoor,
          voorigeStatus: currentStatus.status,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      return {
        success: true,
      };
    },
  ),
);

// Finalize the assessment (complete with all criteria evaluated)
export const finalizeBeoordeling = wrapCommand(
  "pvb.finalizeBeoordeling",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      alleOnderdelenBeoordeeld: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Check if all onderdelen have been assessed
      const onderdelenResults = await query
        .select({
          totalOnderdelen: sql<number>`count(*)`.as("total"),
          beoordeeldeOnderdelen: sql<number>`count(*) filter (where ${s.pvbOnderdeel.uitslag} != 'nog_niet_bekend')`.as("beoordeeld"),
        })
        .from(s.pvbOnderdeel)
        .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId));

      const stats = singleRow(onderdelenResults);
      const alleOnderdelenBeoordeeld = stats.totalOnderdelen === stats.beoordeeldeOnderdelen;

      if (!alleOnderdelenBeoordeeld) {
        throw new Error("Niet alle onderdelen zijn beoordeeld");
      }

      // Complete the assessment
      await completeBeoordeling({
        pvbAanvraagId: input.pvbAanvraagId,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Alle onderdelen beoordeeld - beoordeling afgerond",
      });

      return {
        success: true,
        alleOnderdelenBeoordeeld,
      };
    },
  ),
);
