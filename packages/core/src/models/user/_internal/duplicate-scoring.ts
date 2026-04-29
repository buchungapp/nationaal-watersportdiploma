import { type SQL, sql } from "drizzle-orm";

/**
 * Score thresholds for surfacing duplicate-person candidates to operators.
 *
 * Bands:
 *   <weak     : not surfaced at all
 *   weak..    : "Mogelijk dezelfde persoon" — show, no preselection
 *   strong..  : "Waarschijnlijk dezelfde persoon" — show, preselect "use existing"
 *   perfect.. : exact-match feel; still no preselection (twin guard)
 *
 * These are the v1 numbers carried over from the analyze-duplicate-persons
 * script. They will likely shift when pg_trgm lands and similarity replaces
 * LEFT(x, 3). Do not change without updating the calibration TODO.
 */
export const SCORE_THRESHOLDS = {
  weak: 100,
  strong: 150,
  perfect: 200,
} as const;

/**
 * Hand-off identifiers from the existing detection script. Kept here so the
 * script and any new caller stay in sync on what the analyze pipeline uses.
 */
export const DEFAULT_ANALYZE_THRESHOLD = 100;
export const DEFAULT_MERGE_THRESHOLD = 150;
export const DEFAULT_AUTO_MERGE_THRESHOLD = 180;

/**
 * The set of normalized columns a scoring expression expects to read from.
 * Callers populate these from the same CTE that does
 *   LOWER(REGEXP_REPLACE(..., '[^[:alnum:]]+', '', 'g'))
 * pre-normalization.
 *
 * `dateOfBirth` and `birthCityNorm` may be empty strings or null in real data.
 * The predicates below guard for the empty cases explicitly.
 */
export type NormalizedPersonColumns = {
  firstNorm: SQL;
  lastNorm: SQL;
  fullLastNorm: SQL;
  dateOfBirth: SQL;
  birthCityNorm: SQL;
  userId: SQL;
};

// ─── Predicates (boolean SQL fragments) ────────────────────────────────────
//
// Pure, side-effect-free SQL expressions. Reused as both the score-CASE
// guards and the match-reason flags returned to the UI.

export const sameFirstName = (a: SQL, b: SQL) => sql<boolean>`${a} = ${b}`;

export const similarFirstNamePrefix = (a: SQL, b: SQL) =>
  sql<boolean>`LENGTH(${a}) >= 3 AND LENGTH(${b}) >= 3 AND LEFT(${a}, 3) = LEFT(${b}, 3)`;

/**
 * Loose variant of `similarFirstNamePrefix` that does NOT length-guard the
 * inputs. Kept for parity with the existing analyze-script's `similar_first_name`
 * flag, which is informational (drives a match-reason) and historically does
 * not require length ≥ 3. The score-computing variant above DOES require it.
 */
export const similarFirstNamePrefixLoose = (a: SQL, b: SQL) =>
  sql<boolean>`LEFT(${a}, 3) = LEFT(${b}, 3)`;

export const sameLastNameWithPrefix = (fullA: SQL, fullB: SQL) =>
  sql<boolean>`${fullA} <> '' AND ${fullA} = ${fullB}`;

export const sameLastNameLoose = (lastA: SQL, lastB: SQL) =>
  sql<boolean>`${lastA} <> '' AND ${lastA} = ${lastB}`;

export const sameBirthDate = (a: SQL, b: SQL) =>
  sql<boolean>`${a} IS NOT NULL AND ${a} = ${b}`;

export const closeBirthDate = (a: SQL, b: SQL, days: number) =>
  sql<boolean>`${a} IS NOT NULL AND ${b} IS NOT NULL AND ABS(${a}::date - ${b}::date) <= ${sql.raw(String(days))}`;

export const sameBirthYear = (a: SQL, b: SQL) =>
  sql<boolean>`${a} IS NOT NULL AND ${b} IS NOT NULL AND EXTRACT(YEAR FROM ${a}::date) = EXTRACT(YEAR FROM ${b}::date)`;

