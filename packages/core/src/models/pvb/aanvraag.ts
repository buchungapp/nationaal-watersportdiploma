import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, countDistinct, desc, eq, inArray, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import { possibleSingleRow, singleRow } from "../../utils/data-helpers.js";
import {
  generatePvbAanvraagID,
  jsonBuildObject,
  singleOrArray,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
} from "../../utils/index.js";
import { KSS } from "../index.js";
import {
  aanvraagSchema,
  addCourseOutputSchema,
  addCourseSchema,
  addOnderdeelOutputSchema,
  addOnderdeelSchema,
  createAanvraagOutputSchema,
  removeCourseOutputSchema,
  removeCourseSchema,
  setMainCourseOutputSchema,
  setMainCourseSchema,
  updateBeoordelaarOutputSchema,
  updateBeoordelaarSchema,
} from "./aanvraag.schema.js";
import { logPvbEvent } from "./index.js";

/**
 * Helper function to check parallel prerequisites and update status accordingly
 * This should be called after any event that might complete a prerequisite
 */
async function checkVoorwaardenAndUpdateStatus(
  pvbAanvraagId: string,
  aangemaaktDoor: string,
  reden?: string,
) {
  const query = useQuery();

  // Get current status
  const currentStatusResults = await query
    .select({ status: s.pvbAanvraagStatus.status })
    .from(s.pvbAanvraagStatus)
    .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, pvbAanvraagId))
    .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
    .limit(1);

  const currentStatus = singleRow(currentStatusResults);

  // Only check if we're waiting for prerequisites to be fulfilled
  if (currentStatus.status !== "wacht_op_voorwaarden") {
    return;
  }

  // Check all voorwaarden
  const voorwaarden = await checkAllVoorwaarden(pvbAanvraagId);

  if (voorwaarden.alleVoorwaardenVervuld) {
    // All prerequisites met - update to ready for assessment
    await query.insert(s.pvbAanvraagStatus).values({
      pvbAanvraagId,
      status: "gereed_voor_beoordeling",
      aangemaaktDoor,
      reden: reden ?? "Alle voorwaarden voor beoordeling zijn vervuld",
    });

    // Log the completion event using the new pvbGebeurtenis table
    await logPvbEvent({
      pvbAanvraagId,
      gebeurtenisType: "voorwaarden_voltooid",
      data: {
        ontbrekendeVoorwaarden: voorwaarden.ontbrekendeVoorwaarden,
        overgangsReden: "Automatische overgang - alle voorwaarden vervuld",
      },
      aangemaaktDoor,
      reden: reden ?? "Alle voorwaarden zijn vervuld",
    });
  }

  return voorwaarden;
}

/**
 * Check all prerequisites for a PvB aanvraag with a single optimized query
 */
async function checkAllVoorwaarden(pvbAanvraagId: string): Promise<{
  alleVoorwaardenVervuld: boolean;
  ontbrekendeVoorwaarden: string[];
}> {
  const query = useQuery();

  // Single query to check all prerequisites
  const [onderdelenStats, leercoachStatus] = await Promise.all([
    // Check onderdelen prerequisites
    query
      .select({
        totalOnderdelen: sql<number>`count(*)`.as("total_onderdelen"),
        onderdelenMetBeoordelaar:
          sql<number>`count(${s.pvbOnderdeel.beoordelaarId})`.as(
            "onderdelen_met_beoordelaar",
          ),
        onderdelenMetStartDatum:
          sql<number>`count(${s.pvbOnderdeel.startDatumTijd})`.as(
            "onderdelen_met_startdatum",
          ),
      })
      .from(s.pvbOnderdeel)
      .where(eq(s.pvbOnderdeel.pvbAanvraagId, pvbAanvraagId)),

    // Check latest leercoach permission
    query
      .select({ status: s.pvbLeercoachToestemming.status })
      .from(s.pvbLeercoachToestemming)
      .where(eq(s.pvbLeercoachToestemming.pvbAanvraagId, pvbAanvraagId))
      .orderBy(desc(s.pvbLeercoachToestemming.aangemaaktOp))
      .limit(1),
  ]);

  const stats = singleRow(onderdelenStats);
  const leercoach = possibleSingleRow(leercoachStatus);

  // Check prerequisites
  const beoordelaarVereist =
    stats.totalOnderdelen > 0 &&
    stats.onderdelenMetBeoordelaar === stats.totalOnderdelen;
  const leercoachAkkoord = leercoach?.status === "gegeven";
  const startdatumGepland =
    stats.totalOnderdelen > 0 &&
    stats.onderdelenMetStartDatum === stats.totalOnderdelen;

  const ontbrekendeVoorwaarden: string[] = [];
  if (!beoordelaarVereist)
    ontbrekendeVoorwaarden.push("beoordelaar_toegewezen");
  if (!leercoachAkkoord) ontbrekendeVoorwaarden.push("leercoach_akkoord");
  if (!startdatumGepland) ontbrekendeVoorwaarden.push("startdatum_gepland");

  return {
    alleVoorwaardenVervuld: ontbrekendeVoorwaarden.length === 0,
    ontbrekendeVoorwaarden,
  };
}

export const addOnderdeel = wrapCommand(
  "pvb.addOnderdeel",
  withZod(addOnderdeelSchema, addOnderdeelOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // Run independent validation queries in parallel
      const [
        currentStatusResults,
        kerntaakOnderdeelResults,
        existingOnderdelen,
        existingKwalificatie,
      ] = await Promise.all([
        // 1. Check current status - only allow adding onderdelen in concept or waiting states
        tx
          .select({
            status: s.pvbAanvraagStatus.status,
            aanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
            locatieId: s.pvbAanvraag.locatieId,
            kandidaatId: s.pvbAanvraag.kandidaatId,
          })
          .from(s.pvbAanvraagStatus)
          .innerJoin(
            s.pvbAanvraag,
            eq(s.pvbAanvraagStatus.pvbAanvraagId, s.pvbAanvraag.id),
          )
          .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
          .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
          .limit(1),

        // 2. Validate kerntaakOnderdeel exists and get its details
        tx
          .select({
            id: s.kerntaakOnderdeel.id,
            kerntaakId: s.kerntaakOnderdeel.kerntaakId,
            niveauId: s.kwalificatieprofiel.niveauId,
          })
          .from(s.kerntaakOnderdeel)
          .innerJoin(
            s.kerntaak,
            eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
          )
          .innerJoin(
            s.kwalificatieprofiel,
            eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
          )
          .where(eq(s.kerntaakOnderdeel.id, input.kerntaakOnderdeelId)),

        // 3. Check if this onderdeel already exists for this aanvraag
        tx
          .select({ id: s.pvbOnderdeel.id })
          .from(s.pvbOnderdeel)
          .where(
            and(
              eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbOnderdeel.kerntaakOnderdeelId, input.kerntaakOnderdeelId),
            ),
          ),

        // 4. Check if person already has this qualification for any course linked to this aanvraag
        tx
          .select({
            id: s.persoonKwalificatie.id,
            courseId: s.persoonKwalificatie.courseId,
          })
          .from(s.persoonKwalificatie)
          .innerJoin(
            s.pvbAanvraag,
            eq(s.persoonKwalificatie.personId, s.pvbAanvraag.kandidaatId),
          )
          .innerJoin(
            s.pvbAanvraagCourse,
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, s.pvbAanvraag.id),
              eq(s.pvbAanvraagCourse.courseId, s.persoonKwalificatie.courseId),
            ),
          )
          .where(
            and(
              eq(s.pvbAanvraag.id, input.pvbAanvraagId),
              eq(
                s.persoonKwalificatie.kerntaakOnderdeelId,
                input.kerntaakOnderdeelId,
              ),
            ),
          ),
      ]);

      // Process results from parallel queries
      const currentStatus = singleRow(currentStatusResults);
      const kerntaakOnderdeel = singleRow(kerntaakOnderdeelResults);

      // Validate status
      if (!["concept", "wacht_op_voorwaarden"].includes(currentStatus.status)) {
        throw new Error(
          "Onderdelen kunnen alleen toegevoegd worden in concept of wacht_op_voorwaarden status",
        );
      }

      // Validate uniqueness
      if (existingOnderdelen.length > 0) {
        throw new Error("Dit onderdeel bestaat al voor deze aanvraag");
      }

      // Check if person already has this qualification for any linked course
      if (existingKwalificatie.length > 0) {
        throw new Error(
          "Deze persoon heeft al een kwalificatie voor dit kerntaak onderdeel voor een van de gekoppelde cursussen",
        );
      }

      // Validate niveau consistency (depends on kerntaakOnderdeel result, so runs after parallel queries)
      const existingNiveauStats = await tx
        .select({
          distinctCount: countDistinct(s.kwalificatieprofiel.niveauId),
          matchingCount: sql<number>`count(*) filter (where ${s.kwalificatieprofiel.niveauId} = ${kerntaakOnderdeel.niveauId})`,
        })
        .from(s.pvbOnderdeel)
        .innerJoin(s.kerntaak, eq(s.pvbOnderdeel.kerntaakId, s.kerntaak.id))
        .innerJoin(
          s.kwalificatieprofiel,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId));

      const stats = singleRow(existingNiveauStats);

      // If there are multiple distinct niveaus already, that's a data integrity issue
      if (stats.distinctCount > 1) {
        throw new Error(
          "Data-integriteit probleem: er bestaan al onderdelen met verschillende kwalificatieniveaus",
        );
      }

      // If there's exactly 1 distinct niveau, but the new onderdeel doesn't match it
      if (stats.distinctCount === 1 && stats.matchingCount === 0) {
        throw new Error(
          "Alle onderdelen binnen een PvB aanvraag moeten tot hetzelfde kwalificatieniveau behoren",
        );
      }

      // If distinctCount === 0, this is the first onderdeel, so no validation needed

      // Create the pvbOnderdeel without beoordelaar (will be set via updateBeoordelaar)
      const createdOnderdelen = await tx
        .insert(s.pvbOnderdeel)
        .values({
          pvbAanvraagId: input.pvbAanvraagId,
          kerntaakOnderdeelId: input.kerntaakOnderdeelId,
          kerntaakId: kerntaakOnderdeel.kerntaakId,
          startDatumTijd: input.startDatumTijd,
          opmerkingen: input.opmerkingen,
        })
        .returning({ id: s.pvbOnderdeel.id });

      const pvbOnderdeel = singleRow(createdOnderdelen);

      // Create event log
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        pvbOnderdeelId: pvbOnderdeel.id,
        gebeurtenisType: "onderdeel_toegevoegd",
        data: {
          kerntaakOnderdeelId: input.kerntaakOnderdeelId,
          kerntaakId: kerntaakOnderdeel.kerntaakId,
          startDatumTijd: input.startDatumTijd,
          opmerkingen: input.opmerkingen,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      return {
        id: pvbOnderdeel.id,
      };
    }).then(async (result) => {
      // Assign beoordelaar if provided using the updateBeoordelaar handler (outside transaction)
      if (input.beoordelaarId) {
        await updateBeoordelaar({
          pvbOnderdeelId: result.id,
          beoordelaarId: input.beoordelaarId,
          aangemaaktDoor: input.aangemaaktDoor,
          reden: "",
        });
      }

      return result;
    });
  }),
);

