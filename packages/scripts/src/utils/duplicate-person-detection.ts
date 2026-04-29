import type { Database } from "@nawadi/db";
import { type SQL, sql } from "drizzle-orm";

export const DEFAULT_ANALYZE_THRESHOLD = 100;
export const DEFAULT_MERGE_THRESHOLD = 150;
export const DEFAULT_AUTO_MERGE_THRESHOLD = 180;
export const DEFAULT_LIMIT = 1000;

export type DuplicatePerson = {
  id: string;
  handle: string | null;
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  fullName: string;
  email: string | null;
  userId: string | null;
  isPrimary: boolean;
  dateOfBirth: string | null;
  birthCity: string | null;
  createdAt: Date;
};

export type DuplicatePersonPair = {
  score: number;
  matchReasons: string[];
  riskFlags: string[];
  persons: [DuplicatePerson, DuplicatePerson];
};

type DuplicatePersonRow = {
  id1: string;
  handle1: string | null;
  first_name1: string;
  last_name1: string | null;
  last_name_prefix1: string | null;
  full_name1: string;
  email1: string | null;
  user_id1: string | null;
  is_primary1: boolean;
  date_of_birth1: string | null;
  birth_city1: string | null;
  created_at1: Date;
  id2: string;
  handle2: string | null;
  first_name2: string;
  last_name2: string | null;
  last_name_prefix2: string | null;
  full_name2: string;
  email2: string | null;
  user_id2: string | null;
  is_primary2: boolean;
  date_of_birth2: string | null;
  birth_city2: string | null;
  created_at2: Date;
  score: number | string;
  same_user: boolean;
  same_first_name: boolean;
  similar_first_name: boolean;
  same_last_name: boolean;
  same_birth_date: boolean;
  close_birth_date: boolean;
  same_birth_city: boolean;
};