export const adjacentBirthYear = (a: SQL, b: SQL) =>
  sql<boolean>`${a} IS NOT NULL AND ${b} IS NOT NULL AND ABS(EXTRACT(YEAR FROM ${a}::date) - EXTRACT(YEAR FROM ${b}::date)) = 1`;

export const sameBirthCity = (a: SQL, b: SQL) =>
  sql<boolean>`${a} <> '' AND ${a} = ${b}`;

export const sameUser = (userA: SQL, userB: SQL) =>
  sql<boolean>`${userA} IS NOT NULL AND ${userA} = ${userB}`;

// ─── Per-feature score components ──────────────────────────────────────────
//
// These return SQL<number>. Weights vary across the two scoring formulas
// (same-user pair vs name-birth pair), so weights are explicit parameters.
// The composition is `base + score(feature) + score(feature) + ...`.

type FirstNameWeights = { exact: number; prefix: number };
export const scoreFirstName = (
  a: SQL,
  b: SQL,
  weights: FirstNameWeights,
) => sql<number>`
  CASE
    WHEN ${sameFirstName(a, b)} THEN ${sql.raw(String(weights.exact))}
    WHEN ${similarFirstNamePrefix(a, b)} THEN ${sql.raw(String(weights.prefix))}
    ELSE 0
  END
`;

type LastNameWeights = { withPrefix: number; loose: number };
export const scoreLastName = (
  fullA: SQL,
  fullB: SQL,
  lastA: SQL,
  lastB: SQL,
  weights: LastNameWeights,
) => sql<number>`
  CASE
    WHEN ${sameLastNameWithPrefix(fullA, fullB)} THEN ${sql.raw(String(weights.withPrefix))}
    WHEN ${sameLastNameLoose(lastA, lastB)} THEN ${sql.raw(String(weights.loose))}
    ELSE 0
  END
`;

type BirthDateWeights = {
  exact: number;
  withinOne: number;
  withinSeven: number;
  sameYear: number;
  adjacentYear?: number;
};
export const scoreBirthDate = (
  a: SQL,
  b: SQL,
  weights: BirthDateWeights,
) => sql<number>`
  CASE
    WHEN ${sameBirthDate(a, b)} THEN ${sql.raw(String(weights.exact))}
    WHEN ${closeBirthDate(a, b, 1)} THEN ${sql.raw(String(weights.withinOne))}
    WHEN ${closeBirthDate(a, b, 7)} THEN ${sql.raw(String(weights.withinSeven))}
    WHEN ${sameBirthYear(a, b)} THEN ${sql.raw(String(weights.sameYear))}
    ${
      weights.adjacentYear !== undefined
        ? sql`WHEN ${adjacentBirthYear(a, b)} THEN ${sql.raw(String(weights.adjacentYear))}`
        : sql``
    }
    ELSE 0
  END
`;

export const scoreBirthCity = (a: SQL, b: SQL, weight: number) => sql<number>`
  CASE
    WHEN ${sameBirthCity(a, b)} THEN ${sql.raw(String(weight))}
    ELSE 0
  END
`;

// ─── Total-score formulas (one per branch) ─────────────────────────────────
//
// These are the two scoring branches the analyze script uses today. They
// produce different scores for the same predicates because they fire under
// different upstream filters (same user_id vs different/missing user_id).

const SAME_USER_WEIGHTS = {
  base: 50,
  firstName: { exact: 50, prefix: 20 },
  lastName: { withPrefix: 50, loose: 40 },
  birthDate: {
    exact: 50,
    withinOne: 40,
    withinSeven: 30,
    sameYear: 20,
  },
  birthCity: 10,
} as const;

/**
 * Score for two persons with the same auth user_id. Filter the candidate join
 * upstream to `p1.user_id = p2.user_id AND p1.user_id IS NOT NULL`.
 */