export const updateBeoordelaar = wrapCommand(
  "pvb.updateBeoordelaar",
  withZod(
    updateBeoordelaarSchema,
    updateBeoordelaarOutputSchema,
    async (input) => {
      // Check if the beoordelaar is qualified (outside transaction)
      if (input.beoordelaarId) {
        const { isQualified } = await KSS.Kwalificaties.isQualifiedBeoordelaar({
          personId: input.beoordelaarId,
        });

        if (!isQualified) {
          throw new Error(
            "De geselecteerde persoon is geen gekwalificeerde PvB beoordelaar",
          );
        }
      }

      return withTransaction(async (tx) => {
        // Validate the pvbOnderdeel exists and get aanvraag location
        const onderdeelResults = await tx
          .select({
            id: s.pvbOnderdeel.id,
            currentBeoordelaarId: s.pvbOnderdeel.beoordelaarId,
            locatieId: s.pvbAanvraag.locatieId,
            pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId,
          })
          .from(s.pvbOnderdeel)
          .innerJoin(
            s.pvbAanvraag,
            eq(s.pvbOnderdeel.pvbAanvraagId, s.pvbAanvraag.id),
          )
          .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId));

        const onderdeel = singleRow(onderdeelResults);

        // Update the beoordelaar
        await tx
          .update(s.pvbOnderdeel)
          .set({ beoordelaarId: input.beoordelaarId })
          .where(eq(s.pvbOnderdeel.id, input.pvbOnderdeelId));

        // Create event log
        await logPvbEvent({
          pvbAanvraagId: onderdeel.pvbAanvraagId,
          pvbOnderdeelId: input.pvbOnderdeelId,
          gebeurtenisType: "onderdeel_beoordelaar_gewijzigd",
          data: {
            oudeBeoordelaarId: onderdeel.currentBeoordelaarId,
            nieuweBeoordelaarId: input.beoordelaarId,
          },
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        });

        return {
          success: true,
          pvbAanvraagId: onderdeel.pvbAanvraagId,
        };
      }).then(async (result) => {
        // Check if all prerequisites are now met and update status if needed (outside transaction)
        await checkVoorwaardenAndUpdateStatus(
          result.pvbAanvraagId,
          input.aangemaaktDoor,
          "Beoordelaar toegewezen - voorwaarden gecontroleerd",
        );

        return {
          success: result.success,
        };
      });
    },
  ),
);

export const addCourse = wrapCommand(
  "pvb.addCourse",
  withZod(addCourseSchema, addCourseOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // Run independent validation queries in parallel
      const [
        aanvragenResults,
        currentStatusResults,
        courseResults,
        existingCourses,
        existingKwalificaties,
      ] = await Promise.all([
        // 1. Validate the aanvraag exists
        tx
          .select({
            id: s.pvbAanvraag.id,
            kandidaatId: s.pvbAanvraag.kandidaatId,
          })
          .from(s.pvbAanvraag)
          .where(eq(s.pvbAanvraag.id, input.pvbAanvraagId)),

        // 2. Check current status - only allow adding courses in certain states
        tx
          .select({
            status: s.pvbAanvraagStatus.status,
          })
          .from(s.pvbAanvraagStatus)
          .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
          .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
          .limit(1),

        // 3. Validate course exists and get its instructieGroep
        tx
          .select({
            courseId: s.course.id,
            instructieGroepId: s.instructieGroepCursus.instructieGroepId,
            richting: s.instructieGroep.richting,
          })
          .from(s.course)
          .innerJoin(
            s.instructieGroepCursus,
            eq(s.course.id, s.instructieGroepCursus.courseId),
          )
          .innerJoin(
            s.instructieGroep,
            eq(s.instructieGroepCursus.instructieGroepId, s.instructieGroep.id),
          )
          .where(eq(s.course.id, input.courseId)),

        // 4. Check if course is already added to this aanvraag
        tx
          .select({ id: s.pvbAanvraagCourse.id })
          .from(s.pvbAanvraagCourse)
          .where(
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbAanvraagCourse.courseId, input.courseId),
              eq(
                s.pvbAanvraagCourse.instructieGroepId,
                input.instructieGroepId,
              ),
            ),
          ),

        // 5. Check if person already has qualifications for this course + any existing onderdelen
        tx
          .select({
            id: s.persoonKwalificatie.id,
            kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
          })
          .from(s.persoonKwalificatie)
          .innerJoin(
            s.pvbAanvraag,
            eq(s.persoonKwalificatie.personId, s.pvbAanvraag.kandidaatId),
          )
          .innerJoin(
            s.pvbOnderdeel,
            and(
              eq(s.pvbOnderdeel.pvbAanvraagId, s.pvbAanvraag.id),
              eq(
                s.pvbOnderdeel.kerntaakOnderdeelId,
                s.persoonKwalificatie.kerntaakOnderdeelId,
              ),
            ),
          )
          .where(
            and(
              eq(s.pvbAanvraag.id, input.pvbAanvraagId),
              eq(s.persoonKwalificatie.courseId, input.courseId),
            ),
          ),
      ]);

      const _aanvraag = singleRow(aanvragenResults);
      const currentStatus = singleRow(currentStatusResults);
      const _course = singleRow(courseResults);

      // Validate status - only allow adding courses in certain states
      if (
        ![
          "concept",
          "wacht_op_voorwaarden",
          "gereed_voor_beoordeling",
        ].includes(currentStatus.status)
      ) {
        throw new Error(
          "Cursussen kunnen alleen toegevoegd worden in concept, wacht_op_voorwaarden of gereed_voor_beoordeling status",
        );
      }

      // Validate course is not already added
      if (existingCourses.length > 0) {
        throw new Error("Deze cursus is al toegevoegd aan de aanvraag");
      }

      // Check if person already has qualifications that would conflict
      if (existingKwalificaties.length > 0) {
        throw new Error(
          "Deze persoon heeft al een kwalificatie voor deze cursus in combinatie met een van de onderdelen uit deze aanvraag",
        );
      }

      // Get current main course to validate instructieGroep consistency
      const mainCourses = await tx
        .select({
          courseId: s.pvbAanvraagCourse.courseId,
          instructieGroepId: s.instructieGroepCursus.instructieGroepId,
        })
        .from(s.pvbAanvraagCourse)
        .innerJoin(
          s.instructieGroepCursus,
          eq(s.pvbAanvraagCourse.courseId, s.instructieGroepCursus.courseId),
        )
        .where(
          and(
            eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
            eq(s.pvbAanvraagCourse.isMainCourse, true),
            eq(s.pvbAanvraagCourse.instructieGroepId, input.instructieGroepId),
          ),
        );

      const mainCourse = possibleSingleRow(mainCourses);

      // If setting as main course, unset current main course
      if (input.isMainCourse && mainCourse) {
        await tx
          .update(s.pvbAanvraagCourse)
          .set({ isMainCourse: false })
          .where(
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbAanvraagCourse.isMainCourse, true),
              eq(
                s.pvbAanvraagCourse.instructieGroepId,
                input.instructieGroepId,
              ),
            ),
          );
      }

      // Create the pvbAanvraagCourse
      const createdCourses = await tx
        .insert(s.pvbAanvraagCourse)
        .values({
          pvbAanvraagId: input.pvbAanvraagId,
          courseId: input.courseId,
          instructieGroepId: input.instructieGroepId,
          isMainCourse: input.isMainCourse,
          opmerkingen: input.opmerkingen,
        })
        .returning({ id: s.pvbAanvraagCourse.id });

      const pvbAanvraagCourse = singleRow(createdCourses);

      return {
        id: pvbAanvraagCourse.id,
      };
    });
  }),
);

export const removeCourse = wrapCommand(
  "pvb.removeCourse",
  withZod(removeCourseSchema, removeCourseOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      const [courseResults, currentStatusResults] = await Promise.all([
        tx
          .select({
            id: s.pvbAanvraagCourse.id,
            isMainCourse: s.pvbAanvraagCourse.isMainCourse,
          })
          .from(s.pvbAanvraagCourse)
          .where(
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbAanvraagCourse.courseId, input.courseId),
              eq(
                s.pvbAanvraagCourse.instructieGroepId,
                input.instructieGroepId,
              ),
            ),
          ),

        // Check current status - only allow removing courses in certain states
        tx
          .select({
            status: s.pvbAanvraagStatus.status,
          })
          .from(s.pvbAanvraagStatus)
          .where(eq(s.pvbAanvraagStatus.pvbAanvraagId, input.pvbAanvraagId))
          .orderBy(desc(s.pvbAanvraagStatus.aangemaaktOp))
          .limit(1),
      ]);

      const course = singleRow(courseResults);
      const currentStatus = singleRow(currentStatusResults);

      // Validate status - only allow removing courses in certain states
      if (
        ![
          "concept",
          "wacht_op_voorwaarden",
          "gereed_voor_beoordeling",
        ].includes(currentStatus.status)
      ) {
        throw new Error(
          "Cursussen kunnen alleen verwijderd worden in concept, wacht_op_voorwaarden of gereed_voor_beoordeling status",
        );
      }

      // Remove the course
      await tx
        .delete(s.pvbAanvraagCourse)
        .where(eq(s.pvbAanvraagCourse.id, course.id));

      return {
        success: true,
      };
    });
  }),
);

export const setMainCourse = wrapCommand(
  "pvb.setMainCourse",
  withZod(setMainCourseSchema, setMainCourseOutputSchema, async (input) => {
    const query = useQuery();

    // Validate the course exists in this aanvraag
    const courseResults = await query
      .select({
        id: s.pvbAanvraagCourse.id,
        isMainCourse: s.pvbAanvraagCourse.isMainCourse,
      })
      .from(s.pvbAanvraagCourse)
      .where(
        and(
          eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
          eq(s.pvbAanvraagCourse.courseId, input.courseId),
          eq(s.pvbAanvraagCourse.instructieGroepId, input.instructieGroepId),
        ),
      );

    const course = singleRow(courseResults);

    if (course.isMainCourse) {
      throw new Error("Deze cursus is al de hoofdcursus");
    }

    // Unset current main course
    await query
      .update(s.pvbAanvraagCourse)
      .set({ isMainCourse: false })
      .where(
        and(
          eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
          eq(s.pvbAanvraagCourse.isMainCourse, true),
          eq(s.pvbAanvraagCourse.instructieGroepId, input.instructieGroepId),
        ),
      );

    // Set new main course
    await query
      .update(s.pvbAanvraagCourse)
      .set({ isMainCourse: true })
      .where(eq(s.pvbAanvraagCourse.id, course.id));

    return {
      success: true,
    };
  }),
);

// Request leercoach permission for parallel processing
export const requestLeercoachPermission = wrapCommand(
  "pvb.requestLeercoachPermission",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      leercoachId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      id: z.string().uuid(),
    }),
    async (input) => {
      const query = useQuery();

      // Validate the aanvraag exists and get its location
      const aanvragen = await query
        .select({
          id: s.pvbAanvraag.id,
          locatieId: s.pvbAanvraag.locatieId,
        })
        .from(s.pvbAanvraag)
        .where(eq(s.pvbAanvraag.id, input.pvbAanvraagId));

      const aanvraag = singleRow(aanvragen);

      // Validate leercoach exists at location
      const leercoachActors = await query
        .select({ id: s.actor.id })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.personId, input.leercoachId),
            eq(s.actor.locationId, aanvraag.locatieId),
            eq(s.actor.type, "instructor"),
          ),
        );

      if (leercoachActors.length === 0) {
        throw new Error("Opgegeven leercoach bestaat niet op deze locatie");
      }

      // Create permission request
      const createdToestemming = await query
        .insert(s.pvbLeercoachToestemming)
        .values({
          pvbAanvraagId: input.pvbAanvraagId,
          leercoachId: input.leercoachId,
          status: "gevraagd",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        })
        .returning({ id: s.pvbLeercoachToestemming.id });

      const toestemming = singleRow(createdToestemming);

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "leercoach_toestemming_gevraagd",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      return {
        id: toestemming.id,
      };
    },
  ),
);

