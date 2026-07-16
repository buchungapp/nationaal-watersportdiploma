#!/usr/bin/env tsx

// cspell:ignore afvaren aankomen binnenwater boxvaren diplomalijn droogvallen
// cspell:ignore genaker jachtzeilen kajuitzeilen lagerwal lazylines manoeuvre
// cspell:ignore mooring rondbodemzeilen ruim spinaker vaarwater wad zeegaten
// cspell:ignore beffcient belectriciteit bgecoordineert bgecoördineert
// cspell:ignore blekkege bsti bveiliig bzwanehals bzonodig Ieggen Mojibake

import { useQuery, withDatabase, withTransaction } from "@nawadi/core";
import { schema } from "@nawadi/db";
import slugify from "@sindresorhus/slugify";
import { and, eq, inArray, sql } from "drizzle-orm";
import "dotenv/config";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import xlsx from "xlsx";
import {
  JACHTZEILEN_AB_CONTENT_DECISIONS,
  type JachtzeilenAbContentDecisions,
} from "./jachtzeilen-ab-content-decisions.ts";
import { readJachtzeilenCatalogFingerprint } from "./jachtzeilen-catalog-snapshot.ts";

const { read, utils } = xlsx;

export const EXPECTED_SOURCE_SHA256 =
  "52a399b2dd2766efe251cb841e373eb083daa1ff1c0b1d594793b8a1dda064c6";
export const EXPECTED_SOURCE_LINK_COUNT = 773;
export const EXPECTED_MATERIALIZED_LINK_COUNT = 782;
export const EXPECTED_TARGET_COUNT = 9;
export const EXPECTED_GEAR_TYPE_COUNT = 11;
export const IMPORT_STARTED_AT = "2026-01-01T00:00:00.000Z";

const SOURCE_COMBINED_LAGERWAL =
  'Aankomen en afvaren lagerwal zonder motor "onder zeil"';
const SOURCE_RRP = "RR&P";
const SOURCE_WINDORIENTATION = "Windorientatie";
const RRP_HANDLE = "reisvoorbereiding-routering-en-planning";
const RRP_TITLE = "Reisvoorbereiding, Routering en Planning (RR&P)";
const REGLEMENTEN_WEIGHT = 906;
const RRP_WEIGHT = 907;

const EXPECTED_LINK_COUNTS_BY_PROGRAM = {
  "jacht-kajuitzeilen-binnenwater-volwassenen-4": 78,
  "jacht-kajuitzeilen-binnenwater-volwassenen-a": 81,
  "jacht-kajuitzeilen-binnenwater-volwassenen-b": 81,
  "jacht-kajuitzeilen-ruim-binnenwater-volwassenen-a": 88,
  "jacht-kajuitzeilen-ruim-binnenwater-volwassenen-b": 88,
  "jacht-kajuitzeilen-waddenzee-en-zeeuwse-stromen-volwassenen-a": 92,
  "jacht-kajuitzeilen-waddenzee-en-zeeuwse-stromen-volwassenen-b": 92,
  "jacht-kajuitzeilen-zee-volwassenen-a": 91,
  "jacht-kajuitzeilen-zee-volwassenen-b": 91,
} as const;

const SHARED_COMPETENCY_TITLE_CORRECTIONS = [
  {
    handle: "aanlegen-en-afvaren-met-spiegel-naar-de-wal-met-mooring-lazylines",
    oldTitle:
      "Aanlegen en afvaren met spiegel naar de wal met mooring-/lazylines",
    newTitle:
      "Aanleggen en afvaren met spiegel naar de wal met mooring-/lazy lines",
  },
  {
    handle: "windorientatie",
    oldTitle: "Windorientatie",
    newTitle: "Windoriëntatie",
  },
] as const;

const COMPETENCY_HANDLE_ALIASES: Record<string, string> = {
  "Aanlegen en afvaren met spiegel naar de wal met mooring-/lazy lines":
    "aanlegen-en-afvaren-met-spiegel-naar-de-wal-met-mooring-lazylines",
  "Ankeren (zeilend)": "ankeren-op-zeil",
  "Man over boord onder zeil": "man-over-boord-op-zeil",
  "Omgaan met zeer harde wind (1 bft harder dan voor het niveau aangewezen)":
    "omgaan-met-zeer-harde-wind",
  "Sturen op de motor": "sturen-op-motor",
  "Sturen onder zeil": "sturen-op-zeil",
};

const MODULE_HANDLE_ALIASES: Record<string, string> = {
  Basis: "basis",
  Theorie: "theorie",
};

const COURSE_HANDLE_BY_VAARWATER = {
  Binnenwater: "jacht-kajuitzeilen-binnenwater-volwassenen",
  "Ruim Binnenwater": "jacht-kajuitzeilen-ruim-binnenwater-volwassenen",
  "Waddenzee en Zeeuwse Stromen":
    "jacht-kajuitzeilen-waddenzee-en-zeeuwse-stromen-volwassenen",
  Zee: "jacht-kajuitzeilen-zee-volwassenen",
} as const;

const VAARWATER_ALIASES: Record<string, Vaarwater> = {
  "Wad en Zeegaten": "Waddenzee en Zeeuwse Stromen",
};

type Vaarwater = keyof typeof COURSE_HANDLE_BY_VAARWATER;
type Niveau = "4" | "a" | "b";
type VoValue = "V" | "O" | "O/V" | "";
type Command = "plan" | "import" | "rollback" | "verify-local";

export type RequirementCorrection =
  | "line-endings"
  | "trim-whitespace"
  | "collapse-inline-whitespace"
  | "collapse-blank-lines"
  | "approved-spelling-or-grammar"
  | "sentence-start-capitalization"
  | "terminal-punctuation";

type ResolvedContentDecisions = Omit<
  JachtzeilenAbContentDecisions,
  "ambiguousOvRequired" | "blankVoRequired" | "combinedLagerwal" | "rrp"
> & {
  ambiguousOvRequired: NonNullable<
    JachtzeilenAbContentDecisions["ambiguousOvRequired"]
  >;
  blankVoRequired: boolean;
  combinedLagerwal: NonNullable<
    JachtzeilenAbContentDecisions["combinedLagerwal"]
  >;
  rrp: NonNullable<JachtzeilenAbContentDecisions["rrp"]>;
};

interface DataColumn {
  columnIndex: number;
  vaarwater: Vaarwater;
  niveau: Niveau;
}

export interface ParsedSourceRow {
  sourceRow: number;
  vaarwater: Vaarwater;
  niveau: Niveau;
  moduleTitle: string;
  competencyTitle: string;
  vo: VoValue;
  originalRequirement: string;
  requirement: string;
  corrections: RequirementCorrection[];
}

interface CompetencyReference {
  handle: string;
  title: string;
  type: "knowledge" | "skill";
  createIfMissing: boolean;
}

export interface ImportRow extends ParsedSourceRow {
  moduleHandle: string;
  competency: CompetencyReference;
  isRequired: boolean;
  courseHandle: string;
  programHandle: string;
}

export interface SourceImportPlan {
  revision: string;
  sourceHash: string;
  sourceRows: ParsedSourceRow[];
  rows: ImportRow[];
  targets: Map<string, ImportRow[]>;
  normalization: {
    changed: Array<{
      sourceRow: number;
      programHandle: string;
      moduleTitle: string;
      competencyTitle: string;
      original: string;
      normalized: string;
      corrections: RequirementCorrection[];
    }>;
    unchanged: {
      count: number;
      sha256: string;
    };
  };
}

interface DatabaseTargetPlan {
  programHandle: string;
  courseHandle: string;
  courseId: string;
  degreeId: string;
  rows: ImportRow[];
  moduleIds: Map<string, string>;
  gearTypeIds: string[];
  existingProgramId: string | null;
  existingCurriculumId: string | null;
  existingCurriculumStartedAt: string | null;
}

interface DatabaseImportPlan {
  source: SourceImportPlan;
  targets: DatabaseTargetPlan[];
  competencyIds: Map<string, string>;
  competenciesToCreate: CompetencyReference[];
  catalogHash: string;
}

export interface ImportManifest {
  kind: "jachtzeilen-ab-import";
  version: 2;
  createdAt: string;
  sourceHash: string;
  catalogHash: string;
  revision: string;
  startedAt: string;
  createdProgramIds: string[];
  createdCurriculumIds: string[];
  createdCompetencyIds: string[];
  shiftedCompetencyWeights: Array<{
    competencyId: string;
    handle: string;
    from: number;
    to: number;
  }>;
  correctedCompetencyTitles: Array<{
    competencyId: string;
    handle: string;
    from: string;
    to: string;
  }>;
  normalization: SourceImportPlan["normalization"];
  targets: Array<{
    programHandle: string;
    programId: string;
    curriculumId: string;
    courseHandle: string;
    competencyCount: number;
    moduleCount: number;
    gearTypeCount: number;
    curriculumWasCreated: boolean;
    previousStartedAt: string | null;
    createdModuleIds: string[];
    createdCompetencyLinkIds: string[];
    createdGearTypeIds: string[];
  }>;
}