export function buildDuplicatePersonQuery(args: {
  threshold: number;
  limit: number;
  cohortId?: string;
}): SQL {
  const cohortCandidateFilter = args.cohortId
    ? sql`
        AND (
          EXISTS (
            SELECT 1
            FROM cohort_person_ids cpi
            WHERE cpi.id = p.id
          )
          OR EXISTS (
            SELECT 1
            FROM cohort_persons cp
            WHERE cp.id <> p.id
              AND cp.user_id IS NOT NULL
              AND cp.user_id = p.user_id
          )
          OR EXISTS (
            SELECT 1
            FROM cohort_persons cp
            WHERE cp.id <> p.id
              AND cp.date_of_birth IS NOT NULL
              AND p.date_of_birth IS NOT NULL
              AND ABS(cp.date_of_birth::date - p.date_of_birth::date) <= 365
          )
        )
      `
    : sql``;
  const scopedPairFilter = args.cohortId
    ? sql`AND (p1.in_scope OR p2.in_scope)`
    : sql``;

  return sql`
    WITH cohort_person_ids AS (
      ${
        args.cohortId
          ? sql`
              SELECT DISTINCT a.person_id AS id
              FROM cohort_allocation ca
              INNER JOIN actor a ON a.id = ca.actor_id
              INNER JOIN cohort c ON c.id = ca.cohort_id
              WHERE ca.cohort_id = ${args.cohortId}
                AND ca.deleted_at IS NULL
                AND a.deleted_at IS NULL
                AND a.person_id IS NOT NULL
                AND c.deleted_at IS NULL
            `
          : sql`SELECT NULL::uuid AS id WHERE FALSE`
      }
    ),
    cohort_persons AS (
      SELECT
        p.id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.last_name_prefix,
        p.date_of_birth
      FROM person p
      INNER JOIN cohort_person_ids cpi ON cpi.id = p.id
      WHERE p.deleted_at IS NULL
        AND p.first_name IS NOT NULL
    ),
    normalized_persons AS (
      SELECT
        p.id,
        p.handle,
        p.user_id,
        p.first_name,
        p.last_name,
        p.last_name_prefix,
        p.date_of_birth,
        p.birth_city,
        p.is_primary,
        p.created_at,
        p.deleted_at,
        u.email,
        EXISTS (
          SELECT 1
          FROM cohort_person_ids cpi
          WHERE cpi.id = p.id
        ) AS in_scope,
        TRIM(CONCAT(
          COALESCE(p.first_name, ''),
          ' ',
          COALESCE(p.last_name_prefix, ''),
          CASE WHEN p.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
          COALESCE(p.last_name, '')
        )) AS full_name,
        LOWER(REGEXP_REPLACE(COALESCE(p.first_name, ''), '[^[:alnum:]]+', '', 'g')) AS first_norm,
        LOWER(REGEXP_REPLACE(COALESCE(p.last_name, ''), '[^[:alnum:]]+', '', 'g')) AS last_norm,
        LOWER(REGEXP_REPLACE(TRIM(CONCAT(
          COALESCE(p.last_name_prefix, ''),
          CASE WHEN p.last_name_prefix IS NOT NULL THEN ' ' ELSE '' END,
          COALESCE(p.last_name, '')
        )), '[^[:alnum:]]+', '', 'g')) AS full_last_norm,
        LOWER(REGEXP_REPLACE(COALESCE(p.birth_city, ''), '[^[:alnum:]]+', '', 'g')) AS birth_city_norm
      FROM person p
      LEFT JOIN "user" u ON p.user_id = u.auth_user_id
      WHERE p.deleted_at IS NULL
        AND p.first_name IS NOT NULL
        ${cohortCandidateFilter}
    ),
    same_user_matches AS (
      SELECT
        p1.id AS id1,
        p1.handle AS handle1,
        p1.first_name AS first_name1,
        p1.last_name AS last_name1,
        p1.last_name_prefix AS last_name_prefix1,
        p1.full_name AS full_name1,
        p1.email AS email1,
        p1.user_id AS user_id1,
        p1.is_primary AS is_primary1,
        p1.date_of_birth AS date_of_birth1,
        p1.birth_city AS birth_city1,
        p1.created_at AS created_at1,
        p2.id AS id2,
        p2.handle AS handle2,
        p2.first_name AS first_name2,
        p2.last_name AS last_name2,
        p2.last_name_prefix AS last_name_prefix2,
        p2.full_name AS full_name2,
        p2.email AS email2,
        p2.user_id AS user_id2,
        p2.is_primary AS is_primary2,
        p2.date_of_birth AS date_of_birth2,
        p2.birth_city AS birth_city2,
        p2.created_at AS created_at2,
        TRUE AS same_user,
        p1.first_norm = p2.first_norm AS same_first_name,
        LEFT(p1.first_norm, 3) = LEFT(p2.first_norm, 3) AS similar_first_name,
        p1.full_last_norm = p2.full_last_norm OR p1.last_norm = p2.last_norm AS same_last_name,
        p1.date_of_birth IS NOT NULL
          AND p1.date_of_birth = p2.date_of_birth AS same_birth_date,
        p1.date_of_birth IS NOT NULL
          AND p2.date_of_birth IS NOT NULL
          AND ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 7 AS close_birth_date,
        p1.birth_city_norm <> ''
          AND p1.birth_city_norm = p2.birth_city_norm AS same_birth_city,
        50 +
        CASE
          WHEN p1.first_norm = p2.first_norm THEN 50
          WHEN LENGTH(p1.first_norm) >= 3
            AND LENGTH(p2.first_norm) >= 3
            AND LEFT(p1.first_norm, 3) = LEFT(p2.first_norm, 3) THEN 20
          ELSE 0
        END +
        CASE
          WHEN p1.full_last_norm <> '' AND p1.full_last_norm = p2.full_last_norm THEN 50
          WHEN p1.last_norm <> '' AND p1.last_norm = p2.last_norm THEN 40
          ELSE 0
        END +
        CASE
          WHEN p1.date_of_birth IS NOT NULL AND p1.date_of_birth = p2.date_of_birth THEN 50
          WHEN p1.date_of_birth IS NOT NULL
            AND p2.date_of_birth IS NOT NULL
            AND ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 1 THEN 40
          WHEN p1.date_of_birth IS NOT NULL
            AND p2.date_of_birth IS NOT NULL
            AND ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 7 THEN 30
          WHEN p1.date_of_birth IS NOT NULL
            AND p2.date_of_birth IS NOT NULL
            AND EXTRACT(YEAR FROM p1.date_of_birth::date) = EXTRACT(YEAR FROM p2.date_of_birth::date) THEN 20
          ELSE 0
        END +
        CASE
          WHEN p1.birth_city_norm <> '' AND p1.birth_city_norm = p2.birth_city_norm THEN 10
          ELSE 0
        END AS score
      FROM normalized_persons p1
      JOIN normalized_persons p2 ON p1.user_id = p2.user_id
        AND p1.id < p2.id
        ${scopedPairFilter}
      WHERE p1.user_id IS NOT NULL
        AND (
          p1.first_norm = p2.first_norm
          OR (
            LENGTH(p1.first_norm) >= 3
            AND LENGTH(p2.first_norm) >= 3
            AND LEFT(p1.first_norm, 3) = LEFT(p2.first_norm, 3)
          )
        )
    ),
    name_birth_matches AS (
      SELECT
        p1.id AS id1,
        p1.handle AS handle1,
        p1.first_name AS first_name1,
        p1.last_name AS last_name1,
        p1.last_name_prefix AS last_name_prefix1,
        p1.full_name AS full_name1,
        p1.email AS email1,
        p1.user_id AS user_id1,
        p1.is_primary AS is_primary1,
        p1.date_of_birth AS date_of_birth1,
        p1.birth_city AS birth_city1,
        p1.created_at AS created_at1,
        p2.id AS id2,
        p2.handle AS handle2,
        p2.first_name AS first_name2,
        p2.last_name AS last_name2,
        p2.last_name_prefix AS last_name_prefix2,
        p2.full_name AS full_name2,
        p2.email AS email2,
        p2.user_id AS user_id2,
        p2.is_primary AS is_primary2,
        p2.date_of_birth AS date_of_birth2,
        p2.birth_city AS birth_city2,
        p2.created_at AS created_at2,
        p1.user_id IS NOT NULL AND p1.user_id = p2.user_id AS same_user,
        p1.first_norm = p2.first_norm AS same_first_name,
        FALSE AS similar_first_name,
        p1.full_last_norm = p2.full_last_norm OR p1.last_norm = p2.last_norm AS same_last_name,
        p1.date_of_birth = p2.date_of_birth AS same_birth_date,
        ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 7 AS close_birth_date,
        p1.birth_city_norm <> ''
          AND p1.birth_city_norm = p2.birth_city_norm AS same_birth_city,
        50 +
        CASE
          WHEN p1.date_of_birth = p2.date_of_birth THEN 30
          ELSE 0
        END +
        CASE
          WHEN p1.full_last_norm <> '' AND p1.full_last_norm = p2.full_last_norm THEN 60
          ELSE 50
        END +
        CASE
          WHEN p1.date_of_birth = p2.date_of_birth THEN 60
          WHEN ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 1 THEN 45
          WHEN ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 7 THEN 35
          WHEN EXTRACT(YEAR FROM p1.date_of_birth::date) = EXTRACT(YEAR FROM p2.date_of_birth::date) THEN 25
          WHEN ABS(EXTRACT(YEAR FROM p1.date_of_birth::date) - EXTRACT(YEAR FROM p2.date_of_birth::date)) = 1 THEN 15
          ELSE 0
        END +
        CASE
          WHEN p1.birth_city_norm <> '' AND p1.birth_city_norm = p2.birth_city_norm THEN 10
          ELSE 0
        END AS score
      FROM normalized_persons p1
      JOIN normalized_persons p2 ON p1.id < p2.id
        ${scopedPairFilter}
        AND p1.first_norm <> ''
        AND p1.first_norm = p2.first_norm
        AND (
          p1.full_last_norm <> '' AND p1.full_last_norm = p2.full_last_norm
          OR p1.last_norm <> '' AND p1.last_norm = p2.last_norm
        )
        AND p1.date_of_birth IS NOT NULL
        AND p2.date_of_birth IS NOT NULL
        AND ABS(p1.date_of_birth::date - p2.date_of_birth::date) <= 365
      WHERE p1.user_id IS DISTINCT FROM p2.user_id
    ),
    all_matches AS (
      SELECT * FROM same_user_matches
      UNION ALL
      SELECT * FROM name_birth_matches
    ),
    ranked_matches AS (
      SELECT
        *,
        ROW_NUMBER() OVER (
          PARTITION BY LEAST(id1, id2), GREATEST(id1, id2)
          ORDER BY score DESC
        ) AS pair_rank
      FROM all_matches
      WHERE score >= ${args.threshold}
    )
    SELECT *
    FROM ranked_matches
    WHERE pair_rank = 1
    ORDER BY score DESC, created_at1 ASC
    LIMIT ${args.limit}
  `;
}

