import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  and,
  countDistinct,
  eq,
  exists,
  getTableColumns,
  inArray,
  isNull,
  ne,
  type SQL,
  sql,
} from "drizzle-orm";
import { aggregate } from "drizzle-toolbelt";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  formatSearchTerms,
  generatePersonID,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withLimitOffset,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import * as DuplicateScoring from "./_internal/duplicate-scoring.js";
import { insertSchema, personSchema } from "./person.schema.js";
import { getOrCreateFromEmail } from "./user.js";
import { selectSchema } from "./user.schema.js";

export * as $schema from "./person.schema.js";

export const getOrCreate = wrapCommand(
  "user.person.getOrCreate",
  withZod(
    insertSchema
      .pick({
        firstName: true,
        lastName: true,
        lastNamePrefix: true,
        dateOfBirth: true,
        birthCity: true,
        birthCountry: true,
      })
      .extend({
        userId: selectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const conditions: SQL[] = [];

      if (input.userId) {
        conditions.push(eq(s.person.userId, input.userId));
      } else {
        conditions.push(isNull(s.person.userId));
      }

      // Add conditions dynamically based on defined inputs
      if (input.firstName) {
        conditions.push(
          eq(sql`LOWER(${s.person.firstName})`, input.firstName.toLowerCase()),
        );
      }
      if (input.lastName) {
        conditions.push(
          eq(sql`LOWER(${s.person.lastName})`, input.lastName.toLowerCase()),
        );
      }
      if (input.dateOfBirth) {
        conditions.push(
          eq(
            s.person.dateOfBirth,
            dayjs(input.dateOfBirth).format("YYYY-MM-DD"),
          ),
        );
      }

      const [existing] = await query
        .select({ id: s.person.id })
        .from(s.person)
        .where(and(...conditions));

      if (existing) {
        return {
          id: existing.id,
        };
      }

      const [newPerson] = await query
        .insert(s.person)
        .values({
          userId: input.userId,
          handle: generatePersonID(),
          firstName: input.firstName,
          lastName: input.lastName,
          lastNamePrefix: input.lastNamePrefix,
          dateOfBirth: input.dateOfBirth
            ? dayjs(input.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.birthCity,
          birthCountry: input.birthCountry,
        })
        .returning({ id: s.person.id });

      if (!newPerson) {
        throw new Error("Failed to create actor");
      }

      return {
        id: newPerson.id,
      };
    },
  ),
);

export const create = wrapCommand(
  "user.person.create",
  withZod(
    insertSchema
      .pick({
        firstName: true,
        lastName: true,
        lastNamePrefix: true,
        dateOfBirth: true,
        birthCity: true,
        birthCountry: true,
      })
      .extend({
        userId: selectSchema.shape.authUserId.optional(),
      }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const newPerson = await query
        .insert(s.person)
        .values({
          userId: input.userId,
          handle: generatePersonID(),
          firstName: input.firstName,
          lastName: input.lastName,
          lastNamePrefix: input.lastNamePrefix,
          dateOfBirth: input.dateOfBirth
            ? dayjs(input.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.birthCity,
          birthCountry: input.birthCountry,
        })
        .returning({ id: s.person.id })
        .then(singleRow);

      return {
        id: newPerson.id,
      };
    },
  ),
);

export const createLocationLink = wrapCommand(
  "user.person.createLocationLink",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      await query
        .insert(s.personLocationLink)
        .values({
          personId: input.personId,
          locationId: input.locationId,
          status: "linked",
          permissionLevel: "none",
        })
        .onConflictDoNothing({
          target: [
            s.personLocationLink.personId,
            s.personLocationLink.locationId,
          ],
        });

      return;
    },
  ),
);

/**
 * Operator-driven location link primitive used by the import preview commit
 * path. Differs from `createLocationLink` in policy: a previously revoked or
 * removed link is NEVER silently re-linked. Re-linking after a revoke is a
 * GDPR consent regression — the revoke was an active operator decision (or a
 * data-subject withdrawal). Operators must escalate to NWD/sysadmin for the
 * re-link, who handle it with proper consent record.
 *
 *   no existing link  → insert with status='linked'
 *   linked active     → no-op (idempotent)
 *   revoked / removed → THROW with operator-facing policy message
 */
export const linkToLocation = wrapCommand(
  "user.person.linkToLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      const existing = await query
        .select({ status: s.personLocationLink.status })
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.locationId, input.locationId),
          ),
        )
        .then(possibleSingleRow);

      if (existing?.status === "linked") {
        return;
      }

      if (existing?.status === "revoked" || existing?.status === "removed") {
        throw new Error(
          "Deze persoon was eerder verwijderd. Neem contact op met NWD om opnieuw toe te voegen.",
        );
      }

      await query.insert(s.personLocationLink).values({
        personId: input.personId,
        locationId: input.locationId,
        status: "linked",
        permissionLevel: "none",
      });

      return;
    },
  ),
);

/**
 * Score a set of pasted candidate rows against the operator's location's
 * linked-active persons. Returns matches grouped by row index plus the
 * cross-row groups (when ≥2 rows resolve to the same existing person above
 * threshold).
 *
 * The query is GDPR-scoped at the database level: only persons with
 * `personLocationLink.status='linked'` for `locationId` and `deletedAt IS NULL`
 * are scoreable. Operators do not see persons they shouldn't.
 *
 * Aggregates (cert count, last diploma date) are computed in the same SQL
 * via LEFT JOIN over already-matched persons — one round trip per call. The
 * full per-person history (cohort labels, certificate handles, etc.) is
 * fetched lazily by the UI's history side panel.
 */
