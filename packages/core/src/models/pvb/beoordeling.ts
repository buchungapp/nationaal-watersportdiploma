import { schema as s } from "@nawadi/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
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
      // This function is deprecated and can no longer be called independently
      // Use finalizeBeoordeling instead, which will automatically determine
      // the uitslag for all onderdelen based on their criteria
      throw new Error(
        "updateOnderdeelUitslag kan niet meer onafhankelijk worden aangeroepen. Gebruik finalizeBeoordeling om de beoordeling af te ronden.",
      );
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
      onderdeelUitslagen: z.array(
        z.object({
          pvbOnderdeelId: z.string().uuid(),
          uitslag: z.enum(["behaald", "niet_behaald"]),
          behaaldeCount: z.number(),
          nietBehaaldeCount: z.number(),
        }),
      ),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        // Get current status and check authorization
        const [currentStatusResults, actorResults] = await Promise.all([
          tx
            .select({ status: s.pvbAanvraagStatus.status })
            .from(s.pvbAanvraagStatus)
            .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
            .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
            .limit(1),
          tx
            .select({ personId: s.actor.personId })
            .from(s.actor)
            .where(eq(s.actor.id, input.aangemaaktDoor))
            .limit(1),
        ]);

        const currentStatus = singleRow(currentStatusResults);
        const actor = singleRow(actorResults);

        if (currentStatus.status !== "in_beoordeling") {
          throw new Error(
            `Beoordeling kan alleen worden afgerond als de aanvraag in beoordeling is. Huidige status: ${currentStatus.status}`,
          );
        }

        // Get all onderdelen for this aanvraag with their beoordelaar info
        const onderdelenResults = await tx
          .select({
            id: s.pvbOnderdeel.id,
            kerntaakId: s.pvbOnderdeel.kerntaakId,
            kerntaakOnderdeelId: s.pvbOnderdeel.kerntaakOnderdeelId,
            beoordelaarId: s.pvbOnderdeel.beoordelaarId,
            uitslag: s.pvbOnderdeel.uitslag,
          })
          .from(s.pvbOnderdeel)
          .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId));

        if (onderdelenResults.length === 0) {
          throw new Error("Geen onderdelen gevonden voor deze aanvraag");
        }

        // Check if the user is authorized to finalize (must be beoordelaar for all onderdelen)
        const unauthorizedOnderdelen = onderdelenResults.filter(
          (onderdeel) => onderdeel.beoordelaarId !== actor.personId,
        );

        if (unauthorizedOnderdelen.length > 0) {
          throw new Error(
            "Alleen de beoordelaar kan de beoordeling afronden. Je bent niet de beoordelaar voor alle onderdelen.",
          );
        }

        // Check if all criteria have been assessed for all onderdelen
        const criteriaResults = await tx
          .select({
            kerntaakId: s.beoordelingscriterium.kerntaakId,
            kerntaakOnderdeelId:
              s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
            beoordelingscriteriumId: s.beoordelingscriterium.id,
            pvbOnderdeelId: s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
            behaald: s.pvbOnderdeelBeoordelingsCriterium.behaald,
          })
          .from(s.beoordelingscriterium)
          .innerJoin(
            s.werkproces,
            eq(s.werkproces.id, s.beoordelingscriterium.werkprocesId),
          )
          .innerJoin(
            s.werkprocesKerntaakOnderdeel,
            and(
              eq(s.werkprocesKerntaakOnderdeel.werkprocesId, s.werkproces.id),
              eq(
                s.werkprocesKerntaakOnderdeel.kerntaakId,
                s.beoordelingscriterium.kerntaakId,
              ),
            ),
          )
          .leftJoin(
            s.pvbOnderdeelBeoordelingsCriterium,
            and(
              eq(
                s.beoordelingscriterium.id,
                s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId,
              ),
              inArray(
                s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
                onderdelenResults.map((o) => o.id),
              ),
            ),
          )
          .where(
            inArray(
              s.beoordelingscriterium.kerntaakId,
              onderdelenResults.map((o) => o.kerntaakId),
            ),
          );

        // Group criteria by onderdeel and validate completeness
        const criteriaByOnderdeel = new Map<
          string,
          Array<{ beoordelingscriteriumId: string; behaald: boolean | null }>
        >();

        // Initialize all onderdelen in the map
        for (const onderdeel of onderdelenResults) {
          criteriaByOnderdeel.set(onderdeel.id, []);
        }

        // Process criteria results and group by onderdeel
        for (const criterium of criteriaResults) {
          // Find the onderdeel that matches this criterium's kerntaakId
          const matchingOnderdeel = onderdelenResults.find(
            (o) => o.kerntaakOnderdeelId === criterium.kerntaakOnderdeelId,
          );

          if (matchingOnderdeel) {
            const onderdeelCriteria = criteriaByOnderdeel.get(
              matchingOnderdeel.id,
            );
            if (onderdeelCriteria) {
              onderdeelCriteria.push({
                beoordelingscriteriumId: criterium.beoordelingscriteriumId,
                behaald: criterium.behaald,
              });
            }
          }
        }

        const onderdeelUitslagen: Array<{
          pvbOnderdeelId: string;
          uitslag: "behaald" | "niet_behaald";
          behaaldeCount: number;
          nietBehaaldeCount: number;
        }> = [];

        // Process each onderdeel
        for (const onderdeel of onderdelenResults) {
          const criteria = criteriaByOnderdeel.get(onderdeel.id) || [];

          if (criteria.length === 0) {
            throw new Error(
              `Geen beoordelingscriteria gevonden voor onderdeel ${onderdeel.id}`,
            );
          }

          let unassessedCount = 0;
          let behaaldeCount = 0;
          let nietBehaaldeCount = 0;

          for (const criterium of criteria) {
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
              `Niet alle beoordelingscriteria zijn beoordeeld voor onderdeel ${onderdeel.id}. ${unassessedCount} van de ${criteria.length} criteria hebben nog geen beoordeling.`,
            );
          }

          // Determine uitslag based on criteria
          const uitslag: "behaald" | "niet_behaald" =
            nietBehaaldeCount === 0 ? "behaald" : "niet_behaald";

          onderdeelUitslagen.push({
            pvbOnderdeelId: onderdeel.id,
            uitslag,
            behaaldeCount,
            nietBehaaldeCount,
          });
        }

        // Update all onderdeel uitslagen
        for (const { pvbOnderdeelId, uitslag } of onderdeelUitslagen) {
          await tx
            .update(s.pvbOnderdeel)
            .set({ uitslag })
            .where(eq(s.pvbOnderdeel.id, pvbOnderdeelId));
        }

        // Create kwalificaties for behaalde onderdelen
        const behaaldeOnderdelen = onderdeelUitslagen.filter(
          (result) => result.uitslag === "behaald",
        );

        if (behaaldeOnderdelen.length > 0) {
          // Get aanvraag and course information needed for kwalificatie creation
          const [aanvraagResults, courseResults] = await Promise.all([
            tx
              .select({
                kandidaatId: s.pvbAanvraag.kandidaatId,
              })
              .from(s.pvbAanvraag)
              .where(eq(s.pvbAanvraag.id, input.pvbAanvraagId))
              .limit(1),
            tx
              .select({
                courseId: s.pvbAanvraagCourse.courseId,
                isMainCourse: s.pvbAanvraagCourse.isMainCourse,
              })
              .from(s.pvbAanvraagCourse)
              .where(
                eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              ),
          ]);

          const aanvraag = singleRow(aanvraagResults);

          if (courseResults.length === 0) {
            throw new Error("Geen cursussen gevonden voor deze PvB aanvraag");
          }

          // Create kwalificatie entries for each behaald onderdeel for ALL courses
          const kwalificatieValues = behaaldeOnderdelen.flatMap((result) => {
            const onderdeel = onderdelenResults.find(
              (o) => o.id === result.pvbOnderdeelId,
            );
            if (!onderdeel) {
              throw new Error(
                `Onderdeel ${result.pvbOnderdeelId} niet gevonden`,
              );
            }

            // Create kwalificatie for each course
            return courseResults.map((course) => ({
              directBehaaldePvbOnderdeelId: result.pvbOnderdeelId,
              kerntaakOnderdeelId: onderdeel.kerntaakOnderdeelId,
              courseId: course.courseId,
              personId: aanvraag.kandidaatId,
              verkregenReden: "pvb_behaald" as const,
              toegevoegdDoor: input.aangemaaktDoor,
              opmerkingen: null,
            }));
          });

          // Insert all kwalificaties in a single batch operation
          await tx.insert(s.persoonKwalificatie).values(kwalificatieValues);
        }

        // Log events for each onderdeel uitslag update
        for (const {
          pvbOnderdeelId,
          uitslag,
          behaaldeCount,
          nietBehaaldeCount,
        } of onderdeelUitslagen) {
          await logPvbEvent({
            pvbAanvraagId: input.pvbAanvraagId,
            pvbOnderdeelId,
            gebeurtenisType: "onderdeel_uitslag_gewijzigd",
            data: {
              nieuweUitslag: uitslag,
              behaaldeCount,
              nietBehaaldeCount,
            },
            aangemaaktDoor: input.aangemaaktDoor,
            reden: input.reden ?? "Beoordeling afgerond",
          });
        }

        // Update status to afgerond
        await tx.insert(s.pvbAanvraagStatus).values({
          pvbAanvraagId: input.pvbAanvraagId,
          status: "afgerond",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        });

        // Log the completion event
        await logPvbEvent({
          pvbAanvraagId: input.pvbAanvraagId,
          gebeurtenisType: "beoordeling_afgerond",
          data: {
            afgerondDoor: input.aangemaaktDoor,
          },
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        });

        return {
          success: true,
          alleOnderdelenBeoordeeld: true,
          onderdeelUitslagen,
        };
      });
    },
  ),
);
