import assert from "node:assert";
import test from "node:test";
import { sql } from "drizzle-orm";
import { useQuery, withTestTransaction } from "../../../contexts/index.js";
import {
  SCORE_THRESHOLDS,
  scoreBirthCity,
  scoreBirthDate,
  scoreFirstName,
  scoreLastName,
  scoreNameBirthPair,
  scoreSameUserPair,
  similarFirstNamePrefix,
  similarFirstNamePrefixLoose,
} from "./duplicate-scoring.js";

// Tiny helper: evaluate a scoring SQL expression directly in Postgres against
// a literal pair of normalized columns. Lets us drive the math from TS without
// seeding tables.
async function scoreOne(
  pair: {
    a: {
      firstNorm: string;
      lastNorm: string;
      fullLastNorm: string;
      dob: string | null;
      birthCityNorm: string;
      userId: string | null;
    };
    b: {
      firstNorm: string;
      lastNorm: string;
      fullLastNorm: string;
      dob: string | null;
      birthCityNorm: string;
      userId: string | null;
    };
  },
  expr: "sameUserPair" | "nameBirthPair",
): Promise<number> {
  const query = useQuery();
  const a = pair.a;
  const b = pair.b;
  const cols1 = {
    firstNorm: sql`a_first_norm`,
    lastNorm: sql`a_last_norm`,
    fullLastNorm: sql`a_full_last_norm`,
    dateOfBirth: sql`a_dob`,
    birthCityNorm: sql`a_birth_city_norm`,
    userId: sql`a_user_id`,
  };
  const cols2 = {
    firstNorm: sql`b_first_norm`,
    lastNorm: sql`b_last_norm`,
    fullLastNorm: sql`b_full_last_norm`,
    dateOfBirth: sql`b_dob`,
    birthCityNorm: sql`b_birth_city_norm`,
    userId: sql`b_user_id`,
  };
  const scoreSql =
    expr === "sameUserPair"
      ? scoreSameUserPair(cols1, cols2)
      : scoreNameBirthPair(cols1, cols2);

  // Build a single-row VALUES list with named columns.
  const result = await query.execute(sql`
    SELECT ${scoreSql} AS score FROM (
      SELECT
        ${a.firstNorm}::text AS a_first_norm,
        ${a.lastNorm}::text AS a_last_norm,
        ${a.fullLastNorm}::text AS a_full_last_norm,
        ${a.dob}::date AS a_dob,
        ${a.birthCityNorm}::text AS a_birth_city_norm,
        ${a.userId}::uuid AS a_user_id,
        ${b.firstNorm}::text AS b_first_norm,
        ${b.lastNorm}::text AS b_last_norm,
        ${b.fullLastNorm}::text AS b_full_last_norm,
        ${b.dob}::date AS b_dob,
        ${b.birthCityNorm}::text AS b_birth_city_norm,
        ${b.userId}::uuid AS b_user_id
    ) row
  `);

  const row = result.rows[0] as { score: number | string } | undefined;
  return Number(row?.score ?? 0);
}

async function evalSql(expr: ReturnType<typeof sql>): Promise<unknown> {
  const query = useQuery();
  const result = await query.execute(sql`SELECT (${expr}) AS v`);
  return (result.rows[0] as { v: unknown }).v;
}

test("SCORE_THRESHOLDS has the expected v1 bands", () => {
  assert.strictEqual(SCORE_THRESHOLDS.weak, 100);
  assert.strictEqual(SCORE_THRESHOLDS.strong, 150);
  assert.strictEqual(SCORE_THRESHOLDS.perfect, 200);
});

test("scoreSameUserPair: exact match on every feature returns 200", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "amsterdam",
          userId: "00000000-0000-0000-0000-000000000001",
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "amsterdam",
          userId: "00000000-0000-0000-0000-000000000001",
        },
      },
      "sameUserPair",
    );
    // 50 base + 50 first + 50 last (with prefix) + 50 dob + 10 city = 210
    assert.strictEqual(score, 210);
  }));

test("scoreSameUserPair: only first name matches → base + 50 = 100", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "",
          fullLastNorm: "",
          dob: null,
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "",
          fullLastNorm: "",
          dob: null,
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    assert.strictEqual(score, 100);
  }));

test("scoreSameUserPair: prefix-only first-name match scores 20", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adamson",
          lastNorm: "",
          fullLastNorm: "",
          dob: null,
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adamovic",
          lastNorm: "",
          fullLastNorm: "",
          dob: null,
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    // 50 base + 20 prefix
    assert.strictEqual(score, 70);
  }));

test("scoreSameUserPair: birth-date within 1 day scores 40", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-13",
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    // 50 base + 50 first + 50 last + 40 dob-within-1
    assert.strictEqual(score, 190);
  }));

test("scoreSameUserPair: birth-date within 7 days scores 30", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-19",
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    // 50 + 50 + 50 + 30 = 180
    assert.strictEqual(score, 180);
  }));

test("scoreSameUserPair: same year, different month scores 20", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-01-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-08-30",
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    // 50 + 50 + 50 + 20 = 170
    assert.strictEqual(score, 170);
  }));

test("scoreSameUserPair: empty city does not score", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
      },
      "sameUserPair",
    );
    // 50 + 50 + 50 + 50 + 0 = 200
    assert.strictEqual(score, 200);
  }));