export const findCandidateMatchesInLocation = wrapQuery(
  "user.person.findCandidateMatchesInLocation",
  withZod(
    z.object({
      locationId: uuidSchema,
      targetCohortId: uuidSchema.optional(),
      candidates: z
        .array(
          z.object({
            rowIndex: z.number().int().nonnegative(),
            firstName: z.string(),
            lastName: z.string().nullable(),
            lastNamePrefix: z.string().nullable(),
            dateOfBirth: z.string(), // YYYY-MM-DD
            birthCity: z.string(),
            email: z.string().nullable(),
          }),
        )
        .max(200),
    }),
    z.object({
      matchesByRow: z.array(
        z.object({
          rowIndex: z.number().int(),
          candidates: z.array(
            z.object({
              personId: z.string().uuid(),
              score: z.number(),
              reasons: z.array(z.string()),
              firstName: z.string(),
              lastName: z.string().nullable(),
              lastNamePrefix: z.string().nullable(),
              dateOfBirth: z.string().nullable(),
              birthCity: z.string().nullable(),
              certificateCount: z.number().int(),
              lastDiplomaIssuedAt: z.string().nullable(),
              isAlreadyInTargetCohort: z.boolean(),
            }),
          ),
        }),
      ),
      crossRowGroups: z.array(
        z.object({
          rowIndices: z.array(z.number().int()),
          sharedCandidatePersonIds: z.array(z.string().uuid()),
        }),
      ),
    }),
    async (input) => {
      const query = useQuery();

      if (input.candidates.length === 0) {
        return { matchesByRow: [], crossRowGroups: [] };
      }

      // Build the VALUES list of pasted candidates for the CTE. Each row
      // becomes (row_index, first_name, last_name, last_name_prefix,
      // date_of_birth, birth_city). Email isn't used in scoring v1 (no userId
      // boost path) but kept available for future similarity work.
      const valuesRows = input.candidates.map(
        (c) =>
          sql`(${c.rowIndex}::int, ${c.firstName}::text, ${c.lastName}::text, ${c.lastNamePrefix}::text, ${c.dateOfBirth}::date, ${c.birthCity}::text)`,
      );

      const targetCohortFilter = input.targetCohortId
        ? sql`(
            SELECT EXISTS (
              SELECT 1
              FROM cohort_allocation ca
              INNER JOIN actor a ON a.id = ca.actor_id
              WHERE ca.cohort_id = ${input.targetCohortId}::uuid
                AND ca.deleted_at IS NULL
                AND a.deleted_at IS NULL
                AND a.person_id = lp.id
            )
          )`
        : sql`FALSE`;

      const NORMALIZE = (col: SQL) => sql`
        LOWER(REGEXP_REPLACE(COALESCE(${col}, ''), '[^[:alnum:]]+', '', 'g'))
      `;

      const stmt = sql`
        WITH pasted AS (
          SELECT
            v.row_index,
            v.first_name AS raw_first_name,
            v.last_name AS raw_last_name,
            v.last_name_prefix AS raw_last_name_prefix,
            v.date_of_birth AS dob,
            v.birth_city AS raw_birth_city,
            ${NORMALIZE(sql`v.first_name`)} AS first_norm,
            ${NORMALIZE(sql`v.last_name`)} AS last_norm,
            ${NORMALIZE(
              sql`TRIM(CONCAT(
                COALESCE(v.last_name_prefix, ''),
                CASE WHEN v.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(v.last_name, '')
              ))`,
            )} AS full_last_norm,
            ${NORMALIZE(sql`v.birth_city`)} AS birth_city_norm,
            NULL::uuid AS user_id
          FROM (VALUES ${sql.join(valuesRows, sql`, `)})
            AS v(row_index, first_name, last_name, last_name_prefix, date_of_birth, birth_city)
        ),
        location_persons AS (
          SELECT
            p.id,
            p.first_name,
            p.last_name,
            p.last_name_prefix,
            p.date_of_birth,
            p.birth_city,
            p.user_id,
            ${NORMALIZE(sql`p.first_name`)} AS first_norm,
            ${NORMALIZE(sql`p.last_name`)} AS last_norm,
            ${NORMALIZE(
              sql`TRIM(CONCAT(
                COALESCE(p.last_name_prefix, ''),
                CASE WHEN p.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
                COALESCE(p.last_name, '')
              ))`,
            )} AS full_last_norm,
            ${NORMALIZE(sql`p.birth_city`)} AS birth_city_norm
          FROM person p
          INNER JOIN person_location_link pll
            ON pll.person_id = p.id
          WHERE pll.location_id = ${input.locationId}::uuid
            AND pll.status = 'linked'
            AND p.deleted_at IS NULL
            AND p.first_name IS NOT NULL
        ),
        scored AS (
          SELECT
            pa.row_index,
            lp.id AS person_id,
            lp.first_name,
            lp.last_name,
            lp.last_name_prefix,
            lp.date_of_birth::text AS date_of_birth,
            lp.birth_city,
            -- Use the name+birth scoring branch: pasted candidates have no
            -- user_id, so the same-user branch is never applicable.
            ${DuplicateScoring.scoreNameBirthPair(
              {
                firstNorm: sql`pa.first_norm`,
                lastNorm: sql`pa.last_norm`,
                fullLastNorm: sql`pa.full_last_norm`,
                dateOfBirth: sql`pa.dob`,
                birthCityNorm: sql`pa.birth_city_norm`,
                userId: sql`pa.user_id`,
              },
              {
                firstNorm: sql`lp.first_norm`,
                lastNorm: sql`lp.last_norm`,
                fullLastNorm: sql`lp.full_last_norm`,
                dateOfBirth: sql`lp.date_of_birth`,
                birthCityNorm: sql`lp.birth_city_norm`,
                userId: sql`lp.user_id`,
              },
            )} AS score,
            ARRAY_REMOVE(ARRAY[
              CASE WHEN pa.first_norm <> '' AND pa.first_norm = lp.first_norm
                   THEN 'same first name' END,
              CASE WHEN (pa.full_last_norm <> '' AND pa.full_last_norm = lp.full_last_norm)
                       OR (pa.last_norm <> '' AND pa.last_norm = lp.last_norm)
                   THEN 'same last name' END,
              CASE WHEN pa.dob IS NOT NULL AND lp.date_of_birth IS NOT NULL
                       AND pa.dob = lp.date_of_birth
                   THEN 'same birth date'
                   WHEN pa.dob IS NOT NULL AND lp.date_of_birth IS NOT NULL
                       AND ABS(pa.dob - lp.date_of_birth) <= 7
                   THEN 'close birth date' END,
              CASE WHEN pa.birth_city_norm <> ''
                       AND pa.birth_city_norm = lp.birth_city_norm
                   THEN 'same birth city' END
            ], NULL) AS reasons,
            ${targetCohortFilter} AS is_already_in_target_cohort
          FROM pasted pa
          INNER JOIN location_persons lp
            -- Prefilter to keep the cross-product manageable: require either
            -- same DOB (within a year) OR same first name (or prefix).
            ON (
              (pa.dob IS NOT NULL
                AND lp.date_of_birth IS NOT NULL
                AND ABS(pa.dob - lp.date_of_birth) <= 365)
              OR (
                pa.first_norm <> ''
                AND (
                  pa.first_norm = lp.first_norm
                  OR (LENGTH(pa.first_norm) >= 3
                      AND LENGTH(lp.first_norm) >= 3
                      AND LEFT(pa.first_norm, 3) = LEFT(lp.first_norm, 3))
                )
              )
            )
        ),
        person_aggregates AS (
          SELECT
            sc.person_id,
            COUNT(DISTINCT cert.id) FILTER (
              WHERE cert.deleted_at IS NULL AND cert.issued_at IS NOT NULL
            )::int AS certificate_count,
            MAX(cert.issued_at) FILTER (
              WHERE cert.deleted_at IS NULL AND cert.issued_at IS NOT NULL
            ) AS last_diploma_issued_at
          FROM scored sc
          LEFT JOIN student_curriculum scur ON scur.person_id = sc.person_id
          LEFT JOIN certificate cert ON cert.student_curriculum_id = scur.id
          GROUP BY sc.person_id
        )
        SELECT
          scored.row_index,
          scored.person_id,
          scored.first_name,
          scored.last_name,
          scored.last_name_prefix,
          scored.date_of_birth,
          scored.birth_city,
          scored.score::int AS score,
          scored.reasons,
          scored.is_already_in_target_cohort,
          COALESCE(agg.certificate_count, 0)::int AS certificate_count,
          agg.last_diploma_issued_at
        FROM scored
        LEFT JOIN person_aggregates agg ON agg.person_id = scored.person_id
        WHERE scored.score >= ${DuplicateScoring.SCORE_THRESHOLDS.weak}
        ORDER BY scored.row_index ASC, scored.score DESC, scored.person_id ASC
      `;

      const result = await query.execute(stmt);
      type Row = {
        row_index: number;
        person_id: string;
        first_name: string;
        last_name: string | null;
        last_name_prefix: string | null;
        date_of_birth: string | null;
        birth_city: string | null;
        score: number;
        reasons: string[];
        is_already_in_target_cohort: boolean;
        certificate_count: number;
        last_diploma_issued_at: string | null;
      };
      const rows = result.rows as unknown as Row[];

      const byRow = new Map<
        number,
        Array<{
          personId: string;
          score: number;
          reasons: string[];
          firstName: string;
          lastName: string | null;
          lastNamePrefix: string | null;
          dateOfBirth: string | null;
          birthCity: string | null;
          certificateCount: number;
          lastDiplomaIssuedAt: string | null;
          isAlreadyInTargetCohort: boolean;
        }>
      >();

      for (const r of rows) {
        if (!byRow.has(r.row_index)) {
          byRow.set(r.row_index, []);
        }
        // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
        byRow.get(r.row_index)!.push({
          personId: r.person_id,
          score: Number(r.score),
          reasons: r.reasons ?? [],
          firstName: r.first_name,
          lastName: r.last_name,
          lastNamePrefix: r.last_name_prefix,
          dateOfBirth: r.date_of_birth,
          birthCity: r.birth_city,
          certificateCount: Number(r.certificate_count),
          lastDiplomaIssuedAt: r.last_diploma_issued_at,
          isAlreadyInTargetCohort: r.is_already_in_target_cohort,
        });
      }

      // Cross-row group detection. A group is a personId that appears in
      // ≥2 rows' candidate sets, scored at or above the strong threshold.
      // (Below "strong" the match is "possible" and shouldn't force a
      // conflict resolution — operator can resolve weak matches case-by-case.)
      const personToRows = new Map<string, number[]>();
      for (const [rowIndex, candidates] of byRow.entries()) {
        for (const c of candidates) {
          if (c.score < DuplicateScoring.SCORE_THRESHOLDS.strong) continue;
          if (!personToRows.has(c.personId)) {
            personToRows.set(c.personId, []);
          }
          // biome-ignore lint/style/noNonNullAssertion: Map.has guard above
          personToRows.get(c.personId)!.push(rowIndex);
        }
      }

      // Merge groups: rows that share at least one strong-match person form a
      // single group. (Triplet case: rows A, B, C all match person X → one
      // group with rowIndices [A, B, C], sharedCandidatePersonIds [X].)
      const groups: Array<{
        rowIndices: number[];
        sharedCandidatePersonIds: string[];
      }> = [];
      const groupKeyFor = new Map<string, number>(); // canonical row-set -> group index
      for (const [personId, rowIndices] of personToRows.entries()) {
        if (rowIndices.length < 2) continue;
        const key = [...new Set(rowIndices)].sort((a, b) => a - b).join(",");
        const existing = groupKeyFor.get(key);
        if (existing !== undefined) {
          groups[existing]!.sharedCandidatePersonIds.push(personId);
        } else {
          groupKeyFor.set(key, groups.length);
          groups.push({
            rowIndices: [...new Set(rowIndices)].sort((a, b) => a - b),
            sharedCandidatePersonIds: [personId],
          });
        }
      }

      const matchesByRow = Array.from(byRow.entries())
        .map(([rowIndex, candidates]) => ({ rowIndex, candidates }))
        .sort((a, b) => a.rowIndex - b.rowIndex);

      return { matchesByRow, crossRowGroups: groups };
    },
  ),
);