export async function findDuplicatePersonPairs(
  database: Database,
  args: {
    threshold?: number;
    limit?: number;
    cohortId?: string;
  } = {},
): Promise<DuplicatePersonPair[]> {
  const threshold = args.threshold ?? DEFAULT_ANALYZE_THRESHOLD;
  const limit = args.limit ?? DEFAULT_LIMIT;
  const result = await database.execute(
    buildDuplicatePersonQuery({ threshold, limit, cohortId: args.cohortId }),
  );

  return (result.rows as unknown as DuplicatePersonRow[]).map(mapRowToPair);
}

export async function countCohortPersons(
  database: Database,
  cohortId: string,
): Promise<number> {
  const result = await database.execute(sql`
    SELECT COUNT(DISTINCT a.person_id)::int AS count
    FROM cohort_allocation ca
    INNER JOIN actor a ON a.id = ca.actor_id
    INNER JOIN cohort c ON c.id = ca.cohort_id
    INNER JOIN person p ON p.id = a.person_id
    WHERE ca.cohort_id = ${cohortId}
      AND ca.deleted_at IS NULL
      AND a.deleted_at IS NULL
      AND a.person_id IS NOT NULL
      AND c.deleted_at IS NULL
      AND p.deleted_at IS NULL
  `);

  const row = result.rows[0] as { count?: number | string } | undefined;
  return Number(row?.count ?? 0);
}