// Give or deny leercoach permission
export const setLeercoachPermission = wrapCommand(
  "pvb.setLeercoachPermission",
  withZod(
    z.object({
      toestemmingId: z.string().uuid(),
      status: z.enum(["gegeven", "geweigerd"]),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const query = useQuery();

      // Get current permission record
      const toestemmingResults = await query
        .select({
          id: s.pvbLeercoachToestemming.id,
          pvbAanvraagId: s.pvbLeercoachToestemming.pvbAanvraagId,
          leercoachId: s.pvbLeercoachToestemming.leercoachId,
          status: s.pvbLeercoachToestemming.status,
        })
        .from(s.pvbLeercoachToestemming)
        .where(eq(s.pvbLeercoachToestemming.id, input.toestemmingId));

      const toestemming = singleRow(toestemmingResults);

      if (toestemming.status !== "gevraagd") {
        throw new Error(
          "Toestemming kan alleen gewijzigd worden als deze nog in behandeling is",
        );
      }

      // Update permission status by creating a new record (event sourcing)
      await query.insert(s.pvbLeercoachToestemming).values({
        pvbAanvraagId: toestemming.pvbAanvraagId,
        leercoachId: toestemming.leercoachId,
        status: input.status,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      // Log the event
      const gebeurtenisType =
        input.status === "gegeven"
          ? "leercoach_toestemming_gegeven"
          : "leercoach_toestemming_geweigerd";

      await logPvbEvent({
        pvbAanvraagId: toestemming.pvbAanvraagId,
        gebeurtenisType,
        data: {
          leercoachId: toestemming.leercoachId,
          toestemmingId: toestemming.id,
          beslissing: input.status,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      // Update aanvraag status based on permission decision
      if (input.status === "gegeven") {
        await logPvbEvent({
          pvbAanvraagId: toestemming.pvbAanvraagId,
          gebeurtenisType: "leercoach_toestemming_gegeven",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        });

        // Check if all prerequisites are now met (assessors might already be assigned)
        await checkVoorwaardenAndUpdateStatus(
          toestemming.pvbAanvraagId,
          input.aangemaaktDoor,
          "Leercoach toestemming gegeven - voorwaarden gecontroleerd",
        );
      } else {
        await logPvbEvent({
          pvbAanvraagId: toestemming.pvbAanvraagId,
          gebeurtenisType: "leercoach_toestemming_geweigerd",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "",
        });
      }

      return {
        success: true,
      };
    },
  ),
);

// Submit a PvB application (transition from concept to active status)
export const submitAanvraag = wrapCommand(
  "pvb.submitAanvraag",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      newStatus: z.enum(["wacht_op_voorwaarden", "gereed_voor_beoordeling"]),
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

      if (currentStatus.status !== "concept") {
        throw new Error("Alleen concept aanvragen kunnen worden ingediend");
      }

      // Get aanvraag details
      const aanvraagDetails = await query
        .select({
          id: s.pvbAanvraag.id,
        })
        .from(s.pvbAanvraag)
        .where(eq(s.pvbAanvraag.id, input.pvbAanvraagId));

      const aanvraag = singleRow(aanvraagDetails);

      // Check if there's a leercoach via the event sourcing table
      const latestLeercoachToestemming = await query
        .select({
          leercoachId: s.pvbLeercoachToestemming.leercoachId,
        })
        .from(s.pvbLeercoachToestemming)
        .where(eq(s.pvbLeercoachToestemming.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(desc(s.pvbLeercoachToestemming.aangemaaktOp))
        .limit(1);

      const activeLeercoach = possibleSingleRow(latestLeercoachToestemming);

      // Always transition to waiting for prerequisites first
      let newStatus: "wacht_op_voorwaarden" | "gereed_voor_beoordeling" =
        "wacht_op_voorwaarden";

      // Update status
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: newStatus,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      // If leercoach is assigned, automatically request permission
      if (activeLeercoach) {
        await requestLeercoachPermission({
          pvbAanvraagId: input.pvbAanvraagId,
          leercoachId: activeLeercoach.leercoachId,
          aangemaaktDoor: input.aangemaaktDoor,
          reden: "",
        });
      }

      // Check if all prerequisites are already met (might immediately transition to ready)
      const voorwaarden = await checkAllVoorwaarden(input.pvbAanvraagId);
      if (voorwaarden.alleVoorwaardenVervuld) {
        newStatus = "gereed_voor_beoordeling";
        await query.insert(s.pvbAanvraagStatus).values({
          pvbAanvraagId: input.pvbAanvraagId,
          status: "gereed_voor_beoordeling",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: "",
        });
      }

      // Log the submission event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "aanvraag_ingediend",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      return {
        success: true,
        newStatus,
      };
    },
  ),
);

// Withdraw an application
export const withdrawAanvraag = wrapCommand(
  "pvb.withdrawAanvraag",
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

      // Can't withdraw if already completed or withdrawn
      if (
        ![
          "concept",
          "wacht_op_voorwaarden",
          "gereed_voor_beoordeling",
        ].includes(currentStatus.status)
      ) {
        throw new Error(
          `Can't withdraw aanvraag in status ${currentStatus.status}`,
        );
      }

      // Update status to ingetrokken
      await query.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: input.pvbAanvraagId,
        status: "ingetrokken",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "",
      });

      // Log the withdrawal event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "aanvraag_ingetrokken",
        data: {
          ingetrokkenDoor: input.aangemaaktDoor,
          vorigeStatus: currentStatus.status,
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

export const createAanvraag = wrapCommand(
  "pvb.createAanvraag",
  withZod(aanvraagSchema, createAanvraagOutputSchema, async (input) => {
    return withTransaction(async (tx) => {
      // CHECK: if type is 'extern' throw error cause we don't support it in this version
      if (input.type === "extern") {
        throw new Error(
          "Externe PvB aanvragen worden nog niet ondersteund in deze versie",
        );
      }

      // CHECK: Is kandidaat an 'instructor' actor in the location
      const instructorActors = await tx
        .select({ id: s.actor.id })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.personId, input.kandidaatId),
            eq(s.actor.locationId, input.locatieId),
            eq(s.actor.type, "instructor"),
          ),
        );

      if (instructorActors.length === 0) {
        throw new Error(
          "Kandidaat moet een instructeur zijn op de opgegeven locatie",
        );
      }

      // Create the basic PvB aanvraag (leercoach now tracked via events only)
      const pvbAanvraag = await tx
        .insert(s.pvbAanvraag)
        .values({
          handle: generatePvbAanvraagID(),
          kandidaatId: input.kandidaatId,
          locatieId: input.locatieId,
          type: input.type,
          opmerkingen: input.opmerkingen,
        })
        .returning({
          id: s.pvbAanvraag.id,
        })
        .then(singleRow);

      // Always start with "concept" status - applications must be explicitly submitted
      await tx.insert(s.pvbAanvraagStatus).values({
        pvbAanvraagId: pvbAanvraag.id,
        status: "concept",
        aangemaaktDoor: input.aangevraagdDoor,
        reden: "",
      });

      for (const course of input.courses) {
        await addCourse({
          pvbAanvraagId: pvbAanvraag.id,
          courseId: course.courseId,
          instructieGroepId: course.instructieGroepId,
          isMainCourse: course.isMainCourse,
          opmerkingen: course.opmerkingen,
          aangemaaktDoor: input.aangevraagdDoor,
          reden: "",
        });
      }

      for (const onderdeel of input.onderdelen) {
        await addOnderdeel({
          pvbAanvraagId: pvbAanvraag.id,
          kerntaakOnderdeelId: onderdeel.kerntaakOnderdeelId,
          beoordelaarId:
            "beoordelaarId" in onderdeel ? onderdeel.beoordelaarId : null,
          startDatumTijd: input.startDatumTijd,
          opmerkingen: onderdeel.opmerkingen,
          aangemaaktDoor: input.aangevraagdDoor,
          reden: "",
        });
      }

      if (input.leercoachId) {
        await requestLeercoachPermission({
          pvbAanvraagId: pvbAanvraag.id,
          leercoachId: input.leercoachId,
          aangemaaktDoor: input.aangevraagdDoor,
          reden: "",
        });
      }

      return {
        id: pvbAanvraag.id,
      };
    });
  }),
);

// List PvB aanvragen for a location with pagination
export const list = wrapCommand(
  "pvb.listAanvragen",
  withZod(
    z.object({
      filter: z
        .object({
          id: singleOrArray(uuidSchema).optional(),
          locationId: singleOrArray(uuidSchema).optional(),
          kandidaatId: singleOrArray(uuidSchema).optional(),
          leercoachId: singleOrArray(uuidSchema).optional(),
          beoordelaarId: singleOrArray(uuidSchema).optional(),
          q: z.string().optional(),
        })
        .default({}),
      limit: z.number().int().positive().optional(),
      offset: z.number().int().nonnegative().default(0),
    }),
    z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          handle: z.string(),
          kandidaat: z.object({
            id: z.string().uuid(),
            firstName: z.string(),
            lastNamePrefix: z.string().nullable(),
            lastName: z.string().nullable(),
          }),
          locatie: z
            .object({
              id: z.string().uuid(),
              name: z.string().nullable(),
            })
            .optional(),
          type: z.enum(["intern", "extern"]),
          status: z.enum([
            "concept",
            "wacht_op_voorwaarden",
            "gereed_voor_beoordeling",
            "in_beoordeling",
            "afgerond",
            "ingetrokken",
            "afgebroken",
          ]),
          lastStatusChange: z.string().datetime(),
          opmerkingen: z.string().nullable(),
          leercoach: z
            .object({
              id: z.string().uuid(),
              firstName: z.string().nullable(),
              lastNamePrefix: z.string().nullable(),
              lastName: z.string().nullable(),
              status: z
                .enum(["gevraagd", "gegeven", "geweigerd", "herroepen"])
                .nullable(),
            })
            .nullable(),
          hoofdcursus: z
            .object({
              id: z.string().uuid(),
              title: z.string().nullable(),
              code: z.string().nullable(),
            })
            .nullable(),
          kwalificatieprofielen: z.array(
            z.object({
              id: z.string().uuid(),
              titel: z.string(),
              richting: z.string(),
            }),
          ),
          kerntaakOnderdelen: z.array(
            z.object({
              id: z.string().uuid(),
              titel: z.string(),
              type: z.enum(["portfolio", "praktijk"]),
              rang: z.number().int().nonnegative(),
              behaaldStatus: z.enum([
                "behaald",
                "niet_behaald",
                "nog_niet_bekend",
              ]),
              beoordelaar: z
                .object({
                  id: z.string().uuid(),
                  firstName: z.string().nullable(),
                  lastNamePrefix: z.string().nullable(),
                  lastName: z.string().nullable(),
                })
                .nullable(),
            }),
          ),
        }),
      ),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive().nullable(),
      offset: z.number().int().nonnegative(),
    }),
    async (input) => {
      const query = useQuery();

      // Aliases for joined tables
      const leercoachPerson = alias(s.person, "leercoachPerson");
      const hoofdCursus = alias(s.pvbAanvraagCourse, "hoofdCursus");
      const hoofdCourse = alias(s.course, "hoofdCourse");
      const beoordelaarPerson = alias(s.person, "beoordelaarPerson");

      // CTE for latest status per aanvraag using selectDistinctOn
      const latestStatusCTE = query.$with("latest_status").as(
        query
          .selectDistinctOn([s.pvbAanvraagStatus.pvbAanvraagId], {
            pvbAanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
            status: s.pvbAanvraagStatus.status,
            aangemaaktOp: s.pvbAanvraagStatus.aangemaaktOp,
          })
          .from(s.pvbAanvraagStatus)
          .orderBy(
            s.pvbAanvraagStatus.pvbAanvraagId,
            desc(s.pvbAanvraagStatus.aangemaaktOp),
          ),
      );

      // CTE for latest leercoach per aanvraag with status using selectDistinctOn
      const latestLeercoachCTE = query.$with("latest_leercoach").as(
        query
          .selectDistinctOn([s.pvbLeercoachToestemming.pvbAanvraagId], {
            pvbAanvraagId: s.pvbLeercoachToestemming.pvbAanvraagId,
            leercoachId: s.pvbLeercoachToestemming.leercoachId,
            status: s.pvbLeercoachToestemming.status,
          })
          .from(s.pvbLeercoachToestemming)
          .orderBy(
            s.pvbLeercoachToestemming.pvbAanvraagId,
            desc(s.pvbLeercoachToestemming.aangemaaktOp),
          ),
      );

      // Build WHERE conditions dynamically
      const whereConditions = [];

      // Id filter
      if (input.filter.id) {
        whereConditions.push(
          Array.isArray(input.filter.id)
            ? inArray(s.pvbAanvraag.id, input.filter.id)
            : eq(s.pvbAanvraag.id, input.filter.id),
        );
      }

      // Location filter
      if (input.filter.locationId) {
        whereConditions.push(
          Array.isArray(input.filter.locationId)
            ? inArray(s.pvbAanvraag.locatieId, input.filter.locationId)
            : eq(s.pvbAanvraag.locatieId, input.filter.locationId),
        );
      }

      // Kandidaat filter
      if (input.filter.kandidaatId) {
        whereConditions.push(
          Array.isArray(input.filter.kandidaatId)
            ? inArray(s.pvbAanvraag.kandidaatId, input.filter.kandidaatId)
            : eq(s.pvbAanvraag.kandidaatId, input.filter.kandidaatId),
        );
      }

      // Leercoach filter (needs to be applied after join)
      const leercoachFilter = input.filter.leercoachId
        ? Array.isArray(input.filter.leercoachId)
          ? inArray(latestLeercoachCTE.leercoachId, input.filter.leercoachId)
          : eq(latestLeercoachCTE.leercoachId, input.filter.leercoachId)
        : undefined;

      // Beoordelaar filter (needs subquery to find PvB aanvragen with this beoordelaar)
      if (input.filter.beoordelaarId) {
        const beoordelaarIds = Array.isArray(input.filter.beoordelaarId)
          ? input.filter.beoordelaarId
          : [input.filter.beoordelaarId];

        const aanvraagIdsWithBeoordelaar = query
          .selectDistinct({ pvbAanvraagId: s.pvbOnderdeel.pvbAanvraagId })
          .from(s.pvbOnderdeel)
          .where(inArray(s.pvbOnderdeel.beoordelaarId, beoordelaarIds));

        whereConditions.push(
          inArray(s.pvbAanvraag.id, aanvraagIdsWithBeoordelaar),
        );
      }

      // Query to get basic aanvraag info with current status and aggregated onderdelen
      const aanvragenQuery = query
        .with(latestStatusCTE, latestLeercoachCTE)
        .select({
          id: s.pvbAanvraag.id,
          handle: s.pvbAanvraag.handle,
          kandidaatId: s.pvbAanvraag.kandidaatId,
          locatieId: s.pvbAanvraag.locatieId,
          locatieName: s.location.name,
          type: s.pvbAanvraag.type,
          opmerkingen: s.pvbAanvraag.opmerkingen,
          kandidaatFirstName: s.person.firstName,
          kandidaatLastNamePrefix: s.person.lastNamePrefix,
          kandidaatLastName: s.person.lastName,
          status: latestStatusCTE.status,
          lastStatusChange: latestStatusCTE.aangemaaktOp,
          // Leercoach info
          leercoachId: latestLeercoachCTE.leercoachId,
          leercoachStatus: latestLeercoachCTE.status,
          leercoachFirstName: leercoachPerson.firstName,
          leercoachLastNamePrefix: leercoachPerson.lastNamePrefix,
          leercoachLastName: leercoachPerson.lastName,
          // Hoofdcursus info
          hoofdcursusId: hoofdCursus.courseId,
          hoofdcursusTitle: hoofdCourse.title,
          hoofdcursusCode: hoofdCourse.abbreviation,
          // Array aggregation for kwalificatieprofielen
          kwalificatieprofielen: sql<
            Array<{
              id: string;
              titel: string;
              richting: string;
            }>
          >`
            COALESCE(
              json_agg(DISTINCT
                jsonb_build_object(
                  'id', ${s.kwalificatieprofiel.id},
                  'titel', ${s.kwalificatieprofiel.titel},
                  'richting', ${s.kwalificatieprofiel.richting}
                )
              ) FILTER (WHERE ${s.kwalificatieprofiel.id} IS NOT NULL),
              '[]'::json
            )
          `,
          // Array aggregation for onderdelen with beoordelaar
          kerntaakOnderdelen: sql<
            Array<{
              id: string;
              titel: string;
              type: "portfolio" | "praktijk";
              rang: number;
              behaaldStatus: "behaald" | "niet_behaald" | "nog_niet_bekend";
              beoordelaarId: string | null;
              beoordelaarFirstName: string | null;
              beoordelaarLastNamePrefix: string | null;
              beoordelaarLastName: string | null;
            }>
          >`
            COALESCE(
              json_agg(
                ${jsonBuildObject({
                  id: s.kerntaakOnderdeel.id,
                  titel: s.kerntaak.titel,
                  type: s.kerntaakOnderdeel.type,
                  rang: s.kerntaak.rang,
                  behaaldStatus: sql`COALESCE(${s.pvbOnderdeel.uitslag}, 'nog_niet_bekend')`,
                  beoordelaarId: s.pvbOnderdeel.beoordelaarId,
                  beoordelaarFirstName: beoordelaarPerson.firstName,
                  beoordelaarLastNamePrefix: beoordelaarPerson.lastNamePrefix,
                  beoordelaarLastName: beoordelaarPerson.lastName,
                })} ORDER BY ${s.kerntaak.rang}, ${s.kerntaak.titel}
              ) FILTER (WHERE ${s.kerntaakOnderdeel.id} IS NOT NULL),
              '[]'::json
            )
          `,
        })
        .from(s.pvbAanvraag)
        .innerJoin(s.person, eq(s.pvbAanvraag.kandidaatId, s.person.id))
        .innerJoin(s.location, eq(s.pvbAanvraag.locatieId, s.location.id))
        .innerJoin(
          latestStatusCTE,
          eq(latestStatusCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          latestLeercoachCTE,
          eq(latestLeercoachCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          leercoachPerson,
          eq(leercoachPerson.id, latestLeercoachCTE.leercoachId),
        )
        .leftJoin(
          hoofdCursus,
          and(
            eq(hoofdCursus.pvbAanvraagId, s.pvbAanvraag.id),
            eq(hoofdCursus.isMainCourse, true),
          ),
        )
        .leftJoin(hoofdCourse, eq(hoofdCourse.id, hoofdCursus.courseId))
        .leftJoin(
          s.pvbAanvraagCourse,
          eq(s.pvbAanvraagCourse.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          s.instructieGroep,
          eq(s.instructieGroep.id, s.pvbAanvraagCourse.instructieGroepId),
        )
        .leftJoin(
          s.pvbOnderdeel,
          eq(s.pvbOnderdeel.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          s.kerntaakOnderdeel,
          eq(s.kerntaakOnderdeel.id, s.pvbOnderdeel.kerntaakOnderdeelId),
        )
        .leftJoin(s.kerntaak, eq(s.kerntaak.id, s.kerntaakOnderdeel.kerntaakId))
        .leftJoin(
          s.kwalificatieprofiel,
          eq(s.kwalificatieprofiel.id, s.kerntaak.kwalificatieprofielId),
        )
        .leftJoin(
          beoordelaarPerson,
          eq(beoordelaarPerson.id, s.pvbOnderdeel.beoordelaarId),
        )
        .where(
          and(
            whereConditions.length > 0 ? and(...whereConditions) : undefined,
            leercoachFilter,
          ),
        )
        .groupBy(
          s.pvbAanvraag.id,
          s.location.id,
          s.person.id,
          latestStatusCTE.status,
          latestStatusCTE.aangemaaktOp,
          latestLeercoachCTE.leercoachId,
          latestLeercoachCTE.status,
          leercoachPerson.id,
          hoofdCursus.courseId,
          hoofdCourse.id,
        )
        .orderBy(desc(latestStatusCTE.aangemaaktOp))
        .$dynamic();

      // Optimized count query - only include necessary joins based on filters
      const needsLeercoachJoin = !!input.filter.leercoachId;

      const countQuery = needsLeercoachJoin
        ? query
            .with(latestStatusCTE, latestLeercoachCTE)
            .select({ count: countDistinct(s.pvbAanvraag.id) })
            .from(s.pvbAanvraag)
            .innerJoin(
              latestStatusCTE,
              eq(latestStatusCTE.pvbAanvraagId, s.pvbAanvraag.id),
            )
            .leftJoin(
              latestLeercoachCTE,
              eq(latestLeercoachCTE.pvbAanvraagId, s.pvbAanvraag.id),
            )
            .where(
              and(
                whereConditions.length > 0
                  ? and(...whereConditions)
                  : undefined,
                leercoachFilter,
              ),
            )
        : query
            .with(latestStatusCTE)
            .select({ count: countDistinct(s.pvbAanvraag.id) })
            .from(s.pvbAanvraag)
            .innerJoin(
              latestStatusCTE,
              eq(latestStatusCTE.pvbAanvraagId, s.pvbAanvraag.id),
            )
            .where(
              whereConditions.length > 0 ? and(...whereConditions) : undefined,
            );

      const [aanvragen, { count }] = await Promise.all([
        withLimitOffset(aanvragenQuery, input.limit, input.offset),
        countQuery.then(singleRow),
      ]);

      if (aanvragen.length === 0) {
        return {
          items: [],
          count,
          limit: input.limit ?? null,
          offset: input.offset,
        };
      }

      const items = aanvragen.map((row) => ({
        id: row.id,
        handle: row.handle,
        kandidaat: {
          id: row.kandidaatId,
          firstName: row.kandidaatFirstName,
          lastNamePrefix: row.kandidaatLastNamePrefix,
          lastName: row.kandidaatLastName,
        },
        locatie: {
          id: row.locatieId,
          name: row.locatieName,
        },
        type: row.type,
        status: row.status,
        lastStatusChange: dayjs(row.lastStatusChange).toISOString(),
        opmerkingen: row.opmerkingen,
        leercoach: row.leercoachId
          ? {
              id: row.leercoachId,
              firstName: row.leercoachFirstName,
              lastNamePrefix: row.leercoachLastNamePrefix,
              lastName: row.leercoachLastName,
              status: row.leercoachStatus,
            }
          : null,
        hoofdcursus: row.hoofdcursusId
          ? {
              id: row.hoofdcursusId,
              title: row.hoofdcursusTitle,
              code: row.hoofdcursusCode,
            }
          : null,
        kwalificatieprofielen: row.kwalificatieprofielen || [],
        kerntaakOnderdelen: (row.kerntaakOnderdelen || []).map((onderdeel) => ({
          id: onderdeel.id,
          titel: onderdeel.titel,
          type: onderdeel.type,
          rang: onderdeel.rang,
          behaaldStatus: onderdeel.behaaldStatus,
          beoordelaar: onderdeel.beoordelaarId
            ? {
                id: onderdeel.beoordelaarId,
                firstName: onderdeel.beoordelaarFirstName,
                lastNamePrefix: onderdeel.beoordelaarLastNamePrefix,
                lastName: onderdeel.beoordelaarLastName,
              }
            : null,
        })),
      }));

      return {
        items,
        count,
        limit: input.limit ?? null,
        offset: input.offset,
      };
    },
  ),
);

// Update start time for multiple PvB onderdelen
export const updateStartTimeForMultiple = wrapCommand(
  "pvb.updateStartTimeForMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      startDatumTijd: z.string().datetime(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number().int().nonnegative(),
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        let updatedCount = 0;

        for (const aanvraagId of input.pvbAanvraagIds) {
          // Update all onderdelen for this aanvraag
          const updatedOnderdelen = await tx
            .update(s.pvbOnderdeel)
            .set({ startDatumTijd: input.startDatumTijd })
            .where(eq(s.pvbOnderdeel.pvbAanvraagId, aanvraagId))
            .returning({ id: s.pvbOnderdeel.id });

          if (updatedOnderdelen.length > 0) {
            updatedCount++;

            // Log event for this aanvraag
            for (const onderdeel of updatedOnderdelen) {
              await logPvbEvent({
                pvbAanvraagId: aanvraagId,
                gebeurtenisType: "onderdeel_startdatum_gewijzigd",
                data: {
                  startDatumTijd: input.startDatumTijd,
                },
                pvbOnderdeelId: onderdeel.id,
                aangemaaktDoor: input.aangemaaktDoor,
                reden: input.reden ?? "",
              });
            }

            // Update status to ready for assessment
            await checkVoorwaardenAndUpdateStatus(
              aanvraagId,
              input.aangemaaktDoor,
            );
          }
        }

        return {
          success: true,
          updatedCount,
        };
      });
    },
  ),
);