interface CliOptions {
  command: Command;
  execute: boolean;
  filePath?: string;
  manifestPath?: string;
  pgUri?: string;
  expectedCatalogHash?: string;
  attestationPath?: string;
}

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function unique<T>(values: Iterable<T>): T[] {
  return [...new Set(values)];
}

function sameInstant(left: string | null, right: string | null): boolean {
  if (left === null || right === null) return left === right;
  return new Date(left).valueOf() === new Date(right).valueOf();
}

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

const APPROVED_REQUIREMENT_REPLACEMENTS: Array<{
  pattern: RegExp;
  replacement: string;
}> = [
  { pattern: /\baan komen\b/g, replacement: "aankomen" },
  { pattern: /\bAan komen\b/g, replacement: "Aankomen" },
  { pattern: /\baankomen op bij\b/g, replacement: "aankomen bij" },
  { pattern: /\bgeeft is tot\b/g, replacement: "geeft totdat" },
  { pattern: /\belectriciteit\b/g, replacement: "elektriciteit" },
  { pattern: /\bHygiene-checklist\b/g, replacement: "hygiënechecklist" },
  { pattern: /\ballergieen\b/g, replacement: "allergieën" },
  { pattern: /\bcreeert\b/g, replacement: "creëert" },
  { pattern: /\bstuurinrichtting\b/g, replacement: "stuurinrichting" },
  { pattern: /\bnavigatieappartuur\b/g, replacement: "navigatieapparatuur" },
  { pattern: /\baanwijzigingen\b/g, replacement: "aanwijzingen" },
  { pattern: /\beffcient\b/g, replacement: "efficiënt" },
  { pattern: /\befficiente\b/g, replacement: "efficiënte" },
  { pattern: /\bcoordineert\b/g, replacement: "coördineert" },
  { pattern: /\bgecoordineert\b/g, replacement: "gecoördineerd" },
  { pattern: /\bgecoördineert\b/g, replacement: "gecoördineerd" },
  {
    pattern: /\bgecoördineerd plaats vinden\b/g,
    replacement: "gecoördineerd plaatsvinden",
  },
  { pattern: /\bveiliig\b/g, replacement: "veilig" },
  { pattern: /\blekkege\b/g, replacement: "lekkage" },
  { pattern: /\bongeer\b/g, replacement: "ongeveer" },
  { pattern: /\bzwanehals\b/g, replacement: "zwanenhals" },
  { pattern: /\bstiI Ieggen\b/g, replacement: "stilleggen" },
  { pattern: /\bcontrole lampjes\b/g, replacement: "controlelampjes" },
  { pattern: /\bgashandel\b/g, replacement: "gashendel" },
  {
    pattern: /\beerst(e)?hulp handelingen\b/g,
    replacement: "eerstehulphandelingen",
  },
  { pattern: /\bvoor en nadelen\b/g, replacement: "voor- en nadelen" },
  { pattern: /\bten allen tijde\b/g, replacement: "te allen tijde" },
  { pattern: /\boverige verkeer\b/g, replacement: "overig verkeer" },
  { pattern: /\bzonodig\b/g, replacement: "zo nodig" },
  {
    pattern: /\bvoor of achterwaartse\b/g,
    replacement: "voor- of achterwaartse",
  },
  {
    pattern: /\bLet op op scheepvaart\b/g,
    replacement: "Let op de scheepvaart",
  },
  { pattern: /\.{2,}/g, replacement: "." },
  { pattern: /([.!?])(?=[A-ZÀ-Ý])/g, replacement: "$1 " },
  { pattern: /\. filters\b/g, replacement: ". Filters" },
  {
    pattern:
      /(Moet hygiënechecklist kennen en kunnen toepassen\. Vraagt naar allergieën en andere beperkingen\.)\s+Moet hygiënechecklist kennen en kunnen toepassen\. Vraagt naar allergieën en andere beperkingen\./g,
    replacement: "$1",
  },
];

function addCorrection(
  corrections: Set<RequirementCorrection>,
  correction: RequirementCorrection,
) {
  corrections.add(correction);
}