export const isLinkedToLocation = wrapQuery(
  "user.person.isLinkedToLocation",
  withZod(
    z.object({ personId: uuidSchema, locationId: uuidSchema }),
    z.boolean(),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select()
        .from(s.personLocationLink)
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.locationId, input.locationId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(possibleSingleRow);

      return result !== null;
    },
  ),
);

export const byIdOrHandle = wrapQuery(
  "user.person.byIdOrHandle",
  withZod(
    z.union([z.object({ id: uuidSchema }), z.object({ handle: z.string() })]),
    personSchema,
    async (input) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [isNull(s.person.deletedAt)];

      if ("id" in input) {
        whereClausules.push(eq(s.person.id, input.id));
      }

      if ("handle" in input) {
        whereClausules.push(eq(s.person.handle, input.handle));
      }

      const res = await query
        .select({
          ...getTableColumns(s.person),
          email: s.user.email,
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .where(and(...whereClausules))
        .then((rows) => {
          const result = singleRow(rows);
          if (result.birthCountry?.code === null) {
            return {
              ...result,
              birthCountry: null,
            };
          }
          return result;
        });

      return {
        ...res,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: res.handle!,
        createdAt: dayjs(res.createdAt).toISOString(),
        updatedAt: dayjs(res.updatedAt).toISOString(),
      };
    },
  ),
);

export const list = wrapQuery(
  "user.person.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            userId: singleOrArray(uuidSchema).optional(),
            personId: singleOrArray(uuidSchema).optional(),
            locationId: singleOrArray(uuidSchema).optional(),
            actorType: singleOrArray(
              z.enum([
                "student",
                "instructor",
                "location_admin",
                "pvb_beoordelaar",
              ]),
            ).optional(),
            q: z.string().optional(),
          })
          .default({}),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().default(0),
      })
      .default({}),
    z.object({
      items: personSchema
        .extend({
          actors: z
            .object({
              id: uuidSchema,
              createdAt: z.string(),
              type: z.enum([
                "student",
                "instructor",
                "location_admin",
                "system",
                "pvb_beoordelaar",
                "secretariaat",
              ]),
              locationId: uuidSchema.nullable(),
            })
            .array(),
        })
        .array(),
      count: z.number().int().nonnegative(),
      limit: z.number().int().positive().nullable(),
      offset: z.number().int().nonnegative(),
    }),
    async ({ filter, limit, offset }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        filter.userId
          ? Array.isArray(filter.userId)
            ? inArray(s.person.userId, filter.userId)
            : eq(s.person.userId, filter.userId)
          : undefined,
        filter.personId
          ? Array.isArray(filter.personId)
            ? inArray(s.person.id, filter.personId)
            : eq(s.person.id, filter.personId)
          : undefined,
        filter.actorType
          ? Array.isArray(filter.actorType)
            ? and(
                inArray(s.actor.type, filter.actorType),
                isNull(s.actor.deletedAt),
              )
            : and(eq(s.actor.type, filter.actorType), isNull(s.actor.deletedAt))
          : undefined,
        filter.q
          ? sql`
              (
                setweight(to_tsvector('simple', 
                  COALESCE(${s.user.email}, '')
                ), 'A') ||
                setweight(to_tsvector('simple', 
                  COALESCE(split_part(${s.user.email}, '@', 1), '')
                ), 'B') ||
                setweight(to_tsvector('simple', 
                  COALESCE(split_part(${s.user.email}, '@', 2), '')
                ), 'C') ||
                setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
                setweight(to_tsvector('simple', 
                  COALESCE(${s.person.firstName}, '') || ' ' || 
                  COALESCE(${s.person.lastNamePrefix}, '') || ' ' || 
                  COALESCE(${s.person.lastName}, '')
                ), 'A')
              ) @@ to_tsquery('simple', ${formatSearchTerms(filter.q, "and")})
            `
          : undefined,
        isNull(s.person.deletedAt),
      ];

      if (filter.locationId) {
        if (Array.isArray(filter.locationId)) {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                inArray(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        } else {
          const existsQuery = query
            .select({ personId: s.personLocationLink.personId })
            .from(s.personLocationLink)
            .where(
              and(
                eq(s.personLocationLink.locationId, filter.locationId),
                eq(s.personLocationLink.status, "linked"),
                eq(s.personLocationLink.personId, s.person.id),
              ),
            );
          whereClausules.push(exists(existsQuery));
        }
      }

      const personCountQuery = query
        .select({ count: countDistinct(s.person.id) })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .then(singleRow);

      const personQuery = query
        .select({
          ...getTableColumns(s.person),
          birthCountry: {
            code: s.country.alpha_2,
            name: s.country.nl,
          },
          email: s.user.email,
          actor: s.actor,
        })
        .from(s.person)
        .leftJoin(s.country, eq(s.person.birthCountry, s.country.alpha_2))
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .leftJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.person.id),
            isNull(s.actor.deletedAt),
            isNull(s.person.deletedAt),
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.actor.locationId, filter.locationId)
                : eq(s.actor.locationId, filter.locationId)
              : undefined,
          ),
        )
        .where(and(...whereClausules))
        .$dynamic();

      const [{ count }, persons] = await Promise.all([
        personCountQuery,
        withLimitOffset(personQuery, limit, offset).then(
          aggregate({ pkey: "id", fields: { actors: "actor.id" } }),
        ),
      ]);

      if (persons.length === 0) {
        return {
          items: [],
          count,
          limit: limit ?? null,
          offset,
        };
      }

      return {
        items: persons.map((person) => ({
          ...person,
          // biome-ignore lint/style/noNonNullAssertion: intentional
          handle: person.handle!,
          createdAt: dayjs(person.createdAt).toISOString(),
          updatedAt: dayjs(person.updatedAt).toISOString(),
        })),
        count,
        limit: limit ?? null,
        offset,
      };
    },
  ),
);