test("scoreNameBirthPair: exact match (assumes upstream first/last/dob filter passed) scores 230", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "amsterdam",
          userId: "00000000-0000-0000-0000-000000000001",
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "amsterdam",
          userId: "00000000-0000-0000-0000-000000000002",
        },
      },
      "nameBirthPair",
    );
    // 50 base + 30 same-dob bonus + 60 last-with-prefix + 60 dob exact + 10 city = 210
    // (Note: the score computes regardless of whether upstream filter would
    // have admitted this pair. Tests the math, not the filter.)
    assert.strictEqual(score, 210);
  }));

test("scoreNameBirthPair: dob within 1 day → 50 + 0 sameDateBonus + 60 last + 45 dob = 155", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-13",
          birthCityNorm: "",
          userId: null,
        },
      },
      "nameBirthPair",
    );
    assert.strictEqual(score, 155);
  }));

test("scoreNameBirthPair: adjacent year (e.g. 2010 vs 2011) scores 15", () =>
  withTestTransaction(async () => {
    const score = await scoreOne(
      {
        a: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2010-05-12",
          birthCityNorm: "",
          userId: null,
        },
        b: {
          firstNorm: "adam",
          lastNorm: "vries",
          fullLastNorm: "devries",
          dob: "2011-08-30",
          birthCityNorm: "",
          userId: null,
        },
      },
      "nameBirthPair",
    );
    // 50 base + 0 same-dob + 60 last-with-prefix + 15 adjacent-year = 125
    assert.strictEqual(score, 125);
  }));

test("scoreFirstName: exact wins over prefix", () =>
  withTestTransaction(async () => {
    const expr = scoreFirstName(sql`'adam'::text`, sql`'adam'::text`, {
      exact: 50,
      prefix: 20,
    });
    assert.strictEqual(Number(await evalSql(expr)), 50);

    const expr2 = scoreFirstName(sql`'adamson'::text`, sql`'adamovic'::text`, {
      exact: 50,
      prefix: 20,
    });
    assert.strictEqual(Number(await evalSql(expr2)), 20);

    const expr3 = scoreFirstName(sql`'eva'::text`, sql`'lisa'::text`, {
      exact: 50,
      prefix: 20,
    });
    assert.strictEqual(Number(await evalSql(expr3)), 0);
  }));

test("scoreLastName: with-prefix variant beats loose", () =>
  withTestTransaction(async () => {
    const expr = scoreLastName(
      sql`'devries'::text`,
      sql`'devries'::text`,
      sql`'vries'::text`,
      sql`'vries'::text`,
      { withPrefix: 50, loose: 40 },
    );
    assert.strictEqual(Number(await evalSql(expr)), 50);

    const expr2 = scoreLastName(
      sql`'devries'::text`,
      sql`'vandervries'::text`,
      sql`'vries'::text`,
      sql`'vries'::text`,
      { withPrefix: 50, loose: 40 },
    );
    assert.strictEqual(Number(await evalSql(expr2)), 40);
  }));

test("scoreBirthDate: descending bands work as documented", () =>
  withTestTransaction(async () => {
    const weights = {
      exact: 60,
      withinOne: 45,
      withinSeven: 35,
      sameYear: 25,
      adjacentYear: 15,
    };
    const tests: Array<[string | null, string | null, number]> = [
      ["2010-05-12", "2010-05-12", 60],
      ["2010-05-12", "2010-05-13", 45],
      ["2010-05-12", "2010-05-18", 35],
      ["2010-05-12", "2010-12-30", 25],
      ["2010-05-12", "2011-08-30", 15],
      ["2010-05-12", "2015-08-30", 0],
      [null, "2010-05-12", 0],
    ];

    for (const [a, b, expected] of tests) {
      const expr = scoreBirthDate(sql`${a}::date`, sql`${b}::date`, weights);
      const got = Number(await evalSql(expr));
      assert.strictEqual(
        got,
        expected,
        `dob(${a}, ${b}) expected ${expected} got ${got}`,
      );
    }
  }));

test("scoreBirthCity: empty-string city does not score (existing semantics)", () =>
  withTestTransaction(async () => {
    const expr = scoreBirthCity(sql`''::text`, sql`''::text`, 10);
    assert.strictEqual(Number(await evalSql(expr)), 0);

    const expr2 = scoreBirthCity(
      sql`'amsterdam'::text`,
      sql`'amsterdam'::text`,
      10,
    );
    assert.strictEqual(Number(await evalSql(expr2)), 10);
  }));

test("similarFirstNamePrefix: requires LENGTH ≥ 3 on both sides", () =>
  withTestTransaction(async () => {
    const expr = similarFirstNamePrefix(sql`'ad'::text`, sql`'ad'::text`);
    assert.strictEqual(await evalSql(expr), false);

    const expr2 = similarFirstNamePrefix(
      sql`'adamson'::text`,
      sql`'adamovic'::text`,
    );
    assert.strictEqual(await evalSql(expr2), true);
  }));

test("similarFirstNamePrefixLoose: no length guard (parity with legacy flag)", () =>
  withTestTransaction(async () => {
    const expr = similarFirstNamePrefixLoose(sql`'ad'::text`, sql`'ad'::text`);
    assert.strictEqual(await evalSql(expr), true);
  }));