function ensureTerminalPunctuation(value: string): string {
  if (/[.?!](?:["'’”)\]])*$/u.test(value)) return value;
  if (/["'’”]$/u.test(value)) {
    return value.replace(/(["'’”]+)$/u, ".$1");
  }
  return `${value}.`;
}

export function normalizeRequirement(value: unknown): {
  original: string;
  normalized: string;
  corrections: RequirementCorrection[];
} {
  const original = String(value ?? "");
  const corrections = new Set<RequirementCorrection>();
  let normalized = original;

  const lineEndingNormalized = normalized.replace(/\r\n?/g, "\n");
  if (lineEndingNormalized !== normalized) {
    addCorrection(corrections, "line-endings");
    normalized = lineEndingNormalized;
  }

  const whitespaceTrimmed = normalized
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();
  if (whitespaceTrimmed !== normalized) {
    addCorrection(corrections, "trim-whitespace");
    normalized = whitespaceTrimmed;
  }

  const inlineWhitespaceCollapsed = normalized
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " "))
    .join("\n");
  if (inlineWhitespaceCollapsed !== normalized) {
    addCorrection(corrections, "collapse-inline-whitespace");
    normalized = inlineWhitespaceCollapsed;
  }

  const blankLinesCollapsed = normalized.replace(/\n{3,}/g, "\n\n");
  if (blankLinesCollapsed !== normalized) {
    addCorrection(corrections, "collapse-blank-lines");
    normalized = blankLinesCollapsed;
  }

  for (const { pattern, replacement } of APPROVED_REQUIREMENT_REPLACEMENTS) {
    const corrected = normalized.replace(pattern, replacement);
    if (corrected !== normalized) {
      addCorrection(corrections, "approved-spelling-or-grammar");
      normalized = corrected;
    }
  }

  if (/^[a-zà-ÿ]/u.test(normalized)) {
    addCorrection(corrections, "sentence-start-capitalization");
    normalized = `${normalized[0]?.toLocaleUpperCase("nl-NL")}${normalized.slice(
      1,
    )}`;
  }

  if (normalized) {
    const punctuated = ensureTerminalPunctuation(normalized);
    if (punctuated !== normalized) {
      addCorrection(corrections, "terminal-punctuation");
      normalized = punctuated;
    }
  }

  return {
    original,
    normalized,
    corrections: [...corrections],
  };
}

function normalizeVaarwater(value: unknown): Vaarwater | null {
  const title = normalizeText(value);
  const normalized = VAARWATER_ALIASES[title] ?? title;
  return normalized in COURSE_HANDLE_BY_VAARWATER
    ? (normalized as Vaarwater)
    : null;
}

function parseNiveau(value: unknown): Niveau | null {
  const match = normalizeText(value).match(/^Niveau\s+(4|[AB])$/i);
  if (!match?.[1]) return null;
  return match[1].toLowerCase() as Niveau;
}

function parseVo(value: unknown, sourceRow: number): VoValue {
  const normalized = normalizeText(value).toUpperCase();
  invariant(
    normalized === "" ||
      normalized === "V" ||
      normalized === "O" ||
      normalized === "O/V",
    `CSV row ${sourceRow}: unsupported V/O value "${normalized}"`,
  );
  return normalized;
}

function assertNoMojibake(value: string, context: string) {
  invariant(
    !/[ÃÂ�]/u.test(value),
    `${context}: text contains an invalid UTF-8 decoding marker`,
  );
}

function detectDataColumns(rows: unknown[][]): DataColumn[] {
  const vaarwaterRow = rows[0] ?? [];
  const niveauRow = rows[1] ?? [];
  const columns: DataColumn[] = [];
  let currentVaarwater: Vaarwater | null = null;

  for (
    let columnIndex = 0;
    columnIndex < Math.max(vaarwaterRow.length, niveauRow.length);
    columnIndex++
  ) {
    const parsedVaarwater = normalizeVaarwater(vaarwaterRow[columnIndex]);
    if (parsedVaarwater) currentVaarwater = parsedVaarwater;

    const niveau = parseNiveau(niveauRow[columnIndex]);
    if (!currentVaarwater || !niveau) continue;
    invariant(
      niveau !== "4" || currentVaarwater === "Binnenwater",
      "Niveau 4 is only approved for Binnenwater",
    );

    columns.push({ columnIndex, vaarwater: currentVaarwater, niveau });
  }

  return columns;
}

export function parseWideJachtzeilenSheet(
  rows: unknown[][],
  expected: {
    targetCount: number;
    sourceLinkCount: number;
  } = {
    targetCount: EXPECTED_TARGET_COUNT,
    sourceLinkCount: EXPECTED_SOURCE_LINK_COUNT,
  },
): ParsedSourceRow[] {
  invariant(rows.length >= 3, "CSV must contain two header rows and data");
  const dataColumns = detectDataColumns(rows);
  invariant(
    dataColumns.length === expected.targetCount,
    `Expected ${expected.targetCount} target columns, found ${dataColumns.length}`,
  );
  invariant(
    dataColumns.filter((column) => column.niveau === "4").length === 1,
    "Expected exactly one Niveau 4 target column",
  );

  const parsedRows: ParsedSourceRow[] = [];

  for (let rowIndex = 2; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] ?? [];
    const sourceRow = rowIndex + 1;
    const moduleTitle = normalizeText(row[0]);
    const competencyTitle = normalizeText(row[2]);

    if (!moduleTitle && !competencyTitle) continue;
    invariant(
      moduleTitle && competencyTitle,
      `CSV row ${sourceRow}: module and competency must both be populated`,
    );
    assertNoMojibake(moduleTitle, `CSV row ${sourceRow} module`);
    assertNoMojibake(competencyTitle, `CSV row ${sourceRow} competency`);

    const vo = parseVo(row[1], sourceRow);

    for (const column of dataColumns) {
      const normalizedRequirement = normalizeRequirement(
        row[column.columnIndex],
      );
      if (!normalizedRequirement.normalized) continue;
      assertNoMojibake(
        normalizedRequirement.normalized,
        `CSV row ${sourceRow} requirement`,
      );

      parsedRows.push({
        sourceRow,
        vaarwater: column.vaarwater,
        niveau: column.niveau,
        moduleTitle,
        competencyTitle,
        vo,
        originalRequirement: normalizedRequirement.original,
        requirement: normalizedRequirement.normalized,
        corrections: normalizedRequirement.corrections,
      });
    }
  }

  invariant(
    parsedRows.length === expected.sourceLinkCount,
    `Expected ${expected.sourceLinkCount} source links, found ${parsedRows.length}`,
  );

  return parsedRows;
}

export function assertResolvedContentDecisions(
  decisions: JachtzeilenAbContentDecisions,
): ResolvedContentDecisions {
  const unresolved: string[] = [];
  if (decisions.ambiguousOvRequired === null) {
    unresolved.push("ambiguousOvRequired");
  }
  if (decisions.blankVoRequired === null) unresolved.push("blankVoRequired");
  if (decisions.combinedLagerwal === null) {
    unresolved.push("combinedLagerwal");
  }
  if (decisions.rrp === null) unresolved.push("rrp");

  invariant(
    unresolved.length === 0,
    `Unresolved content decisions: ${unresolved.join(", ")}`,
  );

  return decisions as ResolvedContentDecisions;
}

function resolveRequiredness(
  row: ParsedSourceRow,
  decisions: ResolvedContentDecisions,
): boolean {
  if (row.competencyTitle === SOURCE_WINDORIENTATION) return true;
  if (row.vo === "V") return true;
  if (row.vo === "O") return false;
  if (row.vo === "O/V") {
    return (
      row.vaarwater === "Binnenwater" || row.vaarwater === "Ruim Binnenwater"
    );
  }
  return decisions.blankVoRequired;
}

function resolveCompetencies(
  row: ParsedSourceRow,
  decisions: ResolvedContentDecisions,
): CompetencyReference[] {
  const type = row.moduleTitle === "Theorie" ? "knowledge" : "skill";

  if (row.competencyTitle === SOURCE_COMBINED_LAGERWAL) {
    if (decisions.combinedLagerwal === "split-existing-competencies") {
      return [
        {
          handle: "aankomen-aan-een-lagerwal-zonder-motor-op-zeil",
          title: "Aankomen aan een lagerwal zonder motor (op zeil)",
          type: "skill",
          createIfMissing: false,
        },
        {
          handle: "afvaren-van-een-lagerwal-zonder-motor-op-zeil",
          title: "Afvaren van een lagerwal zonder motor (op zeil)",
          type: "skill",
          createIfMissing: false,
        },
      ];
    }

    return [
      {
        handle: slugify(row.competencyTitle),
        title: row.competencyTitle,
        type: "skill",
        createIfMissing: true,
      },
    ];
  }

  if (row.competencyTitle === SOURCE_RRP) {
    if (decisions.rrp === "reuse-reglementen") {
      return [
        {
          handle: "reglementen",
          title: "Reglementen",
          type: "knowledge",
          createIfMissing: false,
        },
      ];
    }

    return [
      {
        handle: RRP_HANDLE,
        title: RRP_TITLE,
        type: "knowledge",
        createIfMissing: true,
      },
    ];
  }

  return [
    {
      handle:
        COMPETENCY_HANDLE_ALIASES[row.competencyTitle] ??
        slugify(row.competencyTitle),
      title: row.competencyTitle,
      type,
      createIfMissing: false,
    },
  ];
}

function resolveModuleHandle(title: string): string {
  return MODULE_HANDLE_ALIASES[title] ?? slugify(title);
}

export function resolveProgramHandle(
  vaarwater: Vaarwater,
  niveau: Niveau,
): string {
  return `${COURSE_HANDLE_BY_VAARWATER[vaarwater]}-${niveau}`;
}

export function buildSourceImportPlan(input: {
  sourceRows: ParsedSourceRow[];
  sourceHash: string;
  decisions: JachtzeilenAbContentDecisions;
  expected?: {
    targetCount: number;
    materializedLinkCount: number;
    targetLinkCounts?: Record<string, number>;
  };
}): SourceImportPlan {
  const decisions = assertResolvedContentDecisions(input.decisions);
  const expected = input.expected ?? {
    targetCount: EXPECTED_TARGET_COUNT,
    materializedLinkCount: EXPECTED_MATERIALIZED_LINK_COUNT,
    targetLinkCounts: EXPECTED_LINK_COUNTS_BY_PROGRAM,
  };
  const rows: ImportRow[] = [];

  for (const sourceRow of input.sourceRows) {
    const courseHandle = COURSE_HANDLE_BY_VAARWATER[sourceRow.vaarwater];
    const programHandle = resolveProgramHandle(
      sourceRow.vaarwater,
      sourceRow.niveau,
    );

    for (const competency of resolveCompetencies(sourceRow, decisions)) {
      rows.push({
        ...sourceRow,
        moduleHandle: resolveModuleHandle(sourceRow.moduleTitle),
        competency,
        isRequired: resolveRequiredness(sourceRow, decisions),
        courseHandle,
        programHandle,
      });
    }
  }

  const deduplicatedRows = new Map<string, ImportRow>();
  for (const row of rows) {
    const key = [
      row.programHandle,
      row.moduleHandle,
      row.competency.handle,
    ].join("|");
    const existing = deduplicatedRows.get(key);
    if (existing) {
      invariant(
        existing.requirement === row.requirement &&
          existing.isRequired === row.isRequired,
        `Conflicting duplicate target row: ${key}`,
      );
      continue;
    }
    deduplicatedRows.set(key, row);
  }

  const targets = new Map<string, ImportRow[]>();
  for (const row of deduplicatedRows.values()) {
    const targetRows = targets.get(row.programHandle) ?? [];
    targetRows.push(row);
    targets.set(row.programHandle, targetRows);
  }

  invariant(
    targets.size === expected.targetCount,
    `Expected ${expected.targetCount} program targets, found ${targets.size}`,
  );
  invariant(
    deduplicatedRows.size === expected.materializedLinkCount,
    `Expected ${expected.materializedLinkCount} materialized links, found ${deduplicatedRows.size}`,
  );

  for (const [programHandle, expectedCount] of Object.entries(
    expected.targetLinkCounts ?? {},
  )) {
    const actualCount = targets.get(programHandle)?.length ?? 0;
    invariant(
      actualCount === expectedCount,
      `Expected ${expectedCount} links for ${programHandle}, found ${actualCount}`,
    );
  }

  const changed = input.sourceRows
    .filter((row) => row.corrections.length > 0)
    .map((row) => ({
      sourceRow: row.sourceRow,
      programHandle: resolveProgramHandle(row.vaarwater, row.niveau),
      moduleTitle: row.moduleTitle,
      competencyTitle: row.competencyTitle,
      original: row.originalRequirement,
      normalized: row.requirement,
      corrections: row.corrections,
    }));
  const unchangedRows = input.sourceRows
    .filter((row) => row.corrections.length === 0)
    .map((row) => ({
      sourceRow: row.sourceRow,
      programHandle: resolveProgramHandle(row.vaarwater, row.niveau),
      moduleTitle: row.moduleTitle,
      competencyTitle: row.competencyTitle,
      requirement: row.requirement,
    }));

  return {
    revision: decisions.revision,
    sourceHash: input.sourceHash,
    sourceRows: input.sourceRows,
    rows: [...deduplicatedRows.values()],
    targets,
    normalization: {
      changed,
      unchanged: {
        count: unchangedRows.length,
        sha256: sha256(Buffer.from(JSON.stringify(unchangedRows))),
      },
    },
  };
}

function sha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function loadSourceFile(filePath: string): {
  sourceHash: string;
  rows: unknown[][];
} {
  const normalizedPath = filePath.trim().replace(/^["']|["']$/g, "");
  invariant(fs.existsSync(normalizedPath), `File not found: ${normalizedPath}`);
  invariant(
    path.extname(normalizedPath).toLowerCase() === ".csv",
    "The source file must be the reviewed CSV",
  );

  const buffer = fs.readFileSync(normalizedPath);
  const sourceHash = sha256(buffer);
  invariant(
    sourceHash === EXPECTED_SOURCE_SHA256,
    `Source hash mismatch. Expected ${EXPECTED_SOURCE_SHA256}, got ${sourceHash}`,
  );

  const workbook = read(buffer.toString("utf8"), { type: "string" });
  const sheetName = workbook.SheetNames[0];
  invariant(sheetName, "CSV workbook has no sheet");
  const worksheet = workbook.Sheets[sheetName];
  invariant(worksheet, "CSV worksheet is missing");

  return {
    sourceHash,
    rows: utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    }),
  };
}

async function loadUniformGearTypeIds(courseId: string): Promise<string[]> {
  const query = useQuery();
  const rows = await query
    .select({
      curriculumId: schema.curriculum.id,
      gearTypeId: schema.curriculumGearLink.gearTypeId,
    })
    .from(schema.curriculum)
    .innerJoin(
      schema.program,
      eq(schema.program.id, schema.curriculum.programId),
    )
    .innerJoin(
      schema.curriculumGearLink,
      eq(schema.curriculumGearLink.curriculumId, schema.curriculum.id),
    )
    .where(
      and(
        eq(schema.program.courseId, courseId),
        eq(schema.curriculum.revision, "2501"),
      ),
    );

  invariant(rows.length > 0, `No 2501 gear links found for course ${courseId}`);
  const byCurriculum = new Map<string, Set<string>>();
  for (const row of rows) {
    const ids = byCurriculum.get(row.curriculumId) ?? new Set<string>();
    ids.add(row.gearTypeId);
    byCurriculum.set(row.curriculumId, ids);
  }

  const signatures = unique(
    [...byCurriculum.values()].map((ids) => [...ids].sort().join(",")),
  );
  invariant(
    signatures.length === 1,
    `2501 curricula do not have a uniform gear-type set for course ${courseId}`,
  );

  const gearTypeIds = [...(byCurriculum.values().next().value ?? [])].sort();
  invariant(
    gearTypeIds.length === EXPECTED_GEAR_TYPE_COUNT,
    `Expected ${EXPECTED_GEAR_TYPE_COUNT} gear types for course ${courseId}, found ${gearTypeIds.length}`,
  );
  return gearTypeIds;
}

async function assertExistingDraftIsSubset(input: {
  curriculumId: string;
  targetRows: ImportRow[];
  gearTypeIds: string[];
}) {
  const query = useQuery();
  const [moduleRows, competencyRows, gearRows] = await Promise.all([
    query
      .select({ moduleHandle: schema.module.handle })
      .from(schema.curriculumModule)
      .innerJoin(
        schema.module,
        eq(schema.module.id, schema.curriculumModule.moduleId),
      )
      .where(eq(schema.curriculumModule.curriculumId, input.curriculumId)),
    query
      .select({
        moduleHandle: schema.module.handle,
        competencyHandle: schema.competency.handle,
        isRequired: schema.curriculumCompetency.isRequired,
        requirement: schema.curriculumCompetency.requirement,
      })
      .from(schema.curriculumCompetency)
      .innerJoin(
        schema.module,
        eq(schema.module.id, schema.curriculumCompetency.moduleId),
      )
      .innerJoin(
        schema.competency,
        eq(schema.competency.id, schema.curriculumCompetency.competencyId),
      )
      .where(eq(schema.curriculumCompetency.curriculumId, input.curriculumId)),
    query
      .select({ gearTypeId: schema.curriculumGearLink.gearTypeId })
      .from(schema.curriculumGearLink)
      .where(eq(schema.curriculumGearLink.curriculumId, input.curriculumId)),
  ]);

  const targetModules = new Set(
    input.targetRows.map((row) => row.moduleHandle),
  );
  const targetCompetencies = new Set(
    input.targetRows.map(
      (row) => `${row.moduleHandle}|${row.competency.handle}`,
    ),
  );
  const targetGearTypes = new Set(input.gearTypeIds);

  const extraModules = moduleRows.filter(
    (row) => !targetModules.has(row.moduleHandle),
  );
  const extraCompetencies = competencyRows.filter((row) => {
    const key = `${row.moduleHandle}|${row.competencyHandle}`;
    if (!targetCompetencies.has(key)) return true;
    const expected = input.targetRows.find(
      (targetRow) =>
        targetRow.moduleHandle === row.moduleHandle &&
        targetRow.competency.handle === row.competencyHandle,
    );
    return (
      !expected ||
      expected.isRequired !== row.isRequired ||
      expected.requirement !== row.requirement
    );
  });
  const extraGearTypes = gearRows.filter(
    (row) => !targetGearTypes.has(row.gearTypeId),
  );

  invariant(
    extraModules.length === 0 &&
      extraCompetencies.length === 0 &&
      extraGearTypes.length === 0,
    `Existing curriculum ${input.curriculumId} contains data outside this import`,
  );
}

async function resolveDatabaseImportPlan(
  source: SourceImportPlan,
  catalogHash: string,
): Promise<DatabaseImportPlan> {
  const query = useQuery();
  const courseHandles = unique(source.rows.map((row) => row.courseHandle));
  const programHandles = unique(source.rows.map((row) => row.programHandle));
  const moduleHandles = unique(source.rows.map((row) => row.moduleHandle));
  const competencyReferences = new Map<string, CompetencyReference>();
  for (const row of source.rows) {
    competencyReferences.set(row.competency.handle, row.competency);
  }
  const competencyHandles = [...competencyReferences.keys()];

  const [courses, degrees, modules, competencies, programs] = await Promise.all(
    [
      query
        .select({ id: schema.course.id, handle: schema.course.handle })
        .from(schema.course)
        .where(inArray(schema.course.handle, courseHandles)),
      query
        .select({ id: schema.degree.id, handle: schema.degree.handle })
        .from(schema.degree)
        .where(
          inArray(schema.degree.handle, ["niveau-4", "niveau-a", "niveau-b"]),
        ),
      query
        .select({ id: schema.module.id, handle: schema.module.handle })
        .from(schema.module)
        .where(inArray(schema.module.handle, moduleHandles)),
      query
        .select({
          id: schema.competency.id,
          handle: schema.competency.handle,
          title: schema.competency.title,
          type: schema.competency.type,
          weight: schema.competency.weight,
        })
        .from(schema.competency)
        .where(inArray(schema.competency.handle, competencyHandles)),
      query
        .select({
          id: schema.program.id,
          handle: schema.program.handle,
          title: schema.program.title,
          courseId: schema.program.courseId,
          degreeId: schema.program.degreeId,
        })
        .from(schema.program)
        .where(inArray(schema.program.handle, programHandles)),
    ],
  );

  invariant(
    courses.length === courseHandles.length,
    "Not all four target Jachtzeilen courses exist",
  );
  invariant(
    degrees.length === 3,
    "Degrees niveau-4, niveau-a and niveau-b must exist",
  );
  invariant(
    modules.length === moduleHandles.length,
    `Missing modules: ${moduleHandles
      .filter((handle) => !modules.some((module) => module.handle === handle))
      .join(", ")}`,
  );

  const competencyIds = new Map(
    competencies.map((competency) => [competency.handle, competency.id]),
  );
  for (const competency of competencies) {
    const reference = competencyReferences.get(competency.handle);
    invariant(reference, `Unexpected competency ${competency.handle}`);
    if (competency.handle === RRP_HANDLE) {
      invariant(
        competency.title === RRP_TITLE &&
          competency.type === "knowledge" &&
          competency.weight === RRP_WEIGHT,
        "Existing RR&P competency does not match the approved title and ordering",
      );
    }
  }
  const competenciesToCreate = competencyHandles
    .filter((handle) => !competencyIds.has(handle))
    .map((handle) => competencyReferences.get(handle))
    .filter((value): value is CompetencyReference => value !== undefined);
  const forbiddenMissing = competenciesToCreate.filter(
    (competency) => !competency.createIfMissing,
  );
  invariant(
    forbiddenMissing.length === 0,
    `Missing competencies without an approved create decision: ${forbiddenMissing
      .map((competency) => competency.handle)
      .join(", ")}`,
  );

  const courseByHandle = new Map(
    courses.map((course) => [course.handle, course.id]),
  );
  const degreeByHandle = new Map(
    degrees.map((degree) => [degree.handle, degree.id]),
  );
  const moduleByHandle = new Map(
    modules.map((module) => [module.handle, module.id]),
  );
  const programByHandle = new Map(
    programs.map((program) => [program.handle, program]),
  );

  const existingProgramIds = programs.map((program) => program.id);
  const curricula =
    existingProgramIds.length === 0
      ? []
      : await query
          .select({
            id: schema.curriculum.id,
            programId: schema.curriculum.programId,
            startedAt: schema.curriculum.startedAt,
          })
          .from(schema.curriculum)
          .where(
            and(
              inArray(schema.curriculum.programId, existingProgramIds),
              eq(schema.curriculum.revision, source.revision),
            ),
          );
  const curriculumByProgramId = new Map(
    curricula.map((curriculum) => [curriculum.programId, curriculum]),
  );

  const targets: DatabaseTargetPlan[] = [];
  for (const [programHandle, rows] of source.targets) {
    const firstRow = rows[0];
    invariant(firstRow, `No rows for target ${programHandle}`);
    const courseId = courseByHandle.get(firstRow.courseHandle);
    const degreeId = degreeByHandle.get(`niveau-${firstRow.niveau}`);
    invariant(courseId, `Course not found: ${firstRow.courseHandle}`);
    invariant(degreeId, `Degree not found: niveau-${firstRow.niveau}`);

    const existingProgram = programByHandle.get(programHandle) ?? null;
    if (existingProgram) {
      invariant(
        existingProgram.courseId === courseId &&
          existingProgram.degreeId === degreeId,
        `Existing program ${programHandle} points to the wrong course or degree`,
      );
      invariant(
        existingProgram.title === null || existingProgram.title === "",
        `Existing program ${programHandle} must not have a custom title`,
      );
    }

    const existingCurriculum = existingProgram
      ? (curriculumByProgramId.get(existingProgram.id) ?? null)
      : null;
    invariant(
      !existingCurriculum?.startedAt ||
        new Date(existingCurriculum.startedAt).valueOf() ===
          new Date(IMPORT_STARTED_AT).valueOf(),
      `Curriculum ${existingCurriculum?.id} has an unexpected activation date`,
    );

    const gearTypeIds = await loadUniformGearTypeIds(courseId);
    if (existingCurriculum) {
      await assertExistingDraftIsSubset({
        curriculumId: existingCurriculum.id,
        targetRows: rows,
        gearTypeIds,
      });
    }

    targets.push({
      programHandle,
      courseHandle: firstRow.courseHandle,
      courseId,
      degreeId,
      rows,
      moduleIds: new Map(
        unique(rows.map((row) => row.moduleHandle)).map((handle) => {
          const id = moduleByHandle.get(handle);
          invariant(id, `Module not found: ${handle}`);
          return [handle, id];
        }),
      ),
      gearTypeIds,
      existingProgramId: existingProgram?.id ?? null,
      existingCurriculumId: existingCurriculum?.id ?? null,
      existingCurriculumStartedAt: existingCurriculum?.startedAt ?? null,
    });
  }

  return {
    source,
    targets,
    competencyIds,
    competenciesToCreate,
    catalogHash,
  };
}

function printPlan(plan: DatabaseImportPlan) {
  console.log("Jachtzeilen 4/A/B import plan");
  console.log("=============================");
  console.log(`Revision: ${plan.source.revision}`);
  console.log(`Started at: ${IMPORT_STARTED_AT}`);
  console.log(`Source hash: ${plan.source.sourceHash}`);
  console.log(`Catalog hash: ${plan.catalogHash}`);
  console.log(`Source links: ${plan.source.sourceRows.length}`);
  console.log(`Materialized links: ${plan.source.rows.length}`);
  console.log(`Targets: ${plan.targets.length}`);
  console.log(
    `Normalized source links: ${plan.source.normalization.changed.length}`,
  );
  console.log(
    `New programs: ${plan.targets.filter((t) => !t.existingProgramId).length}`,
  );
  console.log(
    `New active curricula: ${plan.targets.filter((t) => !t.existingCurriculumId).length}`,
  );
  console.log(
    `New competencies: ${
      plan.competenciesToCreate
        .map((competency) => competency.handle)
        .join(", ") || "none"
    }`,
  );
  console.log("");

  for (const target of plan.targets) {
    console.log(
      `- ${target.programHandle}: ${target.rows.length} competencies, ${target.moduleIds.size} modules, ${target.gearTypeIds.length} gear types`,
    );
  }
}

async function applySharedTitleCorrections(): Promise<
  ImportManifest["correctedCompetencyTitles"]
> {
  const query = useQuery();
  const rows = await query
    .select({
      id: schema.competency.id,
      handle: schema.competency.handle,
      title: schema.competency.title,
    })
    .from(schema.competency)
    .where(
      inArray(
        schema.competency.handle,
        SHARED_COMPETENCY_TITLE_CORRECTIONS.map(
          (correction) => correction.handle,
        ),
      ),
    );
  invariant(
    rows.length === SHARED_COMPETENCY_TITLE_CORRECTIONS.length,
    "Not all shared competencies requiring title correction exist",
  );

  const changed: ImportManifest["correctedCompetencyTitles"] = [];
  for (const correction of SHARED_COMPETENCY_TITLE_CORRECTIONS) {
    const row = rows.find(
      (candidate) => candidate.handle === correction.handle,
    );
    invariant(row, `Shared competency not found: ${correction.handle}`);
    invariant(
      row.title === correction.oldTitle || row.title === correction.newTitle,
      `Unexpected title for shared competency ${correction.handle}`,
    );
    if (row.title === correction.newTitle) continue;

    const updated = await query
      .update(schema.competency)
      .set({ title: correction.newTitle })
      .where(
        and(
          eq(schema.competency.id, row.id),
          eq(schema.competency.title, correction.oldTitle),
        ),
      )
      .returning({ id: schema.competency.id });
    invariant(
      updated.length === 1,
      `Concurrent title change detected for ${correction.handle}`,
    );
    changed.push({
      competencyId: row.id,
      handle: correction.handle,
      from: correction.oldTitle,
      to: correction.newTitle,
    });
  }
  return changed;
}

async function createMissingCompetencies(plan: DatabaseImportPlan): Promise<{
  createdIds: string[];
  shiftedWeights: ImportManifest["shiftedCompetencyWeights"];
}> {
  const query = useQuery();
  if (plan.competenciesToCreate.length === 0) {
    return { createdIds: [], shiftedWeights: [] };
  }
  invariant(
    plan.competenciesToCreate.length === 1 &&
      plan.competenciesToCreate[0]?.handle === RRP_HANDLE,
    "Only the approved RR&P competency may be created",
  );

  const reglementen = await query
    .select({
      id: schema.competency.id,
      weight: schema.competency.weight,
    })
    .from(schema.competency)
    .where(eq(schema.competency.handle, "reglementen"));
  invariant(
    reglementen.length === 1 && reglementen[0]?.weight === REGLEMENTEN_WEIGHT,
    "Reglementen does not have the expected ordering weight",
  );

  const shifted = await query
    .update(schema.competency)
    .set({ weight: sql`${schema.competency.weight} + 1` })
    .where(sql`${schema.competency.weight} > ${REGLEMENTEN_WEIGHT}`)
    .returning({
      competencyId: schema.competency.id,
      handle: schema.competency.handle,
      weight: schema.competency.weight,
    });
  const shiftedWeights = shifted.map((row) => ({
    competencyId: row.competencyId,
    handle: row.handle,
    from: row.weight - 1,
    to: row.weight,
  }));

  const competency = plan.competenciesToCreate[0];
  invariant(competency, "RR&P competency plan is missing");
  const inserted = await query
    .insert(schema.competency)
    .values({
      handle: competency.handle,
      title: competency.title,
      type: competency.type,
      weight: RRP_WEIGHT,
    })
    .returning({ id: schema.competency.id });
  const id = inserted[0]?.id;
  invariant(id, `Failed to create competency ${competency.handle}`);
  plan.competencyIds.set(competency.handle, id);

  return { createdIds: [id], shiftedWeights };
}

async function verifyImportedTarget(input: {
  curriculumId: string;
  target: DatabaseTargetPlan;
  competencyIds: Map<string, string>;
}) {
  const query = useQuery();
  const [curriculumRows, moduleRows, competencyRows, gearRows] =
    await Promise.all([
      query
        .select({
          revision: schema.curriculum.revision,
          startedAt: schema.curriculum.startedAt,
        })
        .from(schema.curriculum)
        .where(eq(schema.curriculum.id, input.curriculumId)),
      query
        .select({ moduleId: schema.curriculumModule.moduleId })
        .from(schema.curriculumModule)
        .where(eq(schema.curriculumModule.curriculumId, input.curriculumId)),
      query
        .select({
          id: schema.curriculumCompetency.id,
          moduleId: schema.curriculumCompetency.moduleId,
          competencyId: schema.curriculumCompetency.competencyId,
          isRequired: schema.curriculumCompetency.isRequired,
          requirement: schema.curriculumCompetency.requirement,
        })
        .from(schema.curriculumCompetency)
        .where(
          eq(schema.curriculumCompetency.curriculumId, input.curriculumId),
        ),
      query
        .select({ gearTypeId: schema.curriculumGearLink.gearTypeId })
        .from(schema.curriculumGearLink)
        .where(eq(schema.curriculumGearLink.curriculumId, input.curriculumId)),
    ]);

  invariant(
    curriculumRows.length === 1 &&
      curriculumRows[0]?.revision ===
        JACHTZEILEN_AB_CONTENT_DECISIONS.revision &&
      new Date(curriculumRows[0].startedAt ?? "").valueOf() ===
        new Date(IMPORT_STARTED_AT).valueOf(),
    `Curriculum metadata mismatch for ${input.target.programHandle}`,
  );

  invariant(
    JSON.stringify(moduleRows.map((row) => row.moduleId).sort()) ===
      JSON.stringify([...input.target.moduleIds.values()].sort()),
    `Module count mismatch for ${input.target.programHandle}`,
  );
  const expectedCompetencies = input.target.rows
    .map((row) => {
      const moduleId = input.target.moduleIds.get(row.moduleHandle);
      const competencyId = input.competencyIds.get(row.competency.handle);
      invariant(moduleId, `Module ID missing: ${row.moduleHandle}`);
      invariant(
        competencyId,
        `Competency ID missing: ${row.competency.handle}`,
      );
      return JSON.stringify({
        moduleId,
        competencyId,
        isRequired: row.isRequired,
        requirement: row.requirement,
      });
    })
    .sort();
  const actualCompetencies = competencyRows
    .map((row) =>
      JSON.stringify({
        moduleId: row.moduleId,
        competencyId: row.competencyId,
        isRequired: row.isRequired,
        requirement: row.requirement,
      }),
    )
    .sort();
  invariant(
    JSON.stringify(actualCompetencies) === JSON.stringify(expectedCompetencies),
    `Competency count mismatch for ${input.target.programHandle}`,
  );
  invariant(
    JSON.stringify(gearRows.map((row) => row.gearTypeId).sort()) ===
      JSON.stringify([...input.target.gearTypeIds].sort()),
    `Gear-type count mismatch for ${input.target.programHandle}`,
  );
}

async function loadTargetLinkState(curriculumId: string): Promise<{
  moduleIds: Set<string>;
  competencyLinkIds: Set<string>;
  gearTypeIds: Set<string>;
}> {
  const query = useQuery();
  const [moduleRows, competencyRows, gearRows] = await Promise.all([
    query
      .select({ moduleId: schema.curriculumModule.moduleId })
      .from(schema.curriculumModule)
      .where(eq(schema.curriculumModule.curriculumId, curriculumId)),
    query
      .select({ id: schema.curriculumCompetency.id })
      .from(schema.curriculumCompetency)
      .where(eq(schema.curriculumCompetency.curriculumId, curriculumId)),
    query
      .select({ gearTypeId: schema.curriculumGearLink.gearTypeId })
      .from(schema.curriculumGearLink)
      .where(eq(schema.curriculumGearLink.curriculumId, curriculumId)),
  ]);
  return {
    moduleIds: new Set(moduleRows.map((row) => row.moduleId)),
    competencyLinkIds: new Set(competencyRows.map((row) => row.id)),
    gearTypeIds: new Set(gearRows.map((row) => row.gearTypeId)),
  };
}

async function applyImport(plan: DatabaseImportPlan): Promise<ImportManifest> {
  return withTransaction(async () => {
    const transactionCatalog = await readJachtzeilenCatalogFingerprint();
    invariant(
      transactionCatalog.hash === plan.catalogHash,
      `Catalog changed after planning. Expected ${plan.catalogHash}, got ${transactionCatalog.hash}`,
    );

    const query = useQuery();
    const createdProgramIds: string[] = [];
    const createdCurriculumIds: string[] = [];
    for (const target of plan.targets) {
      if (target.existingCurriculumId) {
        await assertExistingDraftIsSubset({
          curriculumId: target.existingCurriculumId,
          targetRows: target.rows,
          gearTypeIds: target.gearTypeIds,
        });
      }
    }
    const correctedCompetencyTitles = await applySharedTitleCorrections();
    const { createdIds: createdCompetencyIds, shiftedWeights } =
      await createMissingCompetencies(plan);
    const manifestTargets: ImportManifest["targets"] = [];

    for (const target of plan.targets) {
      let programId = target.existingProgramId;
      if (!programId) {
        const inserted = await query
          .insert(schema.program)
          .values({
            handle: target.programHandle,
            courseId: target.courseId,
            degreeId: target.degreeId,
          })
          .returning({ id: schema.program.id });
        programId = inserted[0]?.id ?? null;
        invariant(
          programId,
          `Failed to create program ${target.programHandle}`,
        );
        createdProgramIds.push(programId);
      }

      let curriculumId = target.existingCurriculumId;
      const curriculumWasCreated = !curriculumId;
      let previousStartedAt = target.existingCurriculumStartedAt;
      if (!curriculumId) {
        const inserted = await query
          .insert(schema.curriculum)
          .values({
            programId,
            revision: plan.source.revision,
            startedAt: IMPORT_STARTED_AT,
          })
          .returning({ id: schema.curriculum.id });
        curriculumId = inserted[0]?.id ?? null;
        invariant(
          curriculumId,
          `Failed to create curriculum for ${target.programHandle}`,
        );
        createdCurriculumIds.push(curriculumId);
      } else {
        const existingRows = await query
          .select({ startedAt: schema.curriculum.startedAt })
          .from(schema.curriculum)
          .where(eq(schema.curriculum.id, curriculumId));
        const currentStartedAt = existingRows[0]?.startedAt ?? null;
        previousStartedAt = currentStartedAt;
        invariant(
          existingRows.length === 1 &&
            (!currentStartedAt ||
              new Date(currentStartedAt).valueOf() ===
                new Date(IMPORT_STARTED_AT).valueOf()),
          `Curriculum ${curriculumId} changed after planning`,
        );
        if (!currentStartedAt) {
          const updated = await query
            .update(schema.curriculum)
            .set({ startedAt: IMPORT_STARTED_AT })
            .where(
              and(
                eq(schema.curriculum.id, curriculumId),
                sql`${schema.curriculum.startedAt} IS NULL`,
              ),
            )
            .returning({ id: schema.curriculum.id });
          invariant(
            updated.length === 1,
            `Could not activate curriculum ${curriculumId}`,
          );
        }
      }

      const before = curriculumWasCreated
        ? {
            moduleIds: new Set<string>(),
            competencyLinkIds: new Set<string>(),
            gearTypeIds: new Set<string>(),
          }
        : await loadTargetLinkState(curriculumId);

      await query
        .insert(schema.curriculumModule)
        .values(
          [...target.moduleIds.values()].map((moduleId) => ({
            curriculumId,
            moduleId,
          })),
        )
        .onConflictDoNothing();

      await query
        .insert(schema.curriculumCompetency)
        .values(
          target.rows.map((row) => {
            const moduleId = target.moduleIds.get(row.moduleHandle);
            const competencyId = plan.competencyIds.get(row.competency.handle);
            invariant(moduleId, `Module ID missing: ${row.moduleHandle}`);
            invariant(
              competencyId,
              `Competency ID missing: ${row.competency.handle}`,
            );
            return {
              curriculumId,
              moduleId,
              competencyId,
              isRequired: row.isRequired,
              requirement: row.requirement,
            };
          }),
        )
        .onConflictDoNothing();

      await query
        .insert(schema.curriculumGearLink)
        .values(
          target.gearTypeIds.map((gearTypeId) => ({
            curriculumId,
            gearTypeId,
          })),
        )
        .onConflictDoNothing();

      await verifyImportedTarget({
        curriculumId,
        target,
        competencyIds: plan.competencyIds,
      });
      const after = await loadTargetLinkState(curriculumId);
      manifestTargets.push({
        programHandle: target.programHandle,
        programId,
        curriculumId,
        courseHandle: target.courseHandle,
        competencyCount: target.rows.length,
        moduleCount: target.moduleIds.size,
        gearTypeCount: target.gearTypeIds.length,
        curriculumWasCreated,
        previousStartedAt,
        createdModuleIds: [...after.moduleIds].filter(
          (id) => !before.moduleIds.has(id),
        ),
        createdCompetencyLinkIds: [...after.competencyLinkIds].filter(
          (id) => !before.competencyLinkIds.has(id),
        ),
        createdGearTypeIds: [...after.gearTypeIds].filter(
          (id) => !before.gearTypeIds.has(id),
        ),
      });
    }

    const postImportCatalog = await readJachtzeilenCatalogFingerprint();
    invariant(
      postImportCatalog.hash === plan.catalogHash,
      `Catalog fingerprint changed unexpectedly during import: ${postImportCatalog.hash}`,
    );

    return {
      kind: "jachtzeilen-ab-import",
      version: 2,
      createdAt: new Date().toISOString(),
      sourceHash: plan.source.sourceHash,
      catalogHash: plan.catalogHash,
      revision: plan.source.revision,
      startedAt: IMPORT_STARTED_AT,
      createdProgramIds,
      createdCurriculumIds,
      createdCompetencyIds,
      shiftedCompetencyWeights: shiftedWeights,
      correctedCompetencyTitles,
      normalization: plan.source.normalization,
      targets: manifestTargets,
    };
  });
}

function readManifest(manifestPath: string): ImportManifest {
  const parsed = JSON.parse(
    fs.readFileSync(manifestPath, "utf8"),
  ) as ImportManifest;
  invariant(
    parsed.kind === "jachtzeilen-ab-import" && parsed.version === 2,
    "Unsupported manifest",
  );
  invariant(
    parsed.sourceHash === EXPECTED_SOURCE_SHA256,
    "Manifest source hash does not match the reviewed CSV",
  );
  invariant(
    /^[a-f0-9]{64}$/.test(parsed.catalogHash),
    "Manifest catalog hash is invalid",
  );
  invariant(
    sameInstant(parsed.startedAt, IMPORT_STARTED_AT),
    "Manifest activation date is invalid",
  );
  invariant(
    parsed.revision === JACHTZEILEN_AB_CONTENT_DECISIONS.revision,
    "Manifest revision is invalid",
  );
  invariant(
    parsed.targets.length === EXPECTED_TARGET_COUNT &&
      JSON.stringify(
        parsed.targets.map((target) => target.programHandle).sort(),
      ) === JSON.stringify(Object.keys(EXPECTED_LINK_COUNTS_BY_PROGRAM).sort()),
    "Manifest target set is invalid",
  );
  invariant(
    parsed.targets.every(
      (target) =>
        target.competencyCount ===
          EXPECTED_LINK_COUNTS_BY_PROGRAM[
            target.programHandle as keyof typeof EXPECTED_LINK_COUNTS_BY_PROGRAM
          ] && target.gearTypeCount === EXPECTED_GEAR_TYPE_COUNT,
    ),
    "Manifest target counts are invalid",
  );
  return parsed;
}

function writeManifest(
  manifest: ImportManifest,
  requestedPath?: string,
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const manifestPath =
    requestedPath ??
    path.join(
      process.cwd(),
      `.jachtzeilen-ab-import-manifest-${timestamp}.json`,
    );
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, {
    mode: 0o600,
  });
  return manifestPath;
}

async function inspectRollback(manifest: ImportManifest) {
  const query = useQuery();
  const curriculumIds = unique(
    manifest.targets.map((target) => target.curriculumId),
  );
  const [catalog, curricula, studentRows, certificateRows] = await Promise.all([
    readJachtzeilenCatalogFingerprint(),
    query
      .select({
        id: schema.curriculum.id,
        revision: schema.curriculum.revision,
        startedAt: schema.curriculum.startedAt,
      })
      .from(schema.curriculum)
      .where(inArray(schema.curriculum.id, curriculumIds)),
    query
      .select({ id: schema.studentCurriculum.id })
      .from(schema.studentCurriculum)
      .where(inArray(schema.studentCurriculum.curriculumId, curriculumIds))
      .limit(1),
    query
      .select({ id: schema.certificate.id })
      .from(schema.certificate)
      .innerJoin(
        schema.studentCurriculum,
        eq(schema.studentCurriculum.id, schema.certificate.studentCurriculumId),
      )
      .where(inArray(schema.studentCurriculum.curriculumId, curriculumIds))
      .limit(1),
  ]);

  invariant(
    catalog.hash === manifest.catalogHash,
    `Rollback refused: catalog hash mismatch (${catalog.hash})`,
  );
  invariant(
    curricula.length === curriculumIds.length &&
      curricula.every(
        (curriculum) =>
          curriculum.revision === manifest.revision &&
          new Date(curriculum.startedAt ?? "").valueOf() ===
            new Date(manifest.startedAt).valueOf(),
      ),
    "Rollback refused: imported curriculum metadata changed",
  );
  invariant(
    studentRows.length === 0,
    "Rollback refused: at least one student is linked to an imported curriculum",
  );
  invariant(
    certificateRows.length === 0,
    "Rollback refused: at least one certificate is linked to an imported curriculum",
  );

  if (manifest.shiftedCompetencyWeights.length > 0) {
    const shiftedRows = await query
      .select({
        id: schema.competency.id,
        weight: schema.competency.weight,
      })
      .from(schema.competency)
      .where(
        inArray(
          schema.competency.id,
          manifest.shiftedCompetencyWeights.map((entry) => entry.competencyId),
        ),
      );
    invariant(
      shiftedRows.length === manifest.shiftedCompetencyWeights.length &&
        shiftedRows.every((row) => {
          const expected = manifest.shiftedCompetencyWeights.find(
            (entry) => entry.competencyId === row.id,
          );
          return expected?.to === row.weight;
        }),
      "Rollback refused: shifted competency weights changed",
    );
  }

  if (manifest.correctedCompetencyTitles.length > 0) {
    const titleRows = await query
      .select({
        id: schema.competency.id,
        title: schema.competency.title,
      })
      .from(schema.competency)
      .where(
        inArray(
          schema.competency.id,
          manifest.correctedCompetencyTitles.map((entry) => entry.competencyId),
        ),
      );
    invariant(
      titleRows.length === manifest.correctedCompetencyTitles.length &&
        titleRows.every((row) => {
          const expected = manifest.correctedCompetencyTitles.find(
            (entry) => entry.competencyId === row.id,
          );
          return expected?.to === row.title;
        }),
      "Rollback refused: corrected competency titles changed",
    );
  }

  for (const target of manifest.targets.filter(
    (candidate) => !candidate.curriculumWasCreated,
  )) {
    const state = await loadTargetLinkState(target.curriculumId);
    invariant(
      target.createdModuleIds.every((id) => state.moduleIds.has(id)) &&
        target.createdCompetencyLinkIds.every((id) =>
          state.competencyLinkIds.has(id),
        ) &&
        target.createdGearTypeIds.every((id) => state.gearTypeIds.has(id)),
      `Rollback refused: imported links changed for ${target.programHandle}`,
    );
  }
}

async function rollbackImport(manifest: ImportManifest) {
  await withTransaction(async () => {
    await inspectRollback(manifest);
    const query = useQuery();
    const curriculumIds = manifest.createdCurriculumIds;

    for (const target of manifest.targets.filter(
      (candidate) => !candidate.curriculumWasCreated,
    )) {
      if (target.createdCompetencyLinkIds.length > 0) {
        await query
          .delete(schema.curriculumCompetency)
          .where(
            inArray(
              schema.curriculumCompetency.id,
              target.createdCompetencyLinkIds,
            ),
          );
      }
      if (target.createdGearTypeIds.length > 0) {
        await query
          .delete(schema.curriculumGearLink)
          .where(
            and(
              eq(schema.curriculumGearLink.curriculumId, target.curriculumId),
              inArray(
                schema.curriculumGearLink.gearTypeId,
                target.createdGearTypeIds,
              ),
            ),
          );
      }
      if (target.createdModuleIds.length > 0) {
        await query
          .delete(schema.curriculumModule)
          .where(
            and(
              eq(schema.curriculumModule.curriculumId, target.curriculumId),
              inArray(
                schema.curriculumModule.moduleId,
                target.createdModuleIds,
              ),
            ),
          );
      }
      if (!sameInstant(target.previousStartedAt, manifest.startedAt)) {
        const updated = await query
          .update(schema.curriculum)
          .set({ startedAt: target.previousStartedAt })
          .where(
            and(
              eq(schema.curriculum.id, target.curriculumId),
              eq(schema.curriculum.startedAt, manifest.startedAt),
            ),
          )
          .returning({ id: schema.curriculum.id });
        invariant(
          updated.length === 1,
          `Rollback refused: activation changed for ${target.programHandle}`,
        );
      }
    }

    if (curriculumIds.length > 0) {
      await query
        .delete(schema.curriculumCompetency)
        .where(
          inArray(schema.curriculumCompetency.curriculumId, curriculumIds),
        );
      await query
        .delete(schema.curriculumModule)
        .where(inArray(schema.curriculumModule.curriculumId, curriculumIds));
      await query
        .delete(schema.curriculumGearLink)
        .where(inArray(schema.curriculumGearLink.curriculumId, curriculumIds));
      await query
        .delete(schema.curriculum)
        .where(inArray(schema.curriculum.id, curriculumIds));
    }

    if (manifest.createdProgramIds.length > 0) {
      const remainingCurricula = await query
        .select({ id: schema.curriculum.id })
        .from(schema.curriculum)
        .where(inArray(schema.curriculum.programId, manifest.createdProgramIds))
        .limit(1);
      invariant(
        remainingCurricula.length === 0,
        "Rollback refused: a created program has another curriculum",
      );
      await query
        .delete(schema.program)
        .where(inArray(schema.program.id, manifest.createdProgramIds));
    }

    if (manifest.createdCompetencyIds.length > 0) {
      const remainingLinks = await query
        .select({ id: schema.curriculumCompetency.id })
        .from(schema.curriculumCompetency)
        .where(
          inArray(
            schema.curriculumCompetency.competencyId,
            manifest.createdCompetencyIds,
          ),
        )
        .limit(1);
      invariant(
        remainingLinks.length === 0,
        "Rollback refused: a created competency is linked elsewhere",
      );
      await query
        .delete(schema.competency)
        .where(inArray(schema.competency.id, manifest.createdCompetencyIds));
    }

    for (const entry of manifest.shiftedCompetencyWeights) {
      const updated = await query
        .update(schema.competency)
        .set({ weight: entry.from })
        .where(
          and(
            eq(schema.competency.id, entry.competencyId),
            eq(schema.competency.weight, entry.to),
          ),
        )
        .returning({ id: schema.competency.id });
      invariant(
        updated.length === 1,
        `Rollback refused: competency weight changed for ${entry.handle}`,
      );
    }

    for (const entry of manifest.correctedCompetencyTitles) {
      const updated = await query
        .update(schema.competency)
        .set({ title: entry.from })
        .where(
          and(
            eq(schema.competency.id, entry.competencyId),
            eq(schema.competency.title, entry.to),
          ),
        )
        .returning({ id: schema.competency.id });
      invariant(
        updated.length === 1,
        `Rollback refused: competency title changed for ${entry.handle}`,
      );
    }

    const catalog = await readJachtzeilenCatalogFingerprint();
    invariant(
      catalog.hash === manifest.catalogHash,
      `Rollback produced catalog hash ${catalog.hash}, expected ${manifest.catalogHash}`,
    );
  });
}

export function parseCliOptions(args: string[]): CliOptions {
  const options: CliOptions = {
    command: "plan",
    execute: false,
  };
  let commandSeen = false;

  for (const arg of args) {
    if (arg === "--") continue;
    if (!arg.startsWith("-") && !commandSeen) {
      invariant(
        arg === "plan" ||
          arg === "import" ||
          arg === "rollback" ||
          arg === "verify-local",
        `Unknown command: ${arg}`,
      );
      options.command = arg;
      commandSeen = true;
      continue;
    }
    if (arg === "--execute") {
      options.execute = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    const [name, value] = arg.split("=", 2);
    invariant(value, `Option ${name} requires =VALUE`);
    if (name === "--file") options.filePath = value;
    else if (name === "--manifest") options.manifestPath = value;
    else if (name === "--pg-uri") options.pgUri = value;
    else if (name === "--expected-catalog-hash") {
      options.expectedCatalogHash = value;
    } else if (name === "--attestation") options.attestationPath = value;
    else throw new Error(`Unknown option: ${name}`);
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- plan --file=/path/source.csv
  pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- import --file=/path/source.csv --expected-catalog-hash=SHA256 --execute
  pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- verify-local --file=/path/source.csv --pg-uri=postgresql://postgres:postgres@127.0.0.1:54322/postgres --execute
  pnpm --filter @nawadi/scripts import:jachtzeilen-ab -- rollback --manifest=/path/manifest.json --execute

Safety:
  - plan is read-only.
  - import requires --execute and the catalog hash tested locally.
  - all nine revision 2601 curricula are active from ${IMPORT_STARTED_AT}.
  - import and rollback are atomic and fail closed on unexpected data.
  - the reviewed CSV SHA-256 is enforced.
`);
}

async function buildDatabasePlan(
  options: CliOptions,
): Promise<DatabaseImportPlan> {
  invariant(options.filePath, "--file is required");
  const { sourceHash, rows } = loadSourceFile(options.filePath);
  const sourceRows = parseWideJachtzeilenSheet(rows);
  const sourcePlan = buildSourceImportPlan({
    sourceRows,
    sourceHash,
    decisions: JACHTZEILEN_AB_CONTENT_DECISIONS,
  });
  const catalog = await readJachtzeilenCatalogFingerprint();
  if (options.expectedCatalogHash) {
    invariant(
      options.expectedCatalogHash === catalog.hash,
      `Catalog hash mismatch. Expected ${options.expectedCatalogHash}, got ${catalog.hash}`,
    );
  }
  return resolveDatabaseImportPlan(sourcePlan, catalog.hash);
}

async function runPlanOrImport(options: CliOptions) {
  const databasePlan = await buildDatabasePlan(options);
  printPlan(databasePlan);

  if (options.command !== "import" || !options.execute) {
    console.log("");
    console.log(
      "Dry run only. Use the import command with --execute to write.",
    );
    return;
  }

  invariant(
    options.expectedCatalogHash,
    "--expected-catalog-hash is required for an executing import",
  );
  invariant(
    options.expectedCatalogHash === databasePlan.catalogHash,
    "The expected catalog hash does not match the planned catalog",
  );
  const manifest = await applyImport(databasePlan);
  const manifestPath = writeManifest(manifest, options.manifestPath);
  console.log("");
  console.log(`Import committed. All nine curricula are active.`);
  console.log(`Manifest: ${manifestPath}`);
}

function assertLocalPgUri(pgUri: string) {
  let url: URL;
  try {
    url = new URL(pgUri);
  } catch {
    throw new Error("verify-local requires a PostgreSQL URL");
  }
  invariant(
    url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "::1",
    "verify-local is restricted to localhost",
  );
}

function writeAttestation(
  value: Record<string, unknown>,
  requestedPath?: string,
): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filePath = path.resolve(
    requestedPath ??
      path.join(
        process.cwd(),
        `.jachtzeilen-ab-local-attestation-${timestamp}.json`,
      ),
  );
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, {
    mode: 0o600,
  });
  return filePath;
}

async function runLocalVerification(options: CliOptions) {
  invariant(options.pgUri, "verify-local requires --pg-uri");
  assertLocalPgUri(options.pgUri);
  const initialPlan = await buildDatabasePlan(options);
  printPlan(initialPlan);
  if (!options.execute) {
    console.log("Dry run only. Add --execute to run the local lifecycle test.");
    return;
  }

  const firstManifest = await applyImport(initialPlan);
  const rerunPlan = await buildDatabasePlan({
    ...options,
    expectedCatalogHash: initialPlan.catalogHash,
  });
  invariant(
    rerunPlan.targets.every(
      (target) =>
        target.existingProgramId !== null &&
        target.existingCurriculumId !== null,
    ) && rerunPlan.competenciesToCreate.length === 0,
    "Idempotency check failed while planning the rerun",
  );
  const rerunManifest = await applyImport(rerunPlan);
  invariant(
    rerunManifest.createdProgramIds.length === 0 &&
      rerunManifest.createdCurriculumIds.length === 0 &&
      rerunManifest.createdCompetencyIds.length === 0 &&
      rerunManifest.shiftedCompetencyWeights.length === 0 &&
      rerunManifest.correctedCompetencyTitles.length === 0 &&
      rerunManifest.targets.every(
        (target) =>
          target.createdModuleIds.length === 0 &&
          target.createdCompetencyLinkIds.length === 0 &&
          target.createdGearTypeIds.length === 0,
      ),
    "Idempotency check created or changed data",
  );

  const tamperedSourceRows = initialPlan.source.sourceRows.map((row, index) =>
    index === 0
      ? {
          ...row,
          requirement: `${row.requirement} Onverwachte wijziging.`,
        }
      : row,
  );
  const tamperedSource = buildSourceImportPlan({
    sourceRows: tamperedSourceRows,
    sourceHash: initialPlan.source.sourceHash,
    decisions: JACHTZEILEN_AB_CONTENT_DECISIONS,
  });
  let failClosedPassed = false;
  try {
    await resolveDatabaseImportPlan(tamperedSource, initialPlan.catalogHash);
  } catch (error) {
    failClosedPassed =
      error instanceof Error &&
      error.message.includes("contains data outside this import");
  }
  invariant(failClosedPassed, "Fail-closed lifecycle check did not fail");

  await rollbackImport(firstManifest);
  const afterRollback = await readJachtzeilenCatalogFingerprint();
  invariant(
    afterRollback.hash === initialPlan.catalogHash,
    "Catalog hash did not return to baseline after rollback",
  );

  const reimportPlan = await buildDatabasePlan({
    ...options,
    expectedCatalogHash: initialPlan.catalogHash,
  });
  const finalManifest = await applyImport(reimportPlan);
  const finalManifestPath = writeManifest(finalManifest, options.manifestPath);
  const attestationPath = writeAttestation(
    {
      kind: "jachtzeilen-ab-local-verification",
      version: 1,
      verifiedAt: new Date().toISOString(),
      sourceHash: initialPlan.source.sourceHash,
      catalogHash: initialPlan.catalogHash,
      revision: initialPlan.source.revision,
      startedAt: IMPORT_STARTED_AT,
      targetCount: initialPlan.targets.length,
      sourceLinkCount: initialPlan.source.sourceRows.length,
      materializedLinkCount: initialPlan.source.rows.length,
      checks: {
        initialImport: true,
        exactCountsAndActivation: true,
        idempotentRerun: true,
        failClosedOnChangedRequirement: true,
        manifestGenerated: true,
        rollback: true,
        reimport: true,
      },
      finalManifestPath,
    },
    options.attestationPath,
  );
  console.log(`Local lifecycle verification passed: ${attestationPath}`);
  console.log(`Final local import manifest: ${finalManifestPath}`);
}

async function runRollback(options: CliOptions) {
  invariant(options.manifestPath, "--manifest is required");
  const manifest = readManifest(options.manifestPath);
  await inspectRollback(manifest);
  console.log(
    `Rollback plan: ${manifest.createdCurriculumIds.length} curricula, ${manifest.createdProgramIds.length} programs, ${manifest.createdCompetencyIds.length} competencies`,
  );
  if (!options.execute) {
    console.log("Dry run only. Add --execute to roll back.");
    return;
  }
  await rollbackImport(manifest);
  console.log("Rollback committed.");
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));
  const pgUri = options.pgUri ?? process.env.PGURI;
  invariant(pgUri, "PGURI or --pg-uri is required");

  await withDatabase(
    {
      connectionString: pgUri,
      max: 1,
    },
    async () => {
      if (options.command === "rollback") {
        await runRollback(options);
      } else if (options.command === "verify-local") {
        await runLocalVerification(options);
      } else {
        await runPlanOrImport(options);
      }
    },
  );
}

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  return Boolean(entry && import.meta.url === pathToFileURL(entry).href);
}

if (isDirectExecution()) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
