import assert from "node:assert/strict";
import test from "node:test";
import {
  assertResolvedContentDecisions,
  buildSourceImportPlan,
  normalizeRequirement,
  type ParsedSourceRow,
  parseCliOptions,
  parseWideJachtzeilenSheet,
  resolveProgramHandle,
} from "./import-jachtzeilen-ab-programs.ts";
import type { JachtzeilenAbContentDecisions } from "./jachtzeilen-ab-content-decisions.ts";

const resolvedDecisions = {
  revision: "2601",
  ambiguousOvRequired: "required-inland-optional-waddenzee-and-sea",
  blankVoRequired: false,
  combinedLagerwal: "split-existing-competencies",
  rrp: "create-rrp-competency",
} satisfies JachtzeilenAbContentDecisions;

function makeWideRows(input?: {
  moduleTitle?: string;
  competencyTitle?: string;
  vo?: string;
  requirements?: string[];
}): unknown[][] {
  return [
    [
      "",
      "",
      "Discipline",
      "Binnenwater",
      "Binnenwater",
      "Binnenwater",
      "Ruim Binnenwater",
      "Ruim Binnenwater",
      "Wad en Zeegaten",
      "Wad en Zeegaten",
      "Zee",
      "Zee",
    ],
    [
      "Module",
      "Verplicht op Optioneel (V/O)",
      "Competentie",
      "Niveau 4",
      "Niveau A",
      "Niveau B",
      "Niveau A",
      "Niveau B",
      "Niveau A",
      "Niveau B",
      "Niveau A",
      "Niveau B",
    ],
    [
      input?.moduleTitle ?? "Basis",
      input?.vo ?? "V",
      input?.competencyTitle ?? "Aanslaan zeilen",
      ...(input?.requirements ?? Array.from({ length: 9 }, () => "Eis")),
    ],
  ];
}

function parseFixture(input?: Parameters<typeof makeWideRows>[0]) {
  return parseWideJachtzeilenSheet(makeWideRows(input), {
    targetCount: 9,
    sourceLinkCount: 9,
  });
}

function buildFixturePlan(
  sourceRows: ParsedSourceRow[],
  materializedLinkCount = sourceRows.length,
) {
  return buildSourceImportPlan({
    sourceRows,
    sourceHash: "test",
    decisions: resolvedDecisions,
    expected: {
      targetCount: 9,
      materializedLinkCount,
    },
  });
}

test("wide parser imports Binnenwater 4 and all eight A/B columns", () => {
  const rows = parseFixture();

  assert.equal(rows.length, 9);
  assert.deepEqual(
    new Set(rows.map((row) => row.niveau)),
    new Set(["4", "a", "b"]),
  );
  assert.equal(
    rows.filter((row) => row.niveau === "4")[0]?.vaarwater,
    "Binnenwater",
  );
  assert.deepEqual(
    new Set(rows.map((row) => row.vaarwater)),
    new Set([
      "Binnenwater",
      "Ruim Binnenwater",
      "Waddenzee en Zeeuwse Stromen",
      "Zee",
    ]),
  );
});

test("program handles use the exact existing course handle", () => {
  assert.equal(
    resolveProgramHandle("Binnenwater", "4"),
    "jacht-kajuitzeilen-binnenwater-volwassenen-4",
  );
  assert.equal(
    resolveProgramHandle("Binnenwater", "a"),
    "jacht-kajuitzeilen-binnenwater-volwassenen-a",
  );
  assert.equal(
    resolveProgramHandle("Waddenzee en Zeeuwse Stromen", "b"),
    "jacht-kajuitzeilen-waddenzee-en-zeeuwse-stromen-volwassenen-b",
  );
});

test("O/V is required inland and optional on Waddenzee and Zee", () => {
  const plan = buildFixturePlan(parseFixture({ vo: "O/V" }));

  assert.ok(
    plan.rows
      .filter(
        (row) =>
          row.vaarwater === "Binnenwater" ||
          row.vaarwater === "Ruim Binnenwater",
      )
      .every((row) => row.isRequired),
  );
  assert.ok(
    plan.rows
      .filter(
        (row) =>
          row.vaarwater === "Waddenzee en Zeeuwse Stromen" ||
          row.vaarwater === "Zee",
      )
      .every((row) => !row.isRequired),
  );
});