export const searchForAutocomplete = wrapQuery(
  "user.person.searchForAutocomplete",
  withZod(
    z.object({
      q: z.string().min(1),
      limit: z.number().int().positive().default(10),
      excludePersonId: uuidSchema.optional(),
    }),
    z.array(
      personSchema.pick({
        id: true,
        handle: true,
        firstName: true,
        lastNamePrefix: true,
        lastName: true,
        email: true,
        dateOfBirth: true,
        userId: true,
        isPrimary: true,
      }),
    ),
    async ({ q, limit, excludePersonId }) => {
      const query = useQuery();

      const whereClausules: (SQL | undefined)[] = [
        sql`
          (
            setweight(to_tsvector('simple', 
              COALESCE(${s.user.email}, '')
            ), 'A') ||
            setweight(to_tsvector('simple', 
              COALESCE(split_part(${s.user.email}, '@', 1), '')
            ), 'B') ||
            setweight(to_tsvector('simple', 
              COALESCE(split_part(${s.user.email}, '@', 2), '')
            ), 'C') ||
            setweight(to_tsvector('simple', COALESCE(${s.person.handle}, '')), 'B') ||
            setweight(to_tsvector('simple', 
              COALESCE(${s.person.firstName}, '') || ' ' || 
              COALESCE(${s.person.lastNamePrefix}, '') || ' ' || 
              COALESCE(${s.person.lastName}, '')
            ), 'A')
          ) @@ to_tsquery('simple', ${formatSearchTerms(q, "and")})
        `,
        isNull(s.person.deletedAt),
        excludePersonId ? ne(s.person.id, excludePersonId) : undefined,
      ];

      const persons = await query
        .select({
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          email: s.user.email,
          dateOfBirth: s.person.dateOfBirth,
          userId: s.person.userId,
          isPrimary: s.person.isPrimary,
        })
        .from(s.person)
        .leftJoin(s.user, eq(s.person.userId, s.user.authUserId))
        .where(and(...whereClausules))
        .limit(limit);

      return persons.map((person) => ({
        ...person,
        // biome-ignore lint/style/noNonNullAssertion: intentional
        handle: person.handle!,
      }));
    },
  ),
);