export const scoreSameUserPair = (
  p1: NormalizedPersonColumns,
  p2: NormalizedPersonColumns,
) => sql<number>`
  ${sql.raw(String(SAME_USER_WEIGHTS.base))}
  + ${scoreFirstName(p1.firstNorm, p2.firstNorm, SAME_USER_WEIGHTS.firstName)}
  + ${scoreLastName(p1.fullLastNorm, p2.fullLastNorm, p1.lastNorm, p2.lastNorm, SAME_USER_WEIGHTS.lastName)}
  + ${scoreBirthDate(p1.dateOfBirth, p2.dateOfBirth, SAME_USER_WEIGHTS.birthDate)}
  + ${scoreBirthCity(p1.birthCityNorm, p2.birthCityNorm, SAME_USER_WEIGHTS.birthCity)}
`;

const NAME_BIRTH_WEIGHTS = {
  base: 50,
  sameDateBonus: 30,
  lastName: { sameWithPrefix: 60, fallback: 50 },
  birthDate: {
    exact: 60,
    withinOne: 45,
    withinSeven: 35,
    sameYear: 25,
    adjacentYear: 15,
  },
  birthCity: 10,
} as const;

/**
 * Score for two persons with different (or missing) auth user_ids that
 * already passed the upstream name+DOB candidate filter (same first name,
 * same last name in some form, DOB within 365 days). The "fallback" 50 on
 * last name is intentional: it reflects the upstream guarantee that the loose
 * last-name match held even if the prefixed form differs.
 */
export const scoreNameBirthPair = (
  p1: NormalizedPersonColumns,
  p2: NormalizedPersonColumns,
) => sql<number>`
  ${sql.raw(String(NAME_BIRTH_WEIGHTS.base))}
  + CASE WHEN ${sameBirthDate(p1.dateOfBirth, p2.dateOfBirth)} THEN ${sql.raw(String(NAME_BIRTH_WEIGHTS.sameDateBonus))} ELSE 0 END
  + CASE
      WHEN ${sameLastNameWithPrefix(p1.fullLastNorm, p2.fullLastNorm)} THEN ${sql.raw(String(NAME_BIRTH_WEIGHTS.lastName.sameWithPrefix))}
      ELSE ${sql.raw(String(NAME_BIRTH_WEIGHTS.lastName.fallback))}
    END
  + ${scoreBirthDate(p1.dateOfBirth, p2.dateOfBirth, NAME_BIRTH_WEIGHTS.birthDate)}
  + ${scoreBirthCity(p1.birthCityNorm, p2.birthCityNorm, NAME_BIRTH_WEIGHTS.birthCity)}
`;

// ─── Reason-flag selection ─────────────────────────────────────────────────
//
// Re-exports the same predicates as a typed selection block, so the analyze
// script's row-mapper consumes the same booleans the score computed against.

export type MatchFlags = {
  same_user: SQL<boolean>;
  same_first_name: SQL<boolean>;
  similar_first_name: SQL<boolean>;
  same_last_name: SQL<boolean>;
  same_birth_date: SQL<boolean>;
  close_birth_date: SQL<boolean>;
  same_birth_city: SQL<boolean>;
};

export const matchFlagsForPair = (
  p1: NormalizedPersonColumns,
  p2: NormalizedPersonColumns,
  options: { sameUserKnown: boolean },
): MatchFlags => ({
  same_user: options.sameUserKnown
    ? sql<boolean>`TRUE`
    : sameUser(p1.userId, p2.userId),
  same_first_name: sameFirstName(p1.firstNorm, p2.firstNorm),
  similar_first_name: similarFirstNamePrefix(p1.firstNorm, p2.firstNorm),
  same_last_name: sql<boolean>`${sameLastNameWithPrefix(p1.fullLastNorm, p2.fullLastNorm)} OR ${sameLastNameLoose(p1.lastNorm, p2.lastNorm)}`,
  same_birth_date: sameBirthDate(p1.dateOfBirth, p2.dateOfBirth),
  close_birth_date: closeBirthDate(p1.dateOfBirth, p2.dateOfBirth, 7),
  same_birth_city: sameBirthCity(p1.birthCityNorm, p2.birthCityNorm),
});
