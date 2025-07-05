import { schema as s } from "@nawadi/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
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
        .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
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
        .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
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

      // Execute authorization, status, and onderdeel data fetching in parallel
      const [actorResults, onderdeelResults] = await Promise.all([
        query
          .select({ personId: s.actor.personId })
          .from(s.actor)
          .where(eq(s.actor.id, input.aangemaaktDoor))
          .limit(1),
        query
          .select({
            kerntaakId: s.pvbOnderdeel.kerntaakId,
            pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId,
            beoordelaarId: s.pvbOnderdeel.beoordelaarId,
          })
          .from(s.pvbOnderdeel)
          .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId))
          .limit(1),
      ]);

      const actor = singleRow(actorResults);
      const onderdeel = singleRow(onderdeelResults);

      // Check authorization
      if (!onderdeel.beoordelaarId) {
        throw new Error("Er is geen beoordelaar toegewezen aan dit onderdeel.");
      }

      if (actor.personId !== onderdeel.beoordelaarId) {
        throw new Error(
          "Alleen de toegewezen beoordelaar kan beoordelingscriteria wijzigen.",
        );
      }

      // Check current status of the aanvraag
      const currentStatusResults = await query
        .select({ status: s.pvbAanvraagStatus.status })
        .from(s.pvbAanvraagStatus)
        .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, onderdeel.pvbAanvraagId))
        .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
        .limit(1);

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "in_beoordeling") {
        throw new Error(
          `Beoordelingscriteria kunnen alleen worden gewijzigd als de aanvraag in beoordeling is. Huidige status: ${currentStatus.status}`,
        );
      }

      await query
        .insert(s.pvbOnderdeelBeoordelingsCriterium)
        .values({
          pvbOnderdeelId: input.pvbOnderdeelId,
          kerntaakId: onderdeel.kerntaakId,
          beoordelingscriteriumId: input.beoordelingscriteriumId,
          behaald: input.behaald,
          opmerkingen: input.opmerkingen,
        })
        .onConflictDoUpdate({
          target: [
            s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
            s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId,
          ],
          set: {
            behaald: input.behaald,
            opmerkingen: input.opmerkingen,
          },
        });

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
        }),
      ),
      aangemaaktDoor: z.string().uuid(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number(),
    }),
    async (input) => {
      const query = useQuery();

      if (input.updates.length === 0) {
        return { success: true, updatedCount: 0 };
      }

      // Get unique pvbOnderdeelIds and their details for validation
      const uniqueOnderdeelIds = [
        ...new Set(input.updates.map((u) => u.pvbOnderdeelId)),
      ];

      // Execute authorization, status, and onderdeel data fetching in parallel
      const [actorResults, onderdeelResults] = await Promise.all([
        query
          .select({ personId: s.actor.personId })
          .from(s.actor)
          .where(eq(s.actor.id, input.aangemaaktDoor))
          .limit(1),
        query
          .select({
            id: s.pvbOnderdeel.id,
            kerntaakId: s.pvbOnderdeel.kerntaakId,
            beoordelaarId: s.pvbOnderdeel.beoordelaarId,
            pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId,
          })
          .from(s.pvbOnderdeel)
          .where(inArray(s.pvbOnderdeel.id, uniqueOnderdeelIds)),
      ]);

      const actor = singleRow(actorResults);

      // Validate authorization for all onderdelen
      for (const onderdeel of onderdeelResults) {
        if (!onderdeel.beoordelaarId) {
          throw new Error(
            `Er is geen beoordelaar toegewezen aan onderdeel ${onderdeel.id}.`,
          );
        }

        if (actor.personId !== onderdeel.beoordelaarId) {
          throw new Error(
            "Alleen de toegewezen beoordelaar kan beoordelingscriteria wijzigen.",
          );
        }
      }

      // Check status for all unique aanvragen (there should typically be only one)
      const uniqueAanvraagIds = [
        ...new Set(onderdeelResults.map((o) => o.pvbAanvraagId)),
      ];
      const statusResults = await query
        .select({
          pvbAanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
          status: s.pvbAanvraagStatus.status,
        })
        .from(s.pvbAanvraagStatus)
        .where(inArray(s.pvbAanvraagStatus.pvbAanvraagId, uniqueAanvraagIds))
        .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp));

      // Group status by aanvraagId and get the latest status for each
      const statusMap = new Map<string, string>();
      for (const statusRecord of statusResults) {
        if (!statusMap.has(statusRecord.pvbAanvraagId)) {
          statusMap.set(statusRecord.pvbAanvraagId, statusRecord.status);
        }
      }

      // Validate all aanvragen are in beoordeling
      for (const aanvraagId of uniqueAanvraagIds) {
        const status = statusMap.get(aanvraagId);
        if (status !== "in_beoordeling") {
          throw new Error(
            `Beoordelingscriteria kunnen alleen worden gewijzigd als de aanvraag in beoordeling is. Huidige status: ${status}`,
          );
        }
      }

      const onderdeelMap = new Map(
        onderdeelResults.map((o) => [o.id, o.kerntaakId]),
      );

      // Prepare batch insert/update values
      const insertValues = input.updates.map((update) => {
        const kerntaakId = onderdeelMap.get(update.pvbOnderdeelId);
        if (!kerntaakId) {
          throw new Error(`PVB onderdeel ${update.pvbOnderdeelId} not found`);
        }

        return {
          pvbOnderdeelId: update.pvbOnderdeelId,
          kerntaakId,
          beoordelingscriteriumId: update.beoordelingscriteriumId,
          behaald: update.behaald,
          opmerkingen: update.opmerkingen,
        };
      });

      // Execute batch upsert
      await query
        .insert(s.pvbOnderdeelBeoordelingsCriterium)
        .values(insertValues)
        .onConflictDoUpdate({
          target: [
            s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
            s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId,
          ],
          set: {
            behaald: sql`excluded.behaald`,
            opmerkingen: sql`excluded.opmerkingen`,
          },
        });

      return {
        success: true,
        updatedCount: input.updates.length,
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
      uitslag: z.enum(["behaald", "niet_behaald"]),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      const onderdeelResults = await query
        .select({
          pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId,
          kerntaakId: s.pvbOnderdeel.kerntaakId,
          beoordelaarId: s.pvbOnderdeel.beoordelaarId,
        })
        .from(s.pvbOnderdeel)
        .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId))
        .limit(1);

      const onderdeel = singleRow(onderdeelResults);

      // Execute authorization check, status check and criteria validation in parallel for optimal performance
      const [actorResults, currentStatusResults, criteriaResults] =
        await Promise.all([
          query
            .select({ personId: s.actor.personId })
            .from(s.actor)
            .where(eq(s.actor.id, input.aangemaaktDoor))
            .limit(1),
          query
            .select({ status: s.pvbAanvraagStatus.status })
            .from(s.pvbAanvraagStatus)
            .where(
              eq(s.pvbAanvraagStatus.pvbAanvraagId, onderdeel.pvbAanvraagId),
            )
            .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
            .limit(1),
          query
            .select({
              beoordelingscriteriumId: s.beoordelingscriterium.id,
              behaald: s.pvbOnderdeelBeoordelingsCriterium.behaald,
            })
            .from(s.beoordelingscriterium)
            .leftJoin(
              s.pvbOnderdeelBeoordelingsCriterium,
              and(
                eq(
                  s.beoordelingscriterium.id,
                  s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId,
                ),
                eq(
                  s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
                  input.pvbOnderdeelId,
                ),
              ),
            )
            .where(
              eq(s.beoordelingscriterium.kerntaakId, onderdeel.kerntaakId),
            ),
        ]);

      // Check authorization first
      if (!onderdeel.beoordelaarId) {
        throw new Error("Er is geen beoordelaar toegewezen aan dit onderdeel.");
      }

      const actor = singleRow(actorResults);
      if (actor.personId !== onderdeel.beoordelaarId) {
        throw new Error(
          "Alleen de toegewezen beoordelaar kan de uitslag van dit onderdeel wijzigen.",
        );
      }

      const currentStatus = singleRow(currentStatusResults);

      if (currentStatus.status !== "in_beoordeling") {
        throw new Error(
          `Onderdeel uitslag kan alleen worden gewijzigd als de aanvraag in beoordeling is. Huidige status: ${currentStatus.status}`,
        );
      }

      // Process criteria results in a single pass for optimal performance
      let unassessedCount = 0;
      let behaaldeCount = 0;
      let nietBehaaldeCount = 0;

      for (const criterium of criteriaResults) {
        if (criterium.behaald === null) {
          unassessedCount++;
        } else if (criterium.behaald === true) {
          behaaldeCount++;
        } else {
          nietBehaaldeCount++;
        }
      }

      // Check if all criteria have been assessed
      if (unassessedCount > 0) {
        throw new Error(
          `Niet alle beoordelingscriteria zijn beoordeeld. ${unassessedCount} van de ${criteriaResults.length} criteria hebben nog geen beoordeling.`,
        );
      }

      if (input.uitslag === "behaald") {
        // All criteria must be behaald
        if (nietBehaaldeCount > 0) {
          throw new Error(
            `Onderdeel kan niet als 'behaald' worden gemarkeerd omdat ${nietBehaaldeCount} van de ${criteriaResults.length} beoordelingscriteria niet behaald zijn.`,
          );
        }
      } else if (input.uitslag === "niet_behaald") {
        // At least one criterium must be niet behaald
        if (nietBehaaldeCount === 0) {
          throw new Error(
            `Onderdeel kan niet als 'niet_behaald' worden gemarkeerd omdat alle ${criteriaResults.length} beoordelingscriteria behaald zijn.`,
          );
        }
      }

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
          behaaldeCount,
          nietBehaaldeCount,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
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
        .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
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
          vorigeStatus: currentStatus.status,
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
          beoordeeldeOnderdelen:
            sql<number>`count(*) filter (where ${s.pvbOnderdeel.uitslag} != 'nog_niet_bekend')`.as(
              "beoordeeld",
            ),
        })
        .from(s.pvbOnderdeel)
        .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId));

      const stats = singleRow(onderdelenResults);
      const alleOnderdelenBeoordeeld =
        stats.totalOnderdelen === stats.beoordeeldeOnderdelen;

      if (!alleOnderdelenBeoordeeld) {
        throw new Error("Niet alle onderdelen zijn beoordeeld");
      }

      // Complete the assessment
      await completeBeoordeling({
        pvbAanvraagId: input.pvbAanvraagId,
        aangemaaktDoor: input.aangemaaktDoor,
        reden:
          input.reden ?? "Alle onderdelen beoordeeld - beoordeling afgerond",
      });

      return {
        success: true,
        alleOnderdelenBeoordeeld,
      };
    },
  ),
);