export function chooseDefaultMerge(pair: DuplicatePersonPair): {
  keep: 0 | 1;
  merge: 0 | 1;
  reason: string;
} {
  const [first, second] = pair.persons;

  if (first.userId && !second.userId) {
    return { keep: 0, merge: 1, reason: "record 1 has a linked user" };
  }

  if (!first.userId && second.userId) {
    return { keep: 1, merge: 0, reason: "record 2 has a linked user" };
  }

  if (first.isPrimary && !second.isPrimary) {
    return { keep: 0, merge: 1, reason: "record 1 is primary" };
  }

  if (!first.isPrimary && second.isPrimary) {
    return { keep: 1, merge: 0, reason: "record 2 is primary" };
  }

  if (first.email && !second.email) {
    return { keep: 0, merge: 1, reason: "record 1 has an email" };
  }

  if (!first.email && second.email) {
    return { keep: 1, merge: 0, reason: "record 2 has an email" };
  }

  if (first.createdAt <= second.createdAt) {
    return { keep: 0, merge: 1, reason: "record 1 is older" };
  }

  return { keep: 1, merge: 0, reason: "record 2 is older" };
}

export function isAutoMergeSafe(
  pair: DuplicatePersonPair,
  autoMergeThreshold = DEFAULT_AUTO_MERGE_THRESHOLD,
): { safe: boolean; reason: string } {
  if (pair.score < autoMergeThreshold) {
    return {
      safe: false,
      reason: `score below auto threshold ${autoMergeThreshold}`,
    };
  }

  const [first, second] = pair.persons;
  if (first.userId && second.userId && first.userId !== second.userId) {
    return {
      safe: false,
      reason: "different linked users require manual review",
    };
  }

  if (!pair.matchReasons.includes("same birth date")) {
    return {
      safe: false,
      reason: "birth date is not an exact match",
    };
  }

  if (!pair.matchReasons.includes("same first name")) {
    return {
      safe: false,
      reason: "first name is not an exact match",
    };
  }

  return { safe: true, reason: "score and identity signals are strong" };
}

