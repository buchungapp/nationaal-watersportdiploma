import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, countDistinct, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import { possibleSingleRow, singleRow } from "../../utils/data-helpers.js";
import {
  generatePvbAanvraagID,
  jsonBuildObject,
  withLimitOffset,
  withZod,
  wrapCommand,
} from "../../utils/index.js";
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
): Promise<void> {
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
            s.actor,
            eq(s.persoonKwalificatie.personId, s.actor.personId),
          )
          .innerJoin(s.pvbAanvraag, eq(s.actor.id, s.pvbAanvraag.kandidaatId))
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
        reden: input.reden ?? "Onderdeel toegevoegd",
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
          reden: "Beoordelaar toegewezen bij toevoegen onderdeel",
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

        // Validate new beoordelaar if provided
        if (input.beoordelaarId) {
          const beoordelaarActors = await tx
            .select({ id: s.actor.id })
            .from(s.actor)
            .where(
              and(
                eq(s.actor.id, input.beoordelaarId),
                eq(s.actor.type, "pvb_beoordelaar"),
                eq(s.actor.locationId, onderdeel.locatieId),
              ),
            );

          if (beoordelaarActors.length === 0) {
            throw new Error(
              "Opgegeven beoordelaar is niet geldig of niet beschikbaar op deze locatie",
            );
          }
        }

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
          reden: input.reden ?? "Beoordelaar gewijzigd",
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

        // 2. Validate course exists and get its instructieGroep
        tx
          .select({
            courseId: s.course.id,
            instructieGroepId: s.instructieGroepCursus.instructieGroepId,
          })
          .from(s.course)
          .innerJoin(
            s.instructieGroepCursus,
            eq(s.course.id, s.instructieGroepCursus.courseId),
          )
          .where(eq(s.course.id, input.courseId)),

        // 3. Check if course is already added to this aanvraag
        tx
          .select({ id: s.pvbAanvraagCourse.id })
          .from(s.pvbAanvraagCourse)
          .where(
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbAanvraagCourse.courseId, input.courseId),
            ),
          ),

        // 4. Check if person already has qualifications for this course + any existing onderdelen
        tx
          .select({
            id: s.persoonKwalificatie.id,
            kerntaakOnderdeelId: s.persoonKwalificatie.kerntaakOnderdeelId,
          })
          .from(s.persoonKwalificatie)
          .innerJoin(
            s.actor,
            eq(s.persoonKwalificatie.personId, s.actor.personId),
          )
          .innerJoin(s.pvbAanvraag, eq(s.actor.id, s.pvbAanvraag.kandidaatId))
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
      const course = singleRow(courseResults);

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
          ),
        );

      const mainCourse = possibleSingleRow(mainCourses);
      if (
        mainCourse &&
        course.instructieGroepId !== mainCourse.instructieGroepId
      ) {
        throw new Error(
          "Cursus moet tot dezelfde instructiegroep behoren als de hoofdcursus",
        );
      }

      // If setting as main course, unset current main course
      if (input.isMainCourse && mainCourse) {
        await tx
          .update(s.pvbAanvraagCourse)
          .set({ isMainCourse: false })
          .where(
            and(
              eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId),
              eq(s.pvbAanvraagCourse.isMainCourse, true),
            ),
          );
      }

      // Create the pvbAanvraagCourse
      const createdCourses = await tx
        .insert(s.pvbAanvraagCourse)
        .values({
          pvbAanvraagId: input.pvbAanvraagId,
          courseId: input.courseId,
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
      // Validate the course exists in this aanvraag and get course count in one query
      const [courseResults, allCourses] = await Promise.all([
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
            ),
          ),

        tx
          .select({ id: s.pvbAanvraagCourse.id })
          .from(s.pvbAanvraagCourse)
          .where(eq(s.pvbAanvraagCourse.pvbAanvraagId, input.pvbAanvraagId)),
      ]);

      const course = singleRow(courseResults);

      // Prevent deleting the last course
      if (allCourses.length === 1) {
        throw new Error(
          "Kan de laatste cursus niet verwijderen. Een PvB aanvraag moet minimaal één cursus hebben.",
        );
      }

      // Can't remove main course if there are other courses
      if (course.isMainCourse && allCourses.length > 1) {
        throw new Error(
          "Kan de hoofdcursus niet verwijderen zolang er andere cursussen zijn. Stel eerst een andere cursus in als hoofdcursus.",
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
            eq(s.actor.id, input.leercoachId),
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
          reden: input.reden ?? "Toestemming leercoach gevraagd",
        })
        .returning({ id: s.pvbLeercoachToestemming.id });

      const toestemming = singleRow(createdToestemming);

      // Log the event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "leercoach_toestemming_gevraagd",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Leercoach heeft toestemming gevraagd",
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
        reden: input.reden ?? `Leercoach toestemming ${input.status}`,
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
        reden: input.reden ?? `Leercoach toestemming ${input.status}`,
      });

      // Update aanvraag status based on permission decision
      if (input.status === "gegeven") {
        await logPvbEvent({
          pvbAanvraagId: toestemming.pvbAanvraagId,
          gebeurtenisType: "leercoach_toestemming_gegeven",
          aangemaaktDoor: input.aangemaaktDoor,
          reden: input.reden ?? "Leercoach heeft toestemming gegeven",
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
          reden: input.reden ?? "Leercoach heeft toestemming geweigerd",
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
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
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
        reden: input.reden ?? "Aanvraag ingediend",
      });

      // If leercoach is assigned, automatically request permission
      if (activeLeercoach) {
        await requestLeercoachPermission({
          pvbAanvraagId: input.pvbAanvraagId,
          leercoachId: activeLeercoach.leercoachId,
          aangemaaktDoor: input.aangemaaktDoor,
          reden: "Automatisch gevraagd bij indienen aanvraag",
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
          reden: "Alle voorwaarden al vervuld bij indienen",
        });
      }

      // Log the submission event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "aanvraag_ingediend",
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Aanvraag ingediend",
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
        .orderBy(s.pvbAanvraagStatus.aangemaaktOp)
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
        reden: input.reden ?? "Aanvraag ingetrokken",
      });

      // Log the withdrawal event
      await logPvbEvent({
        pvbAanvraagId: input.pvbAanvraagId,
        gebeurtenisType: "aanvraag_ingetrokken",
        data: {
          ingetrokkenDoor: input.aangemaaktDoor,
          voorigeStatus: currentStatus.status,
        },
        aangemaaktDoor: input.aangemaaktDoor,
        reden: input.reden ?? "Aanvraag ingetrokken",
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
            eq(s.actor.id, input.kandidaatId),
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
        aangemaaktDoor: input.kandidaatId,
        reden: "Nieuwe aanvraag aangemaakt",
      });

      for (const course of input.courses) {
        await addCourse({
          pvbAanvraagId: pvbAanvraag.id,
          courseId: course.courseId,
          isMainCourse: course.isMainCourse,
          opmerkingen: course.opmerkingen,
          aangemaaktDoor: input.kandidaatId,
          reden: "Initiele aanvraag cursus",
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
          aangemaaktDoor: input.kandidaatId,
          reden: "Initiele aanvraag onderdeel",
        });
      }

      if (input.leercoachId) {
        await requestLeercoachPermission({
          pvbAanvraagId: pvbAanvraag.id,
          leercoachId: input.leercoachId,
          aangemaaktDoor: input.kandidaatId,
          reden: "Initiele leercoach toewijzing",
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
      filter: z.object({
        locationId: z.string().uuid(),
        q: z.string().optional(),
      }),
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

      // More performant subquery using DISTINCT ON to get latest status
      const latestStatusSubquery = query
        .selectDistinct({
          pvbAanvraagId: s.pvbAanvraagStatus.pvbAanvraagId,
          status: s.pvbAanvraagStatus.status,
          aangemaaktOp: s.pvbAanvraagStatus.aangemaaktOp,
        })
        .from(s.pvbAanvraagStatus)
        .orderBy(
          s.pvbAanvraagStatus.pvbAanvraagId,
          desc(s.pvbAanvraagStatus.aangemaaktOp),
        )
        .as("latest_status");

      // Query to get basic aanvraag info with current status and aggregated onderdelen
      const aanvragenQuery = query
        .select({
          id: s.pvbAanvraag.id,
          handle: s.pvbAanvraag.handle,
          kandidaatId: s.pvbAanvraag.kandidaatId,
          type: s.pvbAanvraag.type,
          opmerkingen: s.pvbAanvraag.opmerkingen,
          kandidaatFirstName: s.person.firstName,
          kandidaatLastNamePrefix: s.person.lastNamePrefix,
          kandidaatLastName: s.person.lastName,
          status: latestStatusSubquery.status,
          lastStatusChange: latestStatusSubquery.aangemaaktOp,
          // Array aggregation for onderdelen
          kerntaakOnderdelen: sql<
            Array<{
              id: string;
              titel: string;
              type: "portfolio" | "praktijk";
              rang: number;
              behaaldStatus: "behaald" | "niet_behaald" | "nog_niet_bekend";
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
                })} ORDER BY ${s.kerntaak.rang}, ${s.kerntaak.titel}
              ) FILTER (WHERE ${s.kerntaakOnderdeel.id} IS NOT NULL),
              '[]'::json
            )
          `,
        })
        .from(s.pvbAanvraag)
        .innerJoin(s.actor, eq(s.pvbAanvraag.kandidaatId, s.actor.id))
        .innerJoin(s.person, eq(s.actor.personId, s.person.id))
        .innerJoin(
          latestStatusSubquery,
          eq(latestStatusSubquery.pvbAanvraagId, s.pvbAanvraag.id),
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
        .where(eq(s.pvbAanvraag.locatieId, input.filter.locationId))
        .groupBy(
          s.pvbAanvraag.id,
          s.person.id,
          latestStatusSubquery.status,
          latestStatusSubquery.aangemaaktOp,
        )
        .orderBy(desc(latestStatusSubquery.aangemaaktOp))
        .$dynamic();

      // Get count
      const countQuery = query
        .select({ count: countDistinct(s.pvbAanvraag.id) })
        .from(s.pvbAanvraag)
        .where(eq(s.pvbAanvraag.locatieId, input.filter.locationId));

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
        type: row.type,
        status: row.status,
        lastStatusChange: dayjs(row.lastStatusChange).toISOString(),
        opmerkingen: row.opmerkingen,
        kerntaakOnderdelen: row.kerntaakOnderdelen || [],
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