// Update leercoach for multiple PvB aanvragen
export const updateLeercoachForMultiple = wrapCommand(
  "pvb.updateLeercoachForMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      leercoachId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number().int().nonnegative(),
    }),
    async (input) => {
      const query = useQuery();

      // Validate leercoach is an instructor
      const leercoachActors = await query
        .select({ locationId: s.actor.locationId })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.personId, input.leercoachId),
            eq(s.actor.type, "instructor"),
          ),
        );

      if (leercoachActors.length === 0) {
        throw new Error("De geselecteerde leercoach is geen instructeur");
      }

      let updatedCount = 0;

      for (const aanvraagId of input.pvbAanvraagIds) {
        try {
          await requestLeercoachPermission({
            pvbAanvraagId: aanvraagId,
            leercoachId: input.leercoachId,
            aangemaaktDoor: input.aangemaaktDoor,
            reden: input.reden ?? "",
          });
          updatedCount++;
        } catch (error) {
          // Continue with other aanvragen if one fails
          console.error(
            `Failed to update leercoach for aanvraag ${aanvraagId}:`,
            error,
          );
        }
      }

      return {
        success: true,
        updatedCount,
      };
    },
  ),
);

// Cancel multiple PvB aanvragen
export const cancelMultiple = wrapCommand(
  "pvb.cancelMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      cancelledCount: z.number().int().nonnegative(),
    }),
    async (input) => {
      let cancelledCount = 0;

      for (const aanvraagId of input.pvbAanvraagIds) {
        try {
          await withdrawAanvraag({
            pvbAanvraagId: aanvraagId,
            aangemaaktDoor: input.aangemaaktDoor,
            reden: input.reden ?? "",
          });
          cancelledCount++;
        } catch (error) {
          // Continue with other aanvragen if one fails
          console.error(`Failed to cancel aanvraag ${aanvraagId}:`, error);
        }
      }

      return {
        success: true,
        cancelledCount,
      };
    },
  ),
);