export const listLocationsByRole = wrapQuery(
  "user.person.listLocationsByRole",
  withZod(
    z.object({
      personId: uuidSchema,
      roles: z
        .array(z.enum(["student", "instructor", "location_admin"]))
        .default(["instructor", "student", "location_admin"]),
    }),
    z.array(
      z.object({
        locationId: uuidSchema,
        roles: z.array(z.enum(["student", "instructor", "location_admin"])),
      }),
    ),
    async (input) => {
      const query = useQuery();

      const result = await query
        .select({
          locationId: s.personLocationLink.locationId,
          role: s.actor.type,
        })
        .from(s.personLocationLink)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.personId, s.personLocationLink.personId),
            eq(s.actor.locationId, s.personLocationLink.locationId),
            isNull(s.actor.deletedAt),
            inArray(s.actor.type, input.roles),
          ),
        )
        .where(
          and(
            eq(s.personLocationLink.personId, input.personId),
            eq(s.personLocationLink.status, "linked"),
          ),
        )
        .then(aggregate({ pkey: "locationId", fields: { roles: "role" } }));

      // biome-ignore lint/suspicious/noExplicitAny: intentional
      return result as any;
    },
  ),
);

export const setPrimary = wrapCommand(
  "user.person.setPrimary",
  withZod(
    z.object({
      personId: uuidSchema,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const result = await query
        .update(s.person)
        .set({
          isPrimary: true,
          updatedAt: sql`NOW()`,
        })
        .where(and(eq(s.person.id, input.personId), isNull(s.person.deletedAt)))
        .returning({ id: s.person.id })
        .then(singleRow);

      return result;
    },
  ),
);

export const replaceMetadata = wrapCommand(
  "user.person.replaceMetadata",
  withZod(
    z.object({
      personId: uuidSchema,
      metadata: z.record(z.any()),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          _metadata: sql`(((${JSON.stringify(input.metadata)})::jsonb)#>> '{}')::jsonb`,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const listActiveRolesForLocation = wrapQuery(
  "user.person.listActiveRolesForLocation",
  withZod(
    z.object({
      personId: uuidSchema,
      locationId: uuidSchema,
    }),
    z.array(z.enum(["student", "instructor", "location_admin"])),
    async (input) => {
      const query = useQuery();

      return await query
        .select({
          type: s.actor.type,
        })
        .from(s.actor)
        .where(
          and(
            eq(s.actor.locationId, input.locationId),
            eq(s.actor.personId, input.personId),
            isNull(s.actor.deletedAt),
          ),
        )
        .then((rows) =>
          rows
            .filter(({ type }) =>
              ["student", "instructor", "location_admin"].includes(type),
            )
            .map(
              ({ type }) => type as "student" | "instructor" | "location_admin",
            ),
        );
    },
  ),
);

export const moveToAccountByEmail = wrapCommand(
  "user.person.moveToAccountByEmail",
  withZod(
    z.object({
      personId: uuidSchema,
      email: z.string().toLowerCase().trim().email(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      async function findUserForPerson(personId: string) {
        return query
          .select()
          .from(s.user)
          .where(
            exists(
              query
                .select({ id: sql`1` })
                .from(s.person)
                .where(
                  and(
                    eq(s.person.id, personId),
                    isNull(s.person.deletedAt),
                    eq(s.person.userId, s.user.authUserId),
                  ),
                ),
            ),
          )
          .then(possibleSingleRow);
      }

      async function updatePersonUser(personId: string, userId: string) {
        return query
          .update(s.person)
          .set({ userId: userId, updatedAt: sql`NOW()`, isPrimary: false })
          .where(eq(s.person.id, personId))
          .returning({ id: s.person.id })
          .then(singleRow);
      }

      const user = await findUserForPerson(input.personId);

      const newUser = await getOrCreateFromEmail({
        email: input.email,
        displayName: user?.displayName ?? undefined,
      });
      return await updatePersonUser(input.personId, newUser.id);
    },
  ),
);

export const updateDetails = wrapCommand(
  "user.person.updateDetails",
  withZod(
    z.object({
      personId: uuidSchema,
      data: insertSchema
        .pick({
          firstName: true,
          lastName: true,
          lastNamePrefix: true,
          dateOfBirth: true,
          birthCity: true,
          birthCountry: true,
        })
        .partial(),
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      return await query
        .update(s.person)
        .set({
          firstName: input.data.firstName,
          lastName: input.data.lastName,
          lastNamePrefix: input.data.lastNamePrefix,
          dateOfBirth: input.data.dateOfBirth
            ? dayjs(input.data.dateOfBirth).format("YYYY-MM-DD")
            : undefined,
          birthCity: input.data.birthCity,
          birthCountry: input.data.birthCountry,
          updatedAt: sql`NOW()`,
        })
        .where(eq(s.person.id, input.personId))
        .returning({ id: s.person.id })
        .then(singleRow);
    },
  ),
);

export const mergePersons = wrapCommand(
  "user.person.mergePersons",
  withZod(
    z.object({
      personId: uuidSchema,
      targetPersonId: uuidSchema,
    }),
    async (input) => {
      return await withTransaction(async (tx) => {
        // First validate that both persons exist
        const persons = await tx
          .select({
            id: s.person.id,
            userId: s.person.userId,
            isPrimary: s.person.isPrimary,
          })
          .from(s.person)
          .where(
            and(
              inArray(s.person.id, [input.personId, input.targetPersonId]),
              isNull(s.person.deletedAt),
            ),
          );

        if (persons.length !== 2) {
          throw new Error("One or both persons not found");
        }

        // Transfer actors first so allocations point to the target person's actors.
        const actors = await tx
          .select({
            id: s.actor.id,
            type: s.actor.type,
            locationId: s.actor.locationId,
          })
          .from(s.actor)
          .where(eq(s.actor.personId, input.personId));

        if (actors.length > 0) {
          await tx
            .insert(s.actor)
            .values(
              actors.map((actor) => ({
                ...actor,
                id: undefined,
                personId: input.targetPersonId,
              })),
            )
            .onConflictDoNothing();

          const [targetPersonActors, cohortAllocationsToUpdate] =
            await Promise.all([
              tx
                .select({
                  id: s.actor.id,
                  type: s.actor.type,
                  locationId: s.actor.locationId,
                })
                .from(s.actor)
                .where(eq(s.actor.personId, input.targetPersonId)),
              tx
                .select({
                  id: s.cohortAllocation.id,
                  actorId: s.cohortAllocation.actorId,
                })
                .from(s.cohortAllocation)
                .where(
                  inArray(
                    s.cohortAllocation.actorId,
                    actors.map((actor) => actor.id),
                  ),
                ),
            ]);

          for (const cohortAllocation of cohortAllocationsToUpdate) {
            const currentActor = actors.find(
              (actor) => actor.id === cohortAllocation.actorId,
            );

            if (!currentActor) {
              throw new Error("Actor not found");
            }

            const targetActor = targetPersonActors.filter(
              (actor) =>
                actor.locationId === currentActor.locationId &&
                actor.type === currentActor.type,
            );

            if (targetActor.length !== 1) {
              throw new Error("Target actor not found");
            }

            await tx
              .update(s.cohortAllocation)
              // biome-ignore lint/style/noNonNullAssertion: intentional
              .set({ actorId: targetActor[0]!.id })
              .where(eq(s.cohortAllocation.id, cohortAllocation.id));
          }

          // ── Repoint counterparty actor refs ────────────────────────
          //
          // The cohort_allocation.actor_id repointing above was a
          // special case — it walked one table and matched per-row. In
          // practice many other tables also reference an actor.id as a
          // counterparty (instructor of someone else's allocation,
          // creator of a PVB event, etc). Without repointing them too,
          // the source-actor `tx.delete(s.actor)` below would trip a
          // FK violation and roll the merge back.
          //
          // Generalize: build a sourceActorId → targetActorId map
          // (matched by type + locationId), then issue per-source
          // UPDATEs across every table that holds a counterparty
          // reference. Per-source loops keep the SQL trivial; in the
          // merge call site there are typically a handful of source
          // actors, so the roundtrip cost is negligible.
          const actorIdMap = new Map<string, string>();
          for (const sourceActor of actors) {
            const matches = targetPersonActors.filter(
              (a) =>
                a.locationId === sourceActor.locationId &&
                a.type === sourceActor.type,
            );
            if (matches.length === 1 && matches[0]) {
              actorIdMap.set(sourceActor.id, matches[0].id);
            }
          }

          for (const [srcActorId, tgtActorId] of actorIdMap) {
            // cohort_allocation.instructor_id — instructor for someone
            // else's allocation (counterparty to the student).
            await tx
              .update(s.cohortAllocation)
              .set({ instructorId: tgtActorId })
              .where(eq(s.cohortAllocation.instructorId, srcActorId));

            // media.actor_id — author/uploader.
            await tx
              .update(s.media)
              .set({ actorId: tgtActorId })
              .where(eq(s.media.actorId, srcActorId));

            // KSS qualification — recorder of the qualification.
            await tx
              .update(s.persoonKwalificatie)
              .set({ toegevoegdDoor: tgtActorId })
              .where(eq(s.persoonKwalificatie.toegevoegdDoor, srcActorId));

            // PVB audit-trail tables — actor that triggered the event/
            // status change. None of these have unique constraints on
            // `aangemaakt_door`, so a plain UPDATE is safe even if the
            // source actor's events end up adjacent to target's.
            await tx
              .update(s.pvbAanvraagStatus)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbAanvraagStatus.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbGebeurtenis)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbGebeurtenis.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbLeercoachToestemming)
              .set({ aangemaaktDoor: tgtActorId })
              .where(eq(s.pvbLeercoachToestemming.aangemaaktDoor, srcActorId));
            await tx
              .update(s.pvbBeoordelaarBeschikbaarheidStatus)
              .set({ aangemaaktDoor: tgtActorId })
              .where(
                eq(
                  s.pvbBeoordelaarBeschikbaarheidStatus.aangemaaktDoor,
                  srcActorId,
                ),
              );
          }

          await tx.delete(s.actor).where(eq(s.actor.personId, input.personId));
        }

        // Conflict detection runs LIVE-only on both sides:
        //   - A soft-deleted target curriculum at the same
        //     (curriculumId, gearTypeId) as a live source curriculum
        //     used to be picked up as a "conflict", which buried
        //     source's live data behind the deleted target. The partial
        //     unique index (`student_curriculum_unq_identity_gear_curriculum
        //     WHERE deleted_at IS NULL`) lets us safely UPDATE the
        //     source's personId to the target without colliding.
        //   - A soft-deleted source curriculum still references
        //     `source.person_id` via `student_curriculum_link_person_id_fk`,
        //     so it must ALSO migrate to the target — otherwise the
        //     end-of-merge `tx.delete(s.person)` trips an FK violation
        //     and rolls the whole merge back. The migration is a plain
        //     UPDATE; the deleted row stays deleted, just under the
        //     target person's id.
        //
        // So we load source curricula in two buckets (live, deleted),
        // load only LIVE target curricula (deleted target is invisible
        // by design), match by identity LIVE×LIVE only, and migrate
        // the rest by personId UPDATE.
        const allSourceStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
            deletedAt: s.studentCurriculum.deletedAt,
          })
          .from(s.studentCurriculum)
          .where(eq(s.studentCurriculum.personId, input.personId));
        const sourceStudentCurricula = allSourceStudentCurricula.filter(
          (c) => c.deletedAt == null,
        );
        const deletedSourceStudentCurriculumIds = allSourceStudentCurricula
          .filter((c) => c.deletedAt != null)
          .map((c) => c.id);

        const targetStudentCurricula = await tx
          .select({
            id: s.studentCurriculum.id,
            curriculumId: s.studentCurriculum.curriculumId,
            gearTypeId: s.studentCurriculum.gearTypeId,
            createdAt: s.studentCurriculum.createdAt,
          })
          .from(s.studentCurriculum)
          .where(
            and(
              eq(s.studentCurriculum.personId, input.targetPersonId),
              isNull(s.studentCurriculum.deletedAt),
            ),
          );

        const targetCurriculumByIdentity = new Map<
          string,
          {
            id: string;
            curriculumId: string;
            gearTypeId: string;
            createdAt: string;
          }
        >(
          targetStudentCurricula.map((curriculum) => [
            `${curriculum.curriculumId}:${curriculum.gearTypeId}`,
            curriculum,
          ]),
        );

        const conflictingCurriculumPairs: {
          sourceStudentCurriculumId: string;
          targetStudentCurriculumId: string;
        }[] = [];

        // Soft-deleted source curricula skip conflict detection (their
        // "live" identity slot is already empty per the partial index)
        // and just migrate by personId.
        const nonConflictingStudentCurriculumIds: string[] = [
          ...deletedSourceStudentCurriculumIds,
        ];

        for (const sourceStudentCurriculum of sourceStudentCurricula) {
          const matchingTargetStudentCurriculum =
            targetCurriculumByIdentity.get(
              `${sourceStudentCurriculum.curriculumId}:${sourceStudentCurriculum.gearTypeId}`,
            );

          if (!matchingTargetStudentCurriculum) {
            nonConflictingStudentCurriculumIds.push(sourceStudentCurriculum.id);
            continue;
          }

          conflictingCurriculumPairs.push({
            sourceStudentCurriculumId: sourceStudentCurriculum.id,
            targetStudentCurriculumId: matchingTargetStudentCurriculum.id,
          });
        }

        if (nonConflictingStudentCurriculumIds.length > 0) {
          await tx
            .update(s.studentCurriculum)
            .set({
              personId: input.targetPersonId,
            })
            .where(
              inArray(
                s.studentCurriculum.id,
                nonConflictingStudentCurriculumIds,
              ),
            );
        }

        for (const {
          sourceStudentCurriculumId,
          targetStudentCurriculumId,
        } of conflictingCurriculumPairs) {
          const targetCompletedCompetencies = await tx
            .select({
              competencyId: s.studentCompletedCompetency.competencyId,
            })
            .from(s.studentCompletedCompetency)
            .where(
              and(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  targetStudentCurriculumId,
                ),
                eq(
                  s.studentCompletedCompetency.isMergeConflictDuplicate,
                  false,
                ),
                isNull(s.studentCompletedCompetency.deletedAt),
              ),
            );

          if (targetCompletedCompetencies.length > 0) {
            await tx
              .update(s.studentCompletedCompetency)
              .set({
                isMergeConflictDuplicate: true,
              })
              .where(
                and(
                  eq(
                    s.studentCompletedCompetency.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  inArray(
                    s.studentCompletedCompetency.competencyId,
                    targetCompletedCompetencies.map(
                      (competency) => competency.competencyId,
                    ),
                  ),
                  isNull(s.studentCompletedCompetency.deletedAt),
                ),
              );
          }

          await Promise.all([
            tx
              .update(s.studentCompletedCompetency)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(
                  s.studentCompletedCompetency.studentCurriculumId,
                  sourceStudentCurriculumId,
                ),
              ),
            tx
              .update(s.certificate)
              .set({
                studentCurriculumId: targetStudentCurriculumId,
              })
              .where(
                eq(
                  s.certificate.studentCurriculumId,
                  sourceStudentCurriculumId,
                ),
              ),
          ]);

          const [sourceAllocations, targetAllocations] = await Promise.all([
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    sourceStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
            tx
              .select({
                id: s.cohortAllocation.id,
                cohortId: s.cohortAllocation.cohortId,
                actorId: s.cohortAllocation.actorId,
                createdAt: s.cohortAllocation.createdAt,
              })
              .from(s.cohortAllocation)
              .where(
                and(
                  eq(
                    s.cohortAllocation.studentCurriculumId,
                    targetStudentCurriculumId,
                  ),
                  isNull(s.cohortAllocation.deletedAt),
                ),
              ),
          ]);

          const targetAllocationByIdentity = new Map<
            string,
            {
              id: string;
              cohortId: string;
              actorId: string;
              createdAt: string;
            }
          >(
            targetAllocations.map((allocation) => [
              `${allocation.cohortId}:${allocation.actorId}`,
              allocation,
            ]),
          );

          for (const sourceAllocation of sourceAllocations) {
            const collidingTargetAllocation = targetAllocationByIdentity.get(
              `${sourceAllocation.cohortId}:${sourceAllocation.actorId}`,
            );

            if (!collidingTargetAllocation) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, sourceAllocation.id));
              continue;
            }

            const [sourceHasLinkedCertificates, targetHasLinkedCertificates] =
              await Promise.all([
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(s.certificate.cohortAllocationId, sourceAllocation.id),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
                tx
                  .select({
                    count: countDistinct(s.certificate.id),
                  })
                  .from(s.certificate)
                  .where(
                    and(
                      eq(
                        s.certificate.cohortAllocationId,
                        collidingTargetAllocation.id,
                      ),
                      isNull(s.certificate.deletedAt),
                    ),
                  )
                  .then((rows) => Number(rows[0]?.count ?? 0) > 0),
              ]);

            let winnerAllocation = sourceAllocation;
            let loserAllocation = collidingTargetAllocation;

            if (sourceHasLinkedCertificates !== targetHasLinkedCertificates) {
              if (targetHasLinkedCertificates) {
                winnerAllocation = collidingTargetAllocation;
                loserAllocation = sourceAllocation;
              }
            } else if (
              dayjs(sourceAllocation.createdAt).isAfter(
                collidingTargetAllocation.createdAt,
              ) ||
              (dayjs(sourceAllocation.createdAt).isSame(
                collidingTargetAllocation.createdAt,
              ) &&
                sourceAllocation.id > collidingTargetAllocation.id)
            ) {
              winnerAllocation = collidingTargetAllocation;
              loserAllocation = sourceAllocation;
            }

            const winnerProgressCompetencies = await tx
              .selectDistinct({
                competencyId: s.studentCohortProgress.competencyId,
              })
              .from(s.studentCohortProgress)
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  winnerAllocation.id,
                ),
              );

            if (winnerProgressCompetencies.length > 0) {
              await tx.delete(s.studentCohortProgress).where(
                and(
                  eq(
                    s.studentCohortProgress.cohortAllocationId,
                    loserAllocation.id,
                  ),
                  inArray(
                    s.studentCohortProgress.competencyId,
                    winnerProgressCompetencies.map(
                      (competency) => competency.competencyId,
                    ),
                  ),
                ),
              );
            }

            await tx
              .update(s.studentCohortProgress)
              .set({
                cohortAllocationId: winnerAllocation.id,
              })
              .where(
                eq(
                  s.studentCohortProgress.cohortAllocationId,
                  loserAllocation.id,
                ),
              );

            await Promise.all([
              tx
                .update(s.certificate)
                .set({
                  cohortAllocationId: null,
                })
                .where(
                  and(
                    eq(s.certificate.cohortAllocationId, loserAllocation.id),
                    isNull(s.certificate.deletedAt),
                  ),
                ),
              tx
                .update(s.cohortAllocation)
                .set({
                  deletedAt: new Date().toISOString(),
                  updatedAt: sql`NOW()`,
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, loserAllocation.id)),
            ]);

            if (winnerAllocation.id === sourceAllocation.id) {
              await tx
                .update(s.cohortAllocation)
                .set({
                  studentCurriculumId: targetStudentCurriculumId,
                })
                .where(eq(s.cohortAllocation.id, winnerAllocation.id));
            }
          }

          await tx
            .update(s.cohortAllocation)
            .set({
              studentCurriculumId: targetStudentCurriculumId,
            })
            .where(
              eq(
                s.cohortAllocation.studentCurriculumId,
                sourceStudentCurriculumId,
              ),
            );

          await tx
            .delete(s.studentCurriculum)
            .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId));
        }

        await Promise.all([
          // Transfer location links
          (async () => {
            const links = await tx
              .select()
              .from(s.personLocationLink)
              .where(eq(s.personLocationLink.personId, input.personId));

            if (links.length > 0) {
              await tx
                .delete(s.personLocationLink)
                .where(eq(s.personLocationLink.personId, input.personId));

              await tx
                .insert(s.personLocationLink)
                .values(
                  links.map((link) => ({
                    ...link,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          tx
            .update(s.externalCertificate)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.externalCertificate.personId, input.personId)),

          tx
            .update(s.logbook)
            .set({
              personId: input.targetPersonId,
            })
            .where(eq(s.logbook.personId, input.personId)),

          tx
            .update(s.studentCohortProgress)
            .set({
              createdBy: input.targetPersonId,
            })
            .where(eq(s.studentCohortProgress.createdBy, input.personId)),

          // Transfer person roles (PK: personId + roleId)
          (async () => {
            const roles = await tx
              .select()
              .from(s.personRole)
              .where(eq(s.personRole.personId, input.personId));

            if (roles.length > 0) {
              await tx
                .delete(s.personRole)
                .where(eq(s.personRole.personId, input.personId));

              await tx
                .insert(s.personRole)
                .values(
                  roles.map((role) => ({
                    ...role,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),

          // Transfer KSS qualifications (unique: personId + courseId + kerntaakOnderdeelId)
          (async () => {
            const kwalificaties = await tx
              .select()
              .from(s.persoonKwalificatie)
              .where(eq(s.persoonKwalificatie.personId, input.personId));

            if (kwalificaties.length > 0) {
              await tx
                .delete(s.persoonKwalificatie)
                .where(eq(s.persoonKwalificatie.personId, input.personId));

              await tx
                .insert(s.persoonKwalificatie)
                .values(
                  kwalificaties.map((kwalificatie) => ({
                    ...kwalificatie,
                    id: undefined,
                    personId: input.targetPersonId,
                  })),
                )
                .onConflictDoNothing();
            }
          })(),
        ]);

        // Handle isPrimary constraint before delete
        const duplicatePerson = persons.find((p) => p.id === input.personId);

        if (duplicatePerson?.isPrimary && duplicatePerson?.userId) {
          // FIRST: Unset isPrimary on the person we're about to delete
          // This avoids constraint violation if we try to set another as primary first
          await tx
            .update(s.person)
            .set({ isPrimary: false, updatedAt: sql`NOW()` })
            .where(eq(s.person.id, input.personId));

          // THEN: Find another person for this user to make primary
          const otherPerson = await tx
            .select({ id: s.person.id })
            .from(s.person)
            .where(
              and(
                eq(s.person.userId, duplicatePerson.userId),
                ne(s.person.id, input.personId),
                isNull(s.person.deletedAt),
              ),
            )
            .limit(1)
            .then((rows) => rows[0]);

          if (otherPerson) {
            await tx
              .update(s.person)
              .set({ isPrimary: true, updatedAt: sql`NOW()` })
              .where(eq(s.person.id, otherPerson.id));
          }
          // If no other person exists, user account becomes orphaned (accepted risk)
        }

        // ── Repoint person counterparty FKs across the KSS schema ──
        //
        // PVB tables hold person-level references for kandidaat /
        // beoordelaar / leercoach roles. If the source person was any
        // of those on someone else's record, the row still references
        // source.id at this point — and the `tx.delete(s.person)` below
        // would trip a FK violation. Migrate them to target.
        //
        // For tables with a unique constraint that includes the
        // migrated column (just `pvb_onderdeel`), we delete the source-
        // side rows that would conflict with target's existing rows
        // first. The "duplicate" is precisely a same-human scenario
        // (source and target are merging exactly because they're the
        // same human) so the delete drops a redundant record, not real
        // information.
        await tx
          .update(s.pvbAanvraag)
          .set({ kandidaatId: input.targetPersonId })
          .where(eq(s.pvbAanvraag.kandidaatId, input.personId));

        // pvb_onderdeel.beoordelaar_id has unique on
        // (pvb_aanvraag_id, kerntaak_onderdeel_id, beoordelaar_id).
        // Drop source-side rows that would collide with existing
        // target-side rows on the same (aanvraag, kerntaak_onderdeel)
        // pair, then migrate the rest.
        await tx.execute(sql`
          DELETE FROM ${s.pvbOnderdeel}
          WHERE ${s.pvbOnderdeel.beoordelaarId} = ${input.personId}
            AND (${s.pvbOnderdeel.pvbAanvraagId}, ${s.pvbOnderdeel.kerntaakOnderdeelId}) IN (
              SELECT ${s.pvbOnderdeel.pvbAanvraagId}, ${s.pvbOnderdeel.kerntaakOnderdeelId}
              FROM ${s.pvbOnderdeel}
              WHERE ${s.pvbOnderdeel.beoordelaarId} = ${input.targetPersonId}
            )
        `);
        await tx
          .update(s.pvbOnderdeel)
          .set({ beoordelaarId: input.targetPersonId })
          .where(eq(s.pvbOnderdeel.beoordelaarId, input.personId));

        // pvb_beoordelaar_beschikbaarheid.beoordelaar_id — no unique
        // constraint on the column, plain UPDATE.
        await tx
          .update(s.pvbBeoordelaarBeschikbaarheid)
          .set({ beoordelaarId: input.targetPersonId })
          .where(
            eq(s.pvbBeoordelaarBeschikbaarheid.beoordelaarId, input.personId),
          );

        // pvb_leercoach_toestemming.leercoach_id — no unique on column.
        await tx
          .update(s.pvbLeercoachToestemming)
          .set({ leercoachId: input.targetPersonId })
          .where(eq(s.pvbLeercoachToestemming.leercoachId, input.personId));

        await tx.delete(s.person).where(eq(s.person.id, input.personId));
      });
    },
  ),
);

export { DuplicateScoring };