export function formatPerson(person: DuplicatePerson): string {
  const handle = person.handle ? `@${person.handle}` : "no handle";
  const dob = person.dateOfBirth ?? "no DOB";
  const email = person.email ?? "no email";
  const primary = person.isPrimary ? "primary" : "not primary";

  return `${person.fullName} (${dob}) ${handle} [${email}, ${primary}] ${person.id}`;
}

function mapRowToPair(row: DuplicatePersonRow): DuplicatePersonPair {
  const pair: DuplicatePersonPair = {
    score: Number(row.score),
    matchReasons: buildMatchReasons(row),
    riskFlags: buildRiskFlags(row),
    persons: [
      {
        id: row.id1,
        handle: row.handle1,
        firstName: row.first_name1,
        lastName: row.last_name1,
        lastNamePrefix: row.last_name_prefix1,
        fullName: row.full_name1,
        email: row.email1,
        userId: row.user_id1,
        isPrimary: row.is_primary1,
        dateOfBirth: row.date_of_birth1,
        birthCity: row.birth_city1,
        createdAt: new Date(row.created_at1),
      },
      {
        id: row.id2,
        handle: row.handle2,
        firstName: row.first_name2,
        lastName: row.last_name2,
        lastNamePrefix: row.last_name_prefix2,
        fullName: row.full_name2,
        email: row.email2,
        userId: row.user_id2,
        isPrimary: row.is_primary2,
        dateOfBirth: row.date_of_birth2,
        birthCity: row.birth_city2,
        createdAt: new Date(row.created_at2),
      },
    ],
  };

  return pair;
}

function buildMatchReasons(row: DuplicatePersonRow): string[] {
  const reasons: string[] = [];

  if (row.same_user) reasons.push("same linked user");
  if (row.same_first_name) reasons.push("same first name");
  else if (row.similar_first_name) reasons.push("similar first name");
  if (row.same_last_name) reasons.push("same last name");
  if (row.same_birth_date) reasons.push("same birth date");
  else if (row.close_birth_date) reasons.push("close birth date");
  if (row.same_birth_city) reasons.push("same birth city");

  return reasons;
}

function buildRiskFlags(row: DuplicatePersonRow): string[] {
  const flags: string[] = [];
  const hasDifferentLinkedUsers = Boolean(
    row.user_id1 && row.user_id2 && row.user_id1 !== row.user_id2,
  );

  if (hasDifferentLinkedUsers) {
    flags.push("different linked users");
  }

  if (row.date_of_birth1 && row.date_of_birth2) {
    if (row.date_of_birth1 !== row.date_of_birth2) {
      flags.push("birth date differs");
    }
  } else {
    flags.push("missing birth date");
  }

  if (
    !hasDifferentLinkedUsers &&
    row.email1 &&
    row.email2 &&
    row.email1 !== row.email2
  ) {
    flags.push("different emails");
  }

  if (row.is_primary1 && row.is_primary2) {
    flags.push("both records are primary");
  }

  return flags;
}