// Submit multiple PvB aanvragen
export const submitMultiple = wrapCommand(
  "pvb.submitMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      submittedCount: z.number().int().nonnegative(),
      results: z.array(
        z.object({
          aanvraagId: z.string().uuid(),
          success: z.boolean(),
          newStatus: z
            .enum(["wacht_op_voorwaarden", "gereed_voor_beoordeling"])
            .optional(),
          error: z.string().optional(),
        }),
      ),
    }),
    async (input) => {
      const results = [];
      let submittedCount = 0;

      for (const aanvraagId of input.pvbAanvraagIds) {
        try {
          const result = await submitAanvraag({
            pvbAanvraagId: aanvraagId,
            aangemaaktDoor: input.aangemaaktDoor,
            reden: input.reden ?? "",
          });

          results.push({
            aanvraagId,
            success: true,
            newStatus: result.newStatus,
          });
          submittedCount++;
        } catch (error) {
          results.push({
            aanvraagId,
            success: false,
            error: error instanceof Error ? error.message : "Onbekende fout",
          });
        }
      }

      return {
        success: true,
        submittedCount,
        results,
      };
    },
  ),
);

// Update beoordelaar for multiple PvB aanvragen
export const updateBeoordelaarForMultiple = wrapCommand(
  "pvb.updateBeoordelaarForMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z.array(z.string().uuid()).nonempty(),
      beoordelaarId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number().int().nonnegative(),
    }),
    async (input) => {
      const query = useQuery();

      let updatedCount = 0;

      for (const aanvraagId of input.pvbAanvraagIds) {
        try {
          // Get all onderdelen for this aanvraag
          const onderdelen = await query
            .select({ id: s.pvbOnderdeel.id })
            .from(s.pvbOnderdeel)
            .where(eq(s.pvbOnderdeel.pvbAanvraagId, aanvraagId));

          // Update beoordelaar for each onderdeel
          for (const onderdeel of onderdelen) {
            await updateBeoordelaar({
              pvbOnderdeelId: onderdeel.id,
              beoordelaarId: input.beoordelaarId,
              aangemaaktDoor: input.aangemaaktDoor,
              reden: input.reden ?? "",
            });
          }

          if (onderdelen.length > 0) {
            updatedCount++;
          }
        } catch (error) {
          // Continue with other aanvragen if one fails
          console.error(
            `Failed to update beoordelaar for aanvraag ${aanvraagId}:`,
            error,
          );
        }
      }

      return {
        success: true,
        updatedCount,
      };
    },
  ),
);

