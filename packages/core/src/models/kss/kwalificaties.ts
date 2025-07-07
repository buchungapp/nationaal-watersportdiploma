import { schema as s } from "@nawadi/db";
import { and, eq, exists, inArray, max, sql } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  enforceArray,
  singleOrNonEmptyArray,
  uuidSchema,
  withZod,
  wrapQuery,
} from "../../utils/index.js";

export const listHighestKwalificatiePerCourseAndRichting = wrapQuery(
  "kss.kwalificaties.listHighestKwalificatiePerCourseAndRichting",
  withZod(
    z
      .object({
        filter: z
          .object({
            personId: singleOrNonEmptyArray(uuidSchema).optional(),
            locationId: singleOrNonEmptyArray(uuidSchema).optional(),
          })
          .default({}),
      })
      .default({}),
    async ({ filter }) => {
      const query = useQuery();

      const personIds = filter.personId ? enforceArray(filter.personId) : [];
      const locationIds = filter.locationId
        ? enforceArray(filter.locationId)
        : [];

      // Subquery to find kwalificatieprofielen where ALL verplichte kerntaakonderdelen are achieved
      const completedKwalificatieprofielen = query
        .select({
          personId: s.persoonKwalificatie.personId,
          courseId: s.persoonKwalificatie.courseId,
          kwalificatieprofielId: s.kwalificatieprofiel.id,
          richting: s.kwalificatieprofiel.richting,
          niveauRang: s.niveau.rang,
        })
        .from(s.kwalificatieprofiel)
        .innerJoin(s.niveau, eq(s.kwalificatieprofiel.niveauId, s.niveau.id))
        .innerJoin(
          s.kerntaak,
          eq(s.kerntaak.kwalificatieprofielId, s.kwalificatieprofiel.id),
        )
        .innerJoin(
          s.kerntaakOnderdeel,
          eq(s.kerntaakOnderdeel.kerntaakId, s.kerntaak.id),
        )
        .innerJoin(
          s.persoonKwalificatie,
          eq(s.persoonKwalificatie.kerntaakOnderdeelId, s.kerntaakOnderdeel.id),
        )
        .where(
          and(
            // Only consider verplichte kerntaken
            eq(s.kerntaak.type, "verplicht"),
            // Apply person filter if provided
            personIds.length > 0
              ? inArray(s.persoonKwalificatie.personId, personIds)
              : undefined,
            // Apply location filter if provided
            locationIds.length > 0
              ? exists(
                  query
                    .select({ id: sql`1` })
                    .from(s.actor)
                    .where(
                      and(
                        eq(s.actor.personId, s.persoonKwalificatie.personId),
                        inArray(s.actor.type, [
                          "instructor",
                          "pvb_beoordelaar",
                        ]),
                        inArray(s.actor.locationId, locationIds),
                      ),
                    ),
                )
              : undefined,
          ),
        )
        .groupBy(
          s.persoonKwalificatie.personId,
          s.persoonKwalificatie.courseId,
          s.kwalificatieprofiel.id,
          s.kwalificatieprofiel.richting,
          s.niveau.rang,
        )
        .having(
          // Check that the count of achieved verplichte kerntaakonderdelen equals the total count
          sql`COUNT(DISTINCT ${s.kerntaakOnderdeel.id}) = (
            SELECT COUNT(DISTINCT ko2.id)
            FROM ${s.kerntaak} k2
            INNER JOIN ${s.kerntaakOnderdeel} ko2 ON ko2.kerntaak_id = k2.id
            WHERE k2.kwalificatieprofiel_id = ${s.kwalificatieprofiel.id}
            AND k2.type = 'verplicht'
          )`,
        )
        .as("completedKwalificatieprofielen");

      // Now find the highest completed kwalificatieprofiel per person, course, and richting
      const rows = await query
        .select({
          personId: completedKwalificatieprofielen.personId,
          courseId: completedKwalificatieprofielen.courseId,
          richting: completedKwalificatieprofielen.richting,
          hoogsteNiveau: max(completedKwalificatieprofielen.niveauRang).mapWith(
            (max) => (max ?? 0) as number,
          ),
        })
        .from(completedKwalificatieprofielen)
        .groupBy(
          completedKwalificatieprofielen.personId,
          completedKwalificatieprofielen.courseId,
          completedKwalificatieprofielen.richting,
        );

      return rows;
    },
  ),
);