test("blank V/O values are optional", () => {
  const plan = buildFixturePlan(parseFixture({ vo: "" }));
  assert.ok(plan.rows.every((row) => !row.isRequired));
});

test("Windorientatie is required despite its blank V/O value", () => {
  const plan = buildFixturePlan(
    parseFixture({
      moduleTitle: "Varen onder zeil",
      competencyTitle: "Windorientatie",
      vo: "",
    }),
  );
  assert.ok(plan.rows.every((row) => row.isRequired));
});

test("combined lagerwal row splits into the two existing competencies", () => {
  const sourceRows = parseFixture({
    moduleTitle: "Plat- en rondbodemzeilen",
    competencyTitle: 'Aankomen en afvaren lagerwal zonder motor "onder zeil"',
    vo: "",
  });
  const plan = buildFixturePlan(sourceRows, 18);

  assert.equal(plan.sourceRows.length, 9);
  assert.equal(plan.rows.length, 18);
  assert.deepEqual(
    new Set(plan.rows.map((row) => row.competency.handle)),
    new Set([
      "aankomen-aan-een-lagerwal-zonder-motor-op-zeil",
      "afvaren-van-een-lagerwal-zonder-motor-op-zeil",
    ]),
  );
});

test("known CSV title variants reuse production competency handles", () => {
  const plan = buildFixturePlan(
    parseFixture({
      moduleTitle: "Varen onder zeil",
      competencyTitle: "Sturen onder zeil",
    }),
  );

  assert.deepEqual(
    new Set(plan.rows.map((row) => row.competency.handle)),
    new Set(["sturen-op-zeil"]),
  );
  assert.ok(plan.rows.every((row) => !row.competency.createIfMissing));
});

test("RR&P uses the approved new title and handle", () => {
  const plan = buildFixturePlan(
    parseFixture({
      moduleTitle: "Theorie",
      competencyTitle: "RR&P",
      vo: "",
    }),
  );
  assert.deepEqual(
    new Set(plan.rows.map((row) => row.competency.handle)),
    new Set(["reisvoorbereiding-routering-en-planning"]),
  );
  assert.ok(
    plan.rows.every(
      (row) =>
        row.competency.title ===
          "Reisvoorbereiding, Routering en Planning (RR&P)" &&
        row.competency.createIfMissing,
    ),
  );
});

test("requirement normalization is allowlisted and auditable", () => {
  const normalized = normalizeRequirement(
    "  kan  aan komen op bij een wal  \r\n\r\n\r\nLet op op scheepvaart  ",
  );
  assert.equal(
    normalized.normalized,
    "Kan aankomen bij een wal\n\nLet op de scheepvaart.",
  );
  assert.deepEqual(
    new Set(normalized.corrections),
    new Set([
      "line-endings",
      "trim-whitespace",
      "collapse-inline-whitespace",
      "collapse-blank-lines",
      "approved-spelling-or-grammar",
      "sentence-start-capitalization",
      "terminal-punctuation",
    ]),
  );
});

test("unresolved content decisions stop the import", () => {
  assert.throws(
    () =>
      assertResolvedContentDecisions({
        revision: "2601",
        ambiguousOvRequired: null,
        blankVoRequired: null,
        combinedLagerwal: null,
        rrp: null,
      }),
    /Unresolved content decisions/,
  );
});

test("CLI is dry-run by default and production writes are explicit", () => {
  assert.deepEqual(parseCliOptions(["plan", "--file=/tmp/source.csv"]), {
    command: "plan",
    execute: false,
    filePath: "/tmp/source.csv",
  });
  assert.deepEqual(
    parseCliOptions([
      "import",
      "--file=/tmp/source.csv",
      "--expected-catalog-hash=abc",
      "--execute",
    ]),
    {
      command: "import",
      execute: true,
      filePath: "/tmp/source.csv",
      expectedCatalogHash: "abc",
    },
  );
});