// Grant leercoach permission for multiple PvB aanvragen (on behalf of leercoach)
export const grantLeercoachPermissionForMultiple = wrapCommand(
  "pvb.grantLeercoachPermissionForMultiple",
  withZod(
    z.object({
      pvbAanvraagIds: z
        .array(
          z.object({
            id: z.string().uuid(),
            aangemaaktDoor: z.string().uuid(),
          }),
        )
        .nonempty(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
      updatedCount: z.number().int().nonnegative(),
      results: z.array(
        z.object({
          aanvraagId: z.string().uuid(),
          success: z.boolean(),
          error: z.string().optional(),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();
      const results = [];
      let updatedCount = 0;

      for (const aanvraag of input.pvbAanvraagIds) {
        try {
          // Get the latest leercoach permission record for this aanvraag
          const latestPermissionResults = await query
            .select({
              id: s.pvbLeercoachToestemming.id,
              leercoachId: s.pvbLeercoachToestemming.leercoachId,
              status: s.pvbLeercoachToestemming.status,
            })
            .from(s.pvbLeercoachToestemming)
            .where(eq(s.pvbLeercoachToestemming.pvbAanvraagId, aanvraag.id))
            .orderBy(desc(s.pvbLeercoachToestemming.aangemaaktOp))
            .limit(1);

          const latestPermission = possibleSingleRow(latestPermissionResults);

          if (!latestPermission) {
            results.push({
              aanvraagId: aanvraag.id,
              success: false,
              error: "Geen leercoach toegewezen aan deze aanvraag",
            });
            continue;
          }

          if (latestPermission.status === "gegeven") {
            results.push({
              aanvraagId: aanvraag.id,
              success: false,
              error: "Leercoach heeft al toestemming gegeven",
            });
            continue;
          }

          if (latestPermission.status === "geweigerd") {
            results.push({
              aanvraagId: aanvraag.id,
              success: false,
              error:
                "Leercoach heeft toestemming geweigerd, kan niet overschreven worden",
            });
            continue;
          }

          // Grant permission on behalf of leercoach (status: gevraagd -> gegeven)
          await query.insert(s.pvbLeercoachToestemming).values({
            pvbAanvraagId: aanvraag.id,
            leercoachId: latestPermission.leercoachId,
            status: "gegeven",
            aangemaaktDoor: aanvraag.aangemaaktDoor,
            reden: input.reden ?? "",
          });

          // Log the event
          await logPvbEvent({
            pvbAanvraagId: aanvraag.id,
            gebeurtenisType: "leercoach_toestemming_gegeven",
            data: {
              leercoachId: latestPermission.leercoachId,
              toestemmingId: latestPermission.id,
              beslissing: "gegeven",
              namensLeercoach: true,
            },
            aangemaaktDoor: aanvraag.aangemaaktDoor,
            reden: input.reden ?? "",
          });

          // Check if all prerequisites are now met
          await checkVoorwaardenAndUpdateStatus(
            aanvraag.id,
            aanvraag.aangemaaktDoor,
            "Leercoach toestemming gegeven namens leercoach - voorwaarden gecontroleerd",
          );

          results.push({
            aanvraagId: aanvraag.id,
            success: true,
          });
          updatedCount++;
        } catch (error) {
          results.push({
            aanvraagId: aanvraag.id,
            success: false,
            error: error instanceof Error ? error.message : "Onbekende fout",
          });
        }
      }

      return {
        success: true,
        updatedCount,
        results,
      };
    },
  ),
);

// Retrieve a single PvB aanvraag by handle
export const retrieveByHandle = wrapCommand(
  "pvb.retrieveByHandle",
  withZod(
    z.object({
      handle: z.string(),
    }),
    z.object({
      id: z.string().uuid(),
      handle: z.string(),
      kandidaat: z.object({
        id: z.string().uuid(),
        firstName: z.string(),
        lastNamePrefix: z.string().nullable(),
        lastName: z.string().nullable(),
      }),
      locatie: z.object({
        id: z.string().uuid(),
        name: z.string().nullable(),
      }),
      type: z.enum(["intern", "extern"]),
      status: z.enum([
        "concept",
        "wacht_op_voorwaarden",
        "gereed_voor_beoordeling",
        "in_beoordeling",
        "afgerond",
        "ingetrokken",
        "afgebroken",
      ]),
      lastStatusChange: z.string().datetime(),
      opmerkingen: z.string().nullable(),
      leercoach: z
        .object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          lastName: z.string().nullable(),
          status: z
            .enum(["gevraagd", "gegeven", "geweigerd", "herroepen"])
            .nullable(),
        })
        .nullable(),
      courses: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string().nullable(),
          code: z.string().nullable(),
          isMainCourse: z.boolean(),
        }),
      ),
      onderdelen: z.array(
        z.object({
          id: z.string().uuid(),
          kerntaakOnderdeelId: z.string().uuid(),
          startDatumTijd: z.string().datetime().nullable(),
          uitslag: z.enum(["behaald", "niet_behaald", "nog_niet_bekend"]),
          opmerkingen: z.string().nullable(),
          beoordelaar: z
            .object({
              id: z.string().uuid(),
              firstName: z.string().nullable(),
              lastNamePrefix: z.string().nullable(),
              lastName: z.string().nullable(),
            })
            .nullable(),
        }),
      ),
      voorwaardenStatus: z.object({
        alleVoorwaardenVervuld: z.boolean(),
        ontbrekendeVoorwaarden: z.array(z.string()),
      }),
    }),
    async (input) => {
      const query = useQuery();

      // Aliases for joined tables
      const leercoachPerson = alias(s.person, "leercoachPerson");
      const beoordelaarPerson = alias(s.person, "beoordelaarPerson");

      // CTE for latest status
      const latestStatusCTE = query.$with("latest_status").as(
        query
          .selectDistinctOn([s.pvbAanvraagStatus.pvbAanvraagId], {
            pvbAanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
            status: s.pvbAanvraagStatus.status,
            aangemaaktOp: s.pvbAanvraagStatus.aangemaaktOp,
          })
          .from(s.pvbAanvraagStatus)
          .orderBy(
            s.pvbAanvraagStatus.pvbAanvraagId,
            desc(s.pvbAanvraagStatus.aangemaaktOp),
          ),
      );

      // CTE for latest leercoach with status
      const latestLeercoachCTE = query.$with("latest_leercoach").as(
        query
          .selectDistinctOn([s.pvbLeercoachToestemming.pvbAanvraagId], {
            pvbAanvraagId: s.pvbLeercoachToestemming.pvbAanvraagId,
            leercoachId: s.pvbLeercoachToestemming.leercoachId,
            status: s.pvbLeercoachToestemming.status,
          })
          .from(s.pvbLeercoachToestemming)
          .orderBy(
            s.pvbLeercoachToestemming.pvbAanvraagId,
            desc(s.pvbLeercoachToestemming.aangemaaktOp),
          ),
      );

      // Get aanvraag details
      const aanvraagResults = await query
        .with(latestStatusCTE, latestLeercoachCTE)
        .select({
          id: s.pvbAanvraag.id,
          handle: s.pvbAanvraag.handle,
          kandidaatId: s.pvbAanvraag.kandidaatId,
          kandidaatFirstName: s.person.firstName,
          kandidaatLastNamePrefix: s.person.lastNamePrefix,
          kandidaatLastName: s.person.lastName,
          locatieId: s.pvbAanvraag.locatieId,
          locatieName: s.location.name,
          type: s.pvbAanvraag.type,
          opmerkingen: s.pvbAanvraag.opmerkingen,
          status: latestStatusCTE.status,
          lastStatusChange: latestStatusCTE.aangemaaktOp,
          leercoachId: latestLeercoachCTE.leercoachId,
          leercoachStatus: latestLeercoachCTE.status,
          leercoachFirstName: leercoachPerson.firstName,
          leercoachLastNamePrefix: leercoachPerson.lastNamePrefix,
          leercoachLastName: leercoachPerson.lastName,
        })
        .from(s.pvbAanvraag)
        .innerJoin(s.person, eq(s.pvbAanvraag.kandidaatId, s.person.id))
        .innerJoin(s.location, eq(s.pvbAanvraag.locatieId, s.location.id))
        .innerJoin(
          latestStatusCTE,
          eq(latestStatusCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          latestLeercoachCTE,
          eq(latestLeercoachCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          leercoachPerson,
          eq(leercoachPerson.id, latestLeercoachCTE.leercoachId),
        )
        .where(eq(s.pvbAanvraag.handle, input.handle));

      const aanvraag = singleRow(aanvraagResults);

      // Run all independent queries in parallel
      const [courses, onderdelen, voorwaardenStatus] = await Promise.all([
        // Get courses
        query
          .select({
            id: s.course.id,
            title: s.course.title,
            code: s.course.abbreviation,
            isMainCourse: s.pvbAanvraagCourse.isMainCourse,
          })
          .from(s.pvbAanvraagCourse)
          .innerJoin(s.course, eq(s.pvbAanvraagCourse.courseId, s.course.id))
          .where(eq(s.pvbAanvraagCourse.pvbAanvraagId, aanvraag.id))
          .orderBy(desc(s.pvbAanvraagCourse.isMainCourse), s.course.title),

        // Get onderdelen
        query
          .select({
            id: s.pvbOnderdeel.id,
            kerntaakOnderdeelId: s.pvbOnderdeel.kerntaakOnderdeelId,
            startDatumTijd: s.pvbOnderdeel.startDatumTijd,
            uitslag: s.pvbOnderdeel.uitslag,
            opmerkingen: s.pvbOnderdeel.opmerkingen,
            beoordelaarId: s.pvbOnderdeel.beoordelaarId,
            beoordelaarFirstName: beoordelaarPerson.firstName,
            beoordelaarLastNamePrefix: beoordelaarPerson.lastNamePrefix,
            beoordelaarLastName: beoordelaarPerson.lastName,
          })
          .from(s.pvbOnderdeel)
          .leftJoin(
            beoordelaarPerson,
            eq(beoordelaarPerson.id, s.pvbOnderdeel.beoordelaarId),
          )
          .where(eq(s.pvbOnderdeel.pvbAanvraagId, aanvraag.id)),

        // Check voorwaarden status
        checkAllVoorwaarden(aanvraag.id),
      ]);

      return {
        id: aanvraag.id,
        handle: aanvraag.handle,
        kandidaat: {
          id: aanvraag.kandidaatId,
          firstName: aanvraag.kandidaatFirstName,
          lastNamePrefix: aanvraag.kandidaatLastNamePrefix,
          lastName: aanvraag.kandidaatLastName,
        },
        locatie: {
          id: aanvraag.locatieId,
          name: aanvraag.locatieName,
        },
        type: aanvraag.type,
        status: aanvraag.status,
        lastStatusChange: dayjs(aanvraag.lastStatusChange).toISOString(),
        opmerkingen: aanvraag.opmerkingen,
        leercoach: aanvraag.leercoachId
          ? {
              id: aanvraag.leercoachId,
              firstName: aanvraag.leercoachFirstName,
              lastNamePrefix: aanvraag.leercoachLastNamePrefix,
              lastName: aanvraag.leercoachLastName,
              status: aanvraag.leercoachStatus,
            }
          : null,
        courses: courses.map((course) => ({
          id: course.id,
          title: course.title,
          code: course.code,
          isMainCourse: course.isMainCourse,
        })),
        onderdelen: onderdelen.map((onderdeel) => ({
          id: onderdeel.id,
          kerntaakOnderdeelId: onderdeel.kerntaakOnderdeelId,
          startDatumTijd: onderdeel.startDatumTijd
            ? dayjs(onderdeel.startDatumTijd).toISOString()
            : null,
          uitslag: onderdeel.uitslag || null,
          opmerkingen: onderdeel.opmerkingen,
          beoordelaar: onderdeel.beoordelaarId
            ? {
                id: onderdeel.beoordelaarId,
                firstName: onderdeel.beoordelaarFirstName,
                lastNamePrefix: onderdeel.beoordelaarLastNamePrefix,
                lastName: onderdeel.beoordelaarLastName,
              }
            : null,
        })),
        voorwaardenStatus,
      };
    },
  ),
);

// Retrieve a single PvB aanvraag by ID
export const retrieveById = wrapCommand(
  "pvb.retrieveById",
  withZod(
    z.object({
      id: z.string().uuid(),
    }),
    z.object({
      id: z.string().uuid(),
      handle: z.string(),
      kandidaat: z.object({
        id: z.string().uuid(),
        firstName: z.string(),
        lastNamePrefix: z.string().nullable(),
        lastName: z.string().nullable(),
      }),
      locatie: z.object({
        id: z.string().uuid(),
        name: z.string().nullable(),
      }),
      type: z.enum(["intern", "extern"]),
      status: z.enum([
        "concept",
        "wacht_op_voorwaarden",
        "gereed_voor_beoordeling",
        "in_beoordeling",
        "afgerond",
        "ingetrokken",
        "afgebroken",
      ]),
      lastStatusChange: z.string().datetime(),
      opmerkingen: z.string().nullable(),
      leercoach: z
        .object({
          id: z.string().uuid(),
          firstName: z.string().nullable(),
          lastNamePrefix: z.string().nullable(),
          lastName: z.string().nullable(),
          status: z
            .enum(["gevraagd", "gegeven", "geweigerd", "herroepen"])
            .nullable(),
        })
        .nullable(),
      courses: z.array(
        z.object({
          id: z.string().uuid(),
          title: z.string().nullable(),
          code: z.string().nullable(),
          isMainCourse: z.boolean(),
        }),
      ),
      onderdelen: z.array(
        z.object({
          id: z.string().uuid(),
          kerntaakOnderdeelId: z.string().uuid(),
          startDatumTijd: z.string().datetime().nullable(),
          uitslag: z.enum(["behaald", "niet_behaald", "nog_niet_bekend"]),
          opmerkingen: z.string().nullable(),
          beoordelaar: z
            .object({
              id: z.string().uuid(),
              firstName: z.string().nullable(),
              lastNamePrefix: z.string().nullable(),
              lastName: z.string().nullable(),
            })
            .nullable(),
        }),
      ),
      voorwaardenStatus: z.object({
        alleVoorwaardenVervuld: z.boolean(),
        ontbrekendeVoorwaarden: z.array(z.string()),
      }),
    }),
    async (input) => {
      const query = useQuery();

      // Aliases for joined tables
      const leercoachPerson = alias(s.person, "leercoachPerson");
      const beoordelaarPerson = alias(s.person, "beoordelaarPerson");

      // CTE for latest status
      const latestStatusCTE = query.$with("latest_status").as(
        query
          .selectDistinctOn([s.pvbAanvraagStatus.pvbAanvraagId], {
            pvbAanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
            status: s.pvbAanvraagStatus.status,
            aangemaaktOp: s.pvbAanvraagStatus.aangemaaktOp,
          })
          .from(s.pvbAanvraagStatus)
          .orderBy(
            s.pvbAanvraagStatus.pvbAanvraagId,
            desc(s.pvbAanvraagStatus.aangemaaktOp),
          ),
      );

      // CTE for latest leercoach with status
      const latestLeercoachCTE = query.$with("latest_leercoach").as(
        query
          .selectDistinctOn([s.pvbLeercoachToestemming.pvbAanvraagId], {
            pvbAanvraagId: s.pvbLeercoachToestemming.pvbAanvraagId,
            leercoachId: s.pvbLeercoachToestemming.leercoachId,
            status: s.pvbLeercoachToestemming.status,
          })
          .from(s.pvbLeercoachToestemming)
          .orderBy(
            s.pvbLeercoachToestemming.pvbAanvraagId,
            desc(s.pvbLeercoachToestemming.aangemaaktOp),
          ),
      );

      // Get aanvraag details
      const aanvraagResults = await query
        .with(latestStatusCTE, latestLeercoachCTE)
        .select({
          id: s.pvbAanvraag.id,
          handle: s.pvbAanvraag.handle,
          kandidaatId: s.pvbAanvraag.kandidaatId,
          kandidaatFirstName: s.person.firstName,
          kandidaatLastNamePrefix: s.person.lastNamePrefix,
          kandidaatLastName: s.person.lastName,
          locatieId: s.pvbAanvraag.locatieId,
          locatieName: s.location.name,
          type: s.pvbAanvraag.type,
          opmerkingen: s.pvbAanvraag.opmerkingen,
          status: latestStatusCTE.status,
          lastStatusChange: latestStatusCTE.aangemaaktOp,
          leercoachId: latestLeercoachCTE.leercoachId,
          leercoachStatus: latestLeercoachCTE.status,
          leercoachFirstName: leercoachPerson.firstName,
          leercoachLastNamePrefix: leercoachPerson.lastNamePrefix,
          leercoachLastName: leercoachPerson.lastName,
        })
        .from(s.pvbAanvraag)
        .innerJoin(s.person, eq(s.pvbAanvraag.kandidaatId, s.person.id))
        .innerJoin(s.location, eq(s.pvbAanvraag.locatieId, s.location.id))
        .innerJoin(
          latestStatusCTE,
          eq(latestStatusCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          latestLeercoachCTE,
          eq(latestLeercoachCTE.pvbAanvraagId, s.pvbAanvraag.id),
        )
        .leftJoin(
          leercoachPerson,
          eq(leercoachPerson.id, latestLeercoachCTE.leercoachId),
        )
        .where(eq(s.pvbAanvraag.id, input.id));

      const aanvraag = singleRow(aanvraagResults);

      // Run all independent queries in parallel
      const [courses, onderdelen, voorwaardenStatus] = await Promise.all([
        // Get courses
        query
          .select({
            id: s.course.id,
            title: s.course.title,
            code: s.course.abbreviation,
            isMainCourse: s.pvbAanvraagCourse.isMainCourse,
          })
          .from(s.pvbAanvraagCourse)
          .innerJoin(s.course, eq(s.pvbAanvraagCourse.courseId, s.course.id))
          .where(eq(s.pvbAanvraagCourse.pvbAanvraagId, aanvraag.id))
          .orderBy(desc(s.pvbAanvraagCourse.isMainCourse), s.course.title),

        // Get onderdelen
        query
          .select({
            id: s.pvbOnderdeel.id,
            kerntaakOnderdeelId: s.pvbOnderdeel.kerntaakOnderdeelId,
            startDatumTijd: s.pvbOnderdeel.startDatumTijd,
            uitslag: s.pvbOnderdeel.uitslag,
            opmerkingen: s.pvbOnderdeel.opmerkingen,
            beoordelaarId: s.pvbOnderdeel.beoordelaarId,
            beoordelaarFirstName: beoordelaarPerson.firstName,
            beoordelaarLastNamePrefix: beoordelaarPerson.lastNamePrefix,
            beoordelaarLastName: beoordelaarPerson.lastName,
          })
          .from(s.pvbOnderdeel)
          .leftJoin(
            beoordelaarPerson,
            eq(beoordelaarPerson.id, s.pvbOnderdeel.beoordelaarId),
          )
          .where(eq(s.pvbOnderdeel.pvbAanvraagId, aanvraag.id)),

        // Check voorwaarden status
        checkAllVoorwaarden(aanvraag.id),
      ]);

      return {
        id: aanvraag.id,
        handle: aanvraag.handle,
        kandidaat: {
          id: aanvraag.kandidaatId,
          firstName: aanvraag.kandidaatFirstName,
          lastNamePrefix: aanvraag.kandidaatLastNamePrefix,
          lastName: aanvraag.kandidaatLastName,
        },
        locatie: {
          id: aanvraag.locatieId,
          name: aanvraag.locatieName,
        },
        type: aanvraag.type,
        status: aanvraag.status,
        lastStatusChange: dayjs(aanvraag.lastStatusChange).toISOString(),
        opmerkingen: aanvraag.opmerkingen,
        leercoach: aanvraag.leercoachId
          ? {
              id: aanvraag.leercoachId,
              firstName: aanvraag.leercoachFirstName,
              lastNamePrefix: aanvraag.leercoachLastNamePrefix,
              lastName: aanvraag.leercoachLastName,
              status: aanvraag.leercoachStatus,
            }
          : null,
        courses: courses.map((course) => ({
          id: course.id,
          title: course.title,
          code: course.code,
          isMainCourse: course.isMainCourse,
        })),
        onderdelen: onderdelen.map((onderdeel) => ({
          id: onderdeel.id,
          kerntaakOnderdeelId: onderdeel.kerntaakOnderdeelId,
          startDatumTijd: onderdeel.startDatumTijd
            ? dayjs(onderdeel.startDatumTijd).toISOString()
            : null,
          uitslag: onderdeel.uitslag || null,
          opmerkingen: onderdeel.opmerkingen,
          beoordelaar: onderdeel.beoordelaarId
            ? {
                id: onderdeel.beoordelaarId,
                firstName: onderdeel.beoordelaarFirstName,
                lastNamePrefix: onderdeel.beoordelaarLastNamePrefix,
                lastName: onderdeel.beoordelaarLastName,
              }
            : null,
        })),
        voorwaardenStatus,
      };
    },
  ),
);

// Update start time for a single PvB aanvraag
export const updateStartTime = wrapCommand(
  "pvb.updateStartTime",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      startDatumTijd: z.string().datetime(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const result = await updateStartTimeForMultiple({
        pvbAanvraagIds: [input.pvbAanvraagId],
        startDatumTijd: input.startDatumTijd,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      return {
        success: result.success && result.updatedCount > 0,
      };
    },
  ),
);

// Grant leercoach permission for a single PvB aanvraag (on behalf of leercoach)
export const grantLeercoachPermission = wrapCommand(
  "pvb.grantLeercoachPermission",
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
      const result = await grantLeercoachPermissionForMultiple({
        pvbAanvraagIds: [
          {
            id: input.pvbAanvraagId,
            aangemaaktDoor: input.aangemaaktDoor,
          },
        ],
        reden: input.reden,
      });

      const aanvraagResult = result.results.find(
        (r) => r.aanvraagId === input.pvbAanvraagId,
      );

      if (!aanvraagResult?.success) {
        throw new Error(aanvraagResult?.error || "Onbekende fout");
      }

      return {
        success: true,
      };
    },
  ),
);

// Deny leercoach permission for a single PvB aanvraag
export const denyLeercoachPermission = wrapCommand(
  "pvb.denyLeercoachPermission",
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

      // Get the latest leercoach permission request
      const latestPermissionResults = await query
        .select({
          id: s.pvbLeercoachToestemming.id,
          leercoachId: s.pvbLeercoachToestemming.leercoachId,
          status: s.pvbLeercoachToestemming.status,
        })
        .from(s.pvbLeercoachToestemming)
        .where(eq(s.pvbLeercoachToestemming.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(desc(s.pvbLeercoachToestemming.aangemaaktOp))
        .limit(1);

      const latestPermission = possibleSingleRow(latestPermissionResults);

      if (!latestPermission) {
        throw new Error(
          "Geen leercoach toestemming gevonden voor deze aanvraag",
        );
      }

      if (latestPermission.status !== "gevraagd") {
        throw new Error(
          "Toestemming kan alleen worden geweigerd als deze is gevraagd",
        );
      }

      // Create a new permission entry with 'geweigerd' status
      await query.insert(s.pvbLeercoachToestemming).values({
        pvbAanvraagId: input.pvbAanvraagId,
        leercoachId: latestPermission.leercoachId,
        status: "geweigerd",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "leercoach_toestemming_geweigerd",
        data: {
          leercoachId: latestPermission.leercoachId,
          weigeringsReden: input.reden,
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

// Get PvB gebeurtenissen (events) for timeline
export const listGebeurtenissen = wrapCommand(
  "pvb.listGebeurtenissen",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
    }),
    z.object({
      items: z.array(
        z.object({
          id: z.string().uuid(),
          gebeurtenisType: z.string(),
          data: z.record(z.any()).nullable(),
          aangemaaktDoor: z.string().uuid(),
          aangemaaktOp: z.string().datetime(),
          reden: z.string().nullable(),
          persoon: z.object({
            id: z.string().uuid(),
            firstName: z.string(),
            lastNamePrefix: z.string().nullable(),
            lastName: z.string().nullable(),
          }),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();

      const gebeurtenissen = await query
        .select({
          id: s.pvbGebeurtenis.id,
          gebeurtenisType: s.pvbGebeurtenis.gebeurtenisType,
          data: s.pvbGebeurtenis.data,
          aangemaaktDoor: s.pvbGebeurtenis.aangemaaktDoor,
          aangemaaktOp: s.pvbGebeurtenis.aangemaaktOp,
          reden: s.pvbGebeurtenis.reden,
          persoonId: s.person.id,
          persoonFirstName: s.person.firstName,
          persoonLastNamePrefix: s.person.lastNamePrefix,
          persoonLastName: s.person.lastName,
        })
        .from(s.pvbGebeurtenis)
        .innerJoin(s.actor, eq(s.pvbGebeurtenis.aangemaaktDoor, s.actor.id))
        .innerJoin(s.person, eq(s.actor.personId, s.person.id))
        .where(eq(s.pvbGebeurtenis.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(desc(s.pvbGebeurtenis.aangemaaktOp));

      return {
        items: gebeurtenissen.map((g) => ({
          id: g.id,
          gebeurtenisType: g.gebeurtenisType,
          // biome-ignore lint/suspicious/noExplicitAny: Will be caught by zod
          data: g.data as Record<string, any> | null,
          aangemaaktDoor: g.aangemaaktDoor,
          aangemaaktOp: dayjs(g.aangemaaktOp).toISOString(),
          reden: g.reden,
          persoon: {
            id: g.persoonId,
            firstName: g.persoonFirstName,
            lastNamePrefix: g.persoonLastNamePrefix,
            lastName: g.persoonLastName,
          },
        })),
      };
    },
  ),
);

// Get toetsdocumenten structure for an aanvraag
export const getToetsdocumenten = wrapCommand(
  "pvb.getToetsdocumenten",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
    }),
    z
      .object({
        kerntaken: z.array(
          z.object({
            id: z.string().uuid(),
            titel: z.string(),
            type: z.enum(["verplicht", "facultatief"]),
            rang: z.number().int().nullable(),
            onderdelen: z.array(
              z.object({
                id: z.string().uuid(),
                type: z.enum(["portfolio", "praktijk"]),
                pvbOnderdeelId: z.string().uuid().nullable(),
                behaaldStatus: z.enum([
                  "behaald",
                  "niet_behaald",
                  "nog_niet_bekend",
                ]),
                werkprocessen: z.array(
                  z.object({
                    id: z.string().uuid(),
                    titel: z.string(),
                    resultaat: z.string(),
                    rang: z.number(),
                    beoordelingscriteria: z.array(
                      z.object({
                        id: z.string().uuid(),
                        title: z.string(),
                        omschrijving: z.string().nullable(),
                        rang: z.number().nullable(),
                      }),
                    ),
                  }),
                ),
              }),
            ),
          }),
        ),
        kwalificatieprofiel: z.object({
          id: z.string().uuid(),
          titel: z.string(),
          richting: z.enum(["instructeur", "leercoach", "pvb_beoordelaar"]),
          niveau: z.object({
            id: z.string().uuid(),
            rang: z.number(),
          }),
        }),
      })
      .array()
      .nonempty(),
    async (input) => {
      const query = useQuery();

      // Single optimized query to get all data at once
      const toetsdocumentData = await query
        .select({
          // Kwalificatieprofiel info
          kwalificatieprofielId: s.kwalificatieprofiel.id,
          kwalificatieprofielTitel: s.kwalificatieprofiel.titel,
          kwalificatieprofielRichting: s.kwalificatieprofiel.richting,
          niveauId: s.niveau.id,
          niveauRang: s.niveau.rang,

          // Kerntaak info
          kerntaakId: s.kerntaak.id,
          kerntaakTitel: s.kerntaak.titel,
          kerntaakType: s.kerntaak.type,
          kerntaakRang: s.kerntaak.rang,

          // Onderdeel info (from two sources)
          onderdeelId: s.kerntaakOnderdeel.id,
          onderdeelType: s.kerntaakOnderdeel.type,
          pvbOnderdeelId: s.pvbOnderdeel.id,
          pvbOnderdeelUitslag: s.pvbOnderdeel.uitslag,

          // Werkproces info
          werkprocesId: s.werkproces.id,
          werkprocesTitel: s.werkproces.titel,
          werkprocesResultaat: s.werkproces.resultaat,
          werkprocesRang: s.werkproces.rang,

          // Beoordelingscriterium info
          criteriumId: s.beoordelingscriterium.id,
          criteriumTitle: s.beoordelingscriterium.title,
          criteriumOmschrijving: s.beoordelingscriterium.omschrijving,
          criteriumRang: s.beoordelingscriterium.rang,
        })
        .from(s.pvbOnderdeel)
        .innerJoin(
          s.kerntaakOnderdeel,
          eq(s.pvbOnderdeel.kerntaakOnderdeelId, s.kerntaakOnderdeel.id),
        )
        .innerJoin(
          s.kerntaak,
          eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
        )
        .innerJoin(
          s.kwalificatieprofiel,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
        .leftJoin(
          s.werkprocesKerntaakOnderdeel,
          eq(
            s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
            s.kerntaakOnderdeel.id,
          ),
        )
        .leftJoin(
          s.werkproces,
          and(
            eq(s.werkprocesKerntaakOnderdeel.werkprocesId, s.werkproces.id),
            eq(s.werkproces.kerntaakId, s.kerntaak.id),
          ),
        )
        .leftJoin(
          s.beoordelingscriterium,
          eq(s.beoordelingscriterium.werkprocesId, s.werkproces.id),
        )
        .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId))
        .orderBy(
          s.kwalificatieprofiel.titel,
          s.kerntaak.rang,
          s.kerntaak.titel,
          s.werkproces.rang,
          s.werkproces.titel,
          s.beoordelingscriterium.rang,
        );

      if (toetsdocumentData.length === 0) {
        throw new Error("Geen toetsdocumenten gevonden voor deze aanvraag");
      }

      // Also get all kerntaken for each found kwalificatieprofiel (including ones without pvbOnderdeel)
      const kwalificatieprofielIds = [
        ...new Set(toetsdocumentData.map((row) => row.kwalificatieprofielId)),
      ];

      const allKerntakenData = await query
        .select({
          kwalificatieprofielId: s.kwalificatieprofiel.id,
          kerntaakId: s.kerntaak.id,
          kerntaakTitel: s.kerntaak.titel,
          kerntaakType: s.kerntaak.type,
          kerntaakRang: s.kerntaak.rang,
          onderdeelId: s.kerntaakOnderdeel.id,
          onderdeelType: s.kerntaakOnderdeel.type,
          werkprocesId: s.werkproces.id,
          werkprocesTitel: s.werkproces.titel,
          werkprocesResultaat: s.werkproces.resultaat,
          werkprocesRang: s.werkproces.rang,
          criteriumId: s.beoordelingscriterium.id,
          criteriumTitle: s.beoordelingscriterium.title,
          criteriumOmschrijving: s.beoordelingscriterium.omschrijving,
          criteriumRang: s.beoordelingscriterium.rang,
        })
        .from(s.kwalificatieprofiel)
        .innerJoin(
          s.kerntaak,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .innerJoin(
          s.kerntaakOnderdeel,
          eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
        )
        .leftJoin(
          s.werkprocesKerntaakOnderdeel,
          eq(
            s.werkprocesKerntaakOnderdeel.kerntaakOnderdeelId,
            s.kerntaakOnderdeel.id,
          ),
        )
        .leftJoin(
          s.werkproces,
          and(
            eq(s.werkprocesKerntaakOnderdeel.werkprocesId, s.werkproces.id),
            eq(s.werkproces.kerntaakId, s.kerntaak.id),
          ),
        )
        .leftJoin(
          s.beoordelingscriterium,
          eq(s.beoordelingscriterium.werkprocesId, s.werkproces.id),
        )
        .where(inArray(s.kwalificatieprofiel.id, kwalificatieprofielIds))
        .orderBy(
          s.kerntaak.rang,
          s.kerntaak.titel,
          s.werkproces.rang,
          s.werkproces.titel,
          s.beoordelingscriterium.rang,
        );

      // Build a map of pvbOnderdeel status by kerntaakOnderdeelId
      const pvbOnderdeelStatusMap = new Map<
        string,
        {
          pvbOnderdeelId: string;
          behaaldStatus: "behaald" | "niet_behaald" | "nog_niet_bekend";
        }
      >();

      for (const row of toetsdocumentData) {
        if (row.pvbOnderdeelId && !pvbOnderdeelStatusMap.has(row.onderdeelId)) {
          pvbOnderdeelStatusMap.set(row.onderdeelId, {
            pvbOnderdeelId: row.pvbOnderdeelId,
            behaaldStatus: row.pvbOnderdeelUitslag || "nog_niet_bekend",
          });
        }
      }

      // Build the result structure grouped by kwalificatieprofiel
      type KwalificatieStructure = {
        kwalificatieprofiel: {
          id: string;
          titel: string;
          richting: "instructeur" | "leercoach" | "pvb_beoordelaar";
          niveau: {
            id: string;
            rang: number;
          };
        };
        kerntaken: Map<
          string,
          {
            id: string;
            titel: string;
            type: "verplicht" | "facultatief";
            rang: number | null;
            onderdelen: Map<
              string,
              {
                id: string;
                type: "portfolio" | "praktijk";
                pvbOnderdeelId: string | null;
                behaaldStatus: "behaald" | "niet_behaald" | "nog_niet_bekend";
                werkprocessen: Map<
                  string,
                  {
                    id: string;
                    titel: string;
                    resultaat: string;
                    rang: number;
                    beoordelingscriteria: Array<{
                      id: string;
                      title: string;
                      omschrijving: string | null;
                      rang: number | null;
                    }>;
                  }
                >;
              }
            >;
          }
        >;
      };

      const kwalificatieMap = new Map<string, KwalificatieStructure>();

      // First, create kwalificatieprofiel entries from toetsdocumentData
      for (const row of toetsdocumentData) {
        if (!kwalificatieMap.has(row.kwalificatieprofielId)) {
          kwalificatieMap.set(row.kwalificatieprofielId, {
            kwalificatieprofiel: {
              id: row.kwalificatieprofielId,
              titel: row.kwalificatieprofielTitel,
              richting: row.kwalificatieprofielRichting,
              niveau: {
                id: row.niveauId,
                rang: row.niveauRang,
              },
            },
            kerntaken: new Map(),
          });
        }
      }

      // Process all kerntaken data (includes ones without pvbOnderdeel)
      for (const row of allKerntakenData) {
        const kwalificatie = kwalificatieMap.get(row.kwalificatieprofielId);
        if (!kwalificatie) continue;

        // Add kerntaak
        if (!kwalificatie.kerntaken.has(row.kerntaakId)) {
          kwalificatie.kerntaken.set(row.kerntaakId, {
            id: row.kerntaakId,
            titel: row.kerntaakTitel,
            type: row.kerntaakType,
            rang: row.kerntaakRang,
            onderdelen: new Map(),
          });
        }

        const kerntaak = kwalificatie.kerntaken.get(row.kerntaakId);
        if (!kerntaak) continue;

        // Add onderdeel
        if (!kerntaak.onderdelen.has(row.onderdeelId)) {
          const pvbStatus = pvbOnderdeelStatusMap.get(row.onderdeelId);
          kerntaak.onderdelen.set(row.onderdeelId, {
            id: row.onderdeelId,
            type: row.onderdeelType,
            pvbOnderdeelId: pvbStatus?.pvbOnderdeelId || null,
            behaaldStatus: pvbStatus?.behaaldStatus || "nog_niet_bekend",
            werkprocessen: new Map(),
          });
        }

        const onderdeel = kerntaak.onderdelen.get(row.onderdeelId);
        if (!onderdeel || !row.werkprocesId) continue;

        // Add werkproces
        if (!onderdeel.werkprocessen.has(row.werkprocesId)) {
          onderdeel.werkprocessen.set(row.werkprocesId, {
            id: row.werkprocesId,
            titel: row.werkprocesTitel || "",
            resultaat: row.werkprocesResultaat || "",
            rang: row.werkprocesRang || 0,
            beoordelingscriteria: [],
          });
        }

        const werkproces = onderdeel.werkprocessen.get(row.werkprocesId);
        if (!werkproces) continue;

        // Add beoordelingscriterium
        if (
          row.criteriumId &&
          !werkproces.beoordelingscriteria.some((c) => c.id === row.criteriumId)
        ) {
          werkproces.beoordelingscriteria.push({
            id: row.criteriumId,
            title: row.criteriumTitle || "",
            omschrijving: row.criteriumOmschrijving,
            rang: row.criteriumRang,
          });
        }
      }

      // Convert maps to arrays and sort
      const result = Array.from(kwalificatieMap.values()).map(
        (kwalificatie) => ({
          kwalificatieprofiel: kwalificatie.kwalificatieprofiel,
          kerntaken: Array.from(kwalificatie.kerntaken.values())
            .map((kerntaak) => ({
              ...kerntaak,
              onderdelen: Array.from(kerntaak.onderdelen.values()).map(
                (onderdeel) => ({
                  ...onderdeel,
                  werkprocessen: Array.from(
                    onderdeel.werkprocessen.values(),
                  ).sort((a, b) => a.rang - b.rang),
                }),
              ),
            }))
            .sort((a, b) => {
              if (a.rang !== null && b.rang !== null) return a.rang - b.rang;
              if (a.rang !== null) return -1;
              if (b.rang !== null) return 1;
              return a.titel.localeCompare(b.titel);
            }),
        }),
      );

      // Ensure non-empty array as required by schema
      if (result.length === 0) {
        throw new Error("Geen toetsdocumenten gevonden voor deze aanvraag");
      }

      return result as [(typeof result)[0]];
    },
  ),
);

// Update leercoach for a single PvB aanvraag
export const updateLeercoach = wrapCommand(
  "pvb.updateLeercoach",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      leercoachId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const result = await updateLeercoachForMultiple({
        pvbAanvraagIds: [input.pvbAanvraagId],
        leercoachId: input.leercoachId,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      return {
        success: result.success && result.updatedCount > 0,
      };
    },
  ),
);

// Get beoordelingscriteria status for all onderdelen in a PvB aanvraag
export const getBeoordelingsCriteria = wrapCommand(
  "pvb.getBeoordelingsCriteria",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
    }),
    z.object({
      items: z.array(
        z.object({
          pvbOnderdeelId: z.string().uuid(),
          kerntaakId: z.string().uuid(),
          beoordelingscriteriumId: z.string().uuid(),
          behaald: z.boolean().nullable(),
          opmerkingen: z.string().nullable(),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();

      // Get all beoordelingscriteria for all onderdelen in this aanvraag
      const results = await query
        .select({
          pvbOnderdeelId: s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
          kerntaakId: s.pvbOnderdeelBeoordelingsCriterium.kerntaakId,
          beoordelingscriteriumId:
            s.pvbOnderdeelBeoordelingsCriterium.beoordelingscriteriumId,
          behaald: s.pvbOnderdeelBeoordelingsCriterium.behaald,
          opmerkingen: s.pvbOnderdeelBeoordelingsCriterium.opmerkingen,
        })
        .from(s.pvbOnderdeelBeoordelingsCriterium)
        .innerJoin(
          s.pvbOnderdeel,
          eq(
            s.pvbOnderdeel.id,
            s.pvbOnderdeelBeoordelingsCriterium.pvbOnderdeelId,
          ),
        )
        .where(eq(s.pvbOnderdeel.pvbAanvraagId, input.pvbAanvraagId));

      return {
        items: results,
      };
    },
  ),
);

// Update beoordelaar for all onderdelen in a single PvB aanvraag
export const updateBeoordelaarForAll = wrapCommand(
  "pvb.updateBeoordelaarForAll",
  withZod(
    z.object({
      pvbAanvraagId: z.string().uuid(),
      beoordelaarId: z.string().uuid(),
      aangemaaktDoor: z.string().uuid(),
      reden: z.string().optional(),
    }),
    z.object({
      success: z.boolean(),
    }),
    async (input) => {
      const result = await updateBeoordelaarForMultiple({
        pvbAanvraagIds: [input.pvbAanvraagId],
        beoordelaarId: input.beoordelaarId,
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden,
      });

      return {
        success: result.success && result.updatedCount > 0,
      };
    },
  ),
);
