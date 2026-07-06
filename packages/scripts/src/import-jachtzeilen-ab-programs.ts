import {
  Course,
  Curriculum,
  useQuery,
  withDatabase,
  withSupabaseClient,
  withTransaction,
} from "@nawadi/core";
import "dotenv/config";
import assert from "node:assert";
import fs from "node:fs";
import { pathToFileURL } from "node:url";
import { schema } from "@nawadi/db";
import slugify from "@sindresorhus/slugify";
import { eq } from "drizzle-orm";
import inquirer from "inquirer";
import pkg from "xlsx";

const { read, utils } = pkg;

function loadWorkbookFromPath(filePath: string) {
  const normalizedPath = filePath.trim().replace(/^["']|["']$/g, "");

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }

  // xlsx ESM build does not wire up Node fs for readFile(); read via buffer instead.
  const buffer = fs.readFileSync(normalizedPath);
  return read(buffer, { type: "buffer" });
}

const REVISION = "2601";
const REVISION_STARTED_AT = "2026-01-01T00:00:00.000Z";

const MODULE_HANDLE_OVERRIDES: Record<string, string> = {
  basis: "basis-jz",
  theorie: "theorie-jz",
  "basis-jz": "basis-jz",
  "theorie-jz": "theorie-jz",
};

const VAARWATER_ALIASES: Record<string, string> = {
  "Wad en Zeegaten": "Waddenzee en Zeeuwse Stromen",
};

type Niveau = "4" | "a" | "b";

export interface ImportRow {
  vaarwater: string;
  niveau: Niveau;
  moduleTitle: string;
  moduleHandle: string;
  competencyTitle: string;
  competencyHandle: string;
  isRequired: boolean;
  eis: string;
  programHandle: string;
}

interface DataColumn {
  columnIndex: number;
  vaarwater: string;
  niveau: Niveau;
}

interface EntityRecord<T = { id: string }> {
  handle: string;
  exists: boolean;
  entity: T | null;
  affectedRows: ImportRow[];
}

interface ProgramEntityRecord extends EntityRecord {
  handle: string;
  title: string;
  vaarwater: string;
  niveau: Niveau;
}

interface ModuleEntityRecord extends EntityRecord {
  title: string;
}

interface CompetencyEntityRecord extends EntityRecord {
  title: string;
  moduleTitle: string;
}

export interface ImportPlan {
  rows: ImportRow[];
  parseStats: {
    defaultedKeuzeCount: number;
    skippedEmptyEis: number;
  };
  programs: Map<string, ProgramEntityRecord>;
  modules: Map<string, ModuleEntityRecord>;
  competencies: Map<string, CompetencyEntityRecord>;
  moduleWeights: Map<string, number>;
}

export type CreationDecisions = Map<string, boolean>;

function normalizeVaarwater(name: string): string {
  const trimmed = name.trim();
  return VAARWATER_ALIASES[trimmed] ?? trimmed;
}

function parseNiveau(cell: unknown): Niveau | null {
  const match = String(cell ?? "")
    .trim()
    .match(/^Niveau\s+(4|[AB])$/i);
  if (!match?.[1]) return null;
  const value = match[1].toUpperCase();
  if (value === "4") return "4";
  if (value === "A") return "a";
  if (value === "B") return "b";
  return null;
}

function resolveModuleHandle(moduleTitle: string): string {
  const slug = slugify(moduleTitle);
  return MODULE_HANDLE_OVERRIDES[slug] ?? slug;
}

function resolveProgramHandle(vaarwater: string, niveau: Niveau): string {
  return `jacht-kajuitzeilen-${slugify(vaarwater)}-volwassenen-${niveau}`;
}

function deriveProgramTitle(vaarwater: string, niveau: Niveau): string {
  const niveauLabel = niveau === "4" ? "4" : niveau.toUpperCase();
  return `Jacht/kajuitzeilen ${vaarwater} Volwassenen ${niveauLabel}`;
}

function parseIsRequired(voCell: unknown): boolean {
  return String(voCell ?? "")
    .trim()
    .toUpperCase() === "V";
}

function truncate(text: string, maxLength: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1)}…`;
}

function detectDataColumns(rows: unknown[][]): DataColumn[] {
  if (rows.length < 2) return [];

  const vaarwaterRow = rows[0] ?? [];
  const headerRow = rows[1] ?? [];
  const columns: DataColumn[] = [];
  let currentVaarwater = "";

  for (let columnIndex = 0; columnIndex < headerRow.length; columnIndex++) {
    const vaarwaterCell = String(vaarwaterRow[columnIndex] ?? "").trim();
    if (vaarwaterCell) {
      currentVaarwater = normalizeVaarwater(vaarwaterCell);
    }

    const niveau = parseNiveau(headerRow[columnIndex]);
    if (!niveau || !currentVaarwater) continue;

    columns.push({
      columnIndex,
      vaarwater: currentVaarwater,
      niveau,
    });
  }

  return columns;
}

export function parseWideJachtzeilenSheet(rows: unknown[][]): {
  rows: ImportRow[];
  defaultedKeuzeCount: number;
  skippedEmptyEis: number;
} {
  const dataColumns = detectDataColumns(rows);
  const importRows: ImportRow[] = [];
  let defaultedKeuzeCount = 0;
  let skippedEmptyEis = 0;
  const moduleOrder: string[] = [];

  for (let rowIndex = 2; rowIndex < rows.length; rowIndex++) {
    const row = rows[rowIndex] ?? [];
    const moduleTitle = String(row[0] ?? "").trim();
    const voCell = row[1];
    const competencyTitle = String(row[2] ?? "").trim();

    if (!moduleTitle || !competencyTitle) continue;

    if (!moduleOrder.includes(moduleTitle)) {
      moduleOrder.push(moduleTitle);
    }

    const voValue = String(voCell ?? "").trim();
    if (!voValue) defaultedKeuzeCount++;

    const moduleHandle = resolveModuleHandle(moduleTitle);
    const competencyHandle = slugify(competencyTitle);
    const isRequired = parseIsRequired(voCell);

    for (const column of dataColumns) {
      const eis = String(row[column.columnIndex] ?? "").trim();
      if (!eis) {
        skippedEmptyEis++;
        continue;
      }

      importRows.push({
        vaarwater: column.vaarwater,
        niveau: column.niveau,
        moduleTitle,
        moduleHandle,
        competencyTitle,
        competencyHandle,
        isRequired,
        eis,
        programHandle: resolveProgramHandle(column.vaarwater, column.niveau),
      });
    }
  }

  return { rows: importRows, defaultedKeuzeCount, skippedEmptyEis };
}

function addAffectedRow<T extends { affectedRows: ImportRow[] }>(
  map: Map<string, T>,
  key: string,
  factory: () => T,
  row: ImportRow,
) {
  const existing = map.get(key) ?? factory();
  if (!existing.affectedRows.includes(row)) {
    existing.affectedRows.push(row);
  }
  map.set(key, existing);
}

export async function resolveImportPlan(
  parsedRows: ImportRow[],
  parseStats: { defaultedKeuzeCount: number; skippedEmptyEis: number },
): Promise<ImportPlan> {
  const programs = new Map<string, ProgramEntityRecord>();
  const modules = new Map<string, ModuleEntityRecord>();
  const competencies = new Map<string, CompetencyEntityRecord>();
  const moduleWeights = new Map<string, number>();
  let moduleWeightCounter = 0;

  for (const row of parsedRows) {
    if (!moduleWeights.has(row.moduleHandle)) {
      moduleWeightCounter++;
      moduleWeights.set(row.moduleHandle, moduleWeightCounter);
    }

    addAffectedRow(
      programs,
      row.programHandle,
      () => ({
        handle: row.programHandle,
        title: deriveProgramTitle(row.vaarwater, row.niveau),
        vaarwater: row.vaarwater,
        niveau: row.niveau,
        exists: false,
        entity: null,
        affectedRows: [],
      }),
      row,
    );

    addAffectedRow(
      modules,
      row.moduleHandle,
      () => ({
        handle: row.moduleHandle,
        title: row.moduleTitle,
        exists: false,
        entity: null,
        affectedRows: [],
      }),
      row,
    );

    addAffectedRow(
      competencies,
      row.competencyHandle,
      () => ({
        handle: row.competencyHandle,
        title: row.competencyTitle,
        moduleTitle: row.moduleTitle,
        exists: false,
        entity: null,
        affectedRows: [],
      }),
      row,
    );
  }

  await Promise.all([
    ...[...programs.values()].map(async (program) => {
      program.entity = await Course.Program.fromHandle(program.handle);
      program.exists = program.entity !== null;
    }),
    ...[...modules.values()].map(async (module) => {
      module.entity = await Course.Module.fromHandle(module.handle);
      module.exists = module.entity !== null;
    }),
    ...[...competencies.values()].map(async (competency) => {
      competency.entity = await Course.Competency.fromHandle(competency.handle);
      competency.exists = competency.entity !== null;
    }),
  ]);

  return {
    rows: parsedRows,
    parseStats,
    programs,
    modules,
    competencies,
    moduleWeights,
  };
}

function formatSampleList(items: string[], maxItems: number): string {
  const shown = items.slice(0, maxItems);
  const lines = shown.map((item) => `  • ${item}`);
  if (items.length > maxItems) {
    lines.push(`  … and ${items.length - maxItems} more`);
  }
  return lines.join("\n");
}

function buildProgramPromptMessage(program: ProgramEntityRecord): string {
  const sampleCompetencies = [
    ...new Set(
      program.affectedRows.map(
        (row) => `${row.competencyTitle} (module: ${row.moduleTitle})`,
      ),
    ),
  ];

  return [
    "MISSING PROGRAM (level)",
    "",
    `Handle:    ${program.handle}`,
    `Title:     ${program.title} (derived)`,
    `Vaarwater: ${program.vaarwater}`,
    `Niveau:    ${program.niveau.toUpperCase()}`,
    "",
    "Problem:   This opleidingsprogramma does not exist in the database.",
    "           Without it, no curriculum revision 2601 can be created for this level.",
    "",
    `Affected:  ${program.affectedRows.length} import rows from the Excel file will be skipped if you decline.`,
    "",
    "Sample competencies that would be linked:",
    formatSampleList(sampleCompetencies, 3),
    "",
    "Create this program now?",
  ].join("\n");
}

function buildModulePromptMessage(module: ModuleEntityRecord): string {
  const niveaus = [...new Set(module.affectedRows.map((row) => row.niveau))];
  const vaarwaters = [
    ...new Set(module.affectedRows.map((row) => row.vaarwater)),
  ];
  const sampleCompetencies = [
    ...new Set(module.affectedRows.map((row) => row.competencyTitle)),
  ];

  return [
    "MISSING MODULE",
    "",
    `Handle:  ${module.handle}`,
    `Title:   ${module.title} (from Excel)`,
    "",
    "Problem: This module is referenced in the Excel but was not found by handle.",
    "         All competencies under this module for revision 2601 depend on it.",
    "",
    `Affected: ${module.affectedRows.length} import rows across niveaus: ${niveaus.join(", ")}`,
    `          vaarwateren: ${vaarwaters.join(", ")}`,
    "",
    "Used with competencies:",
    formatSampleList(sampleCompetencies, 3),
    "",
    "Create this module now?",
  ].join("\n");
}

function buildCompetencyPromptMessage(
  competency: CompetencyEntityRecord,
): string {
  const sampleRow = competency.affectedRows[0];
  const competencyType =
    competency.moduleTitle === "Theorie" ? "knowledge" : "skill";

  return [
    "MISSING COMPETENCY",
    "",
    `Handle:  ${competency.handle}`,
    `Title:   ${competency.title} (from Excel)`,
    `Module:  ${competency.moduleTitle}`,
    `Type:    ${competencyType} (derived: ${competency.moduleTitle === "Theorie" ? "Theorie module" : "not Theorie module"})`,
    "",
    "Problem: This competency entity does not exist. The eisen text from Excel",
    "         cannot be linked to curriculum 2601 without it.",
    "",
    `Affected: ${competency.affectedRows.length} import rows (vaarwater/niveau combinations with an eis)`,
    "",
    sampleRow
      ? `Sample eis (${sampleRow.vaarwater}, niveau ${sampleRow.niveau.toUpperCase()}):\n  "${truncate(sampleRow.eis, 120)}"`
      : "",
    "",
    "Create this competency now?",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function promptForMissingEntities(
  plan: ImportPlan,
): Promise<CreationDecisions> {
  const decisions: CreationDecisions = new Map();

  const missingPrograms = [...plan.programs.values()].filter((p) => !p.exists);
  const missingModules = [...plan.modules.values()].filter((m) => !m.exists);
  const missingCompetencies = [...plan.competencies.values()].filter(
    (c) => !c.exists,
  );

  const promptCount =
    missingPrograms.length + missingModules.length + missingCompetencies.length;

  if (promptCount === 0) {
    console.log("\nAll programs, modules, and competencies already exist.");
    return decisions;
  }

  console.log(`\n→ ${promptCount} prompts required before import can proceed\n`);

  for (const program of missingPrograms) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: buildProgramPromptMessage(program),
        default: false,
      },
    ]);
    decisions.set(program.handle, confirmed);
  }

  for (const module of missingModules) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: buildModulePromptMessage(module),
        default: false,
      },
    ]);
    decisions.set(module.handle, confirmed);
  }

  for (const competency of missingCompetencies) {
    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: "confirm",
        name: "confirmed",
        message: buildCompetencyPromptMessage(competency),
        default: false,
      },
    ]);
    decisions.set(competency.handle, confirmed);
  }

  return decisions;
}

function isApprovedForCreation(
  handle: string,
  exists: boolean,
  decisions: CreationDecisions,
): boolean {
  if (exists) return true;
  return decisions.get(handle) === true;
}

async function findCourseIdForProgram(
  vaarwater: string,
): Promise<string | null> {
  const niveaus: Niveau[] = ["4", "a", "b"];
  for (const niveau of niveaus) {
    const siblingHandle = resolveProgramHandle(vaarwater, niveau);
    const sibling = await Course.Program.fromHandle(siblingHandle);
    if (sibling?.course?.id) {
      return sibling.course.id;
    }
  }

  const discipline = await Course.Discipline.fromHandle("jachtzeilen");
  if (!discipline) return null;

  const volwassenenCategory = await Course.Category.fromHandle("volwassenen");
  const course = await Course.findOne({
    disciplineId: discipline.id,
    ...(volwassenenCategory
      ? { categoryId: volwassenenCategory.id }
      : {}),
  });

  return course?.id ?? null;
}

async function createApprovedProgram(
  program: ProgramEntityRecord,
): Promise<{ id: string } | null> {
  const degreeHandle = `niveau-${program.niveau}`;
  const degree = await Course.Degree.fromHandle(degreeHandle);
  if (!degree) {
    console.error(
      `Failed to create program ${program.handle}: degree "${degreeHandle}" not found`,
    );
    return null;
  }

  const courseId = await findCourseIdForProgram(program.vaarwater);
  if (!courseId) {
    console.error(
      `Failed to create program ${program.handle}: could not resolve courseId (create manually or ensure a sibling program exists)`,
    );
    return null;
  }

  try {
    return await Course.Program.create({
      handle: program.handle,
      title: program.title,
      degreeId: degree.id,
      courseId,
    });
  } catch (error) {
    console.error(`Failed to create program ${program.handle}:`, error);
    return null;
  }
}

async function ensureCurriculumStarted(
  curriculumId: string,
  startedAt: string | null | undefined,
) {
  if (startedAt) return;
  await Curriculum.start({
    curriculumId,
    startedAt: REVISION_STARTED_AT,
  });
}

async function getOrCreateCurriculum2601(
  programId: string,
  cache: Map<string, Promise<{ id: string }>>,
): Promise<{ id: string }> {
  const cacheKey = `${programId}-${REVISION}`;
  let curriculumPromise = cache.get(cacheKey);

  if (!curriculumPromise) {
    curriculumPromise = (async () => {
      const existing = await Curriculum.list({ filter: { programId } });
      const match = existing.find((c) => c.revision === REVISION);

      if (match) {
        await ensureCurriculumStarted(match.id, match.startedAt);
        return { id: match.id };
      }

      const created = await Curriculum.create({ programId, revision: REVISION });
      await ensureCurriculumStarted(created.id, null);
      return created;
    })();
    cache.set(cacheKey, curriculumPromise);
  }

  return curriculumPromise;
}

async function upsertCurriculumCompetency(input: {
  curriculumId: string;
  moduleId: string;
  competencyId: string;
  isRequired: boolean;
  requirement: string;
}) {
  const query = useQuery();
  const existing = await Curriculum.Competency.list({
    filter: {
      curriculumId: input.curriculumId,
      moduleId: input.moduleId,
      competencyId: input.competencyId,
    },
  });

  const match = existing[0];
  if (match) {
    await query
      .update(schema.curriculumCompetency)
      .set({
        isRequired: input.isRequired,
        requirement: input.requirement,
      })
      .where(eq(schema.curriculumCompetency.id, match.id));
    return { updated: true };
  }

  await Curriculum.Competency.create(input);
  return { updated: false };
}

export async function applyImportPlan(
  plan: ImportPlan,
  decisions: CreationDecisions,
): Promise<{
  rowsProcessed: number;
  rowsSkipped: number;
  programsCreated: number;
  modulesCreated: number;
  competenciesCreated: number;
  curriculumLinksUpserted: number;
}> {
  const stats = {
    rowsProcessed: 0,
    rowsSkipped: 0,
    programsCreated: 0,
    modulesCreated: 0,
    competenciesCreated: 0,
    curriculumLinksUpserted: 0,
  };

  const programIds = new Map<string, string>();
  const moduleIds = new Map<string, string>();
  const competencyIds = new Map<string, string>();
  const curriculumCache = new Map<string, Promise<{ id: string }>>();
  const failedCreations = new Set<string>();

  for (const program of plan.programs.values()) {
    if (program.exists && program.entity) {
      programIds.set(program.handle, program.entity.id);
      continue;
    }
    if (!isApprovedForCreation(program.handle, program.exists, decisions)) {
      failedCreations.add(program.handle);
      continue;
    }
    const created = await createApprovedProgram(program);
    if (created) {
      programIds.set(program.handle, created.id);
      stats.programsCreated++;
    } else {
      failedCreations.add(program.handle);
    }
  }

  for (const module of plan.modules.values()) {
    if (module.exists && module.entity) {
      moduleIds.set(module.handle, module.entity.id);
      continue;
    }
    if (!isApprovedForCreation(module.handle, module.exists, decisions)) {
      failedCreations.add(module.handle);
      continue;
    }
    const weight = plan.moduleWeights.get(module.handle) ?? 1;
    try {
      const created = await Course.Module.create({
        handle: module.handle,
        title: module.title,
        weight,
      });
      moduleIds.set(module.handle, created.id);
      stats.modulesCreated++;
    } catch (error) {
      console.error(`Failed to create module ${module.handle}:`, error);
      failedCreations.add(module.handle);
    }
  }

  for (const competency of plan.competencies.values()) {
    if (competency.exists && competency.entity) {
      competencyIds.set(competency.handle, competency.entity.id);
      continue;
    }
    if (
      !isApprovedForCreation(competency.handle, competency.exists, decisions)
    ) {
      failedCreations.add(competency.handle);
      continue;
    }
    const type = competency.moduleTitle === "Theorie" ? "knowledge" : "skill";
    try {
      const created = await Course.Competency.create({
        handle: competency.handle,
        title: competency.title,
        type,
      });
      competencyIds.set(competency.handle, created.id);
      stats.competenciesCreated++;
    } catch (error) {
      console.error(`Failed to create competency ${competency.handle}:`, error);
      failedCreations.add(competency.handle);
    }
  }

  for (const row of plan.rows) {
    if (
      failedCreations.has(row.programHandle) ||
      failedCreations.has(row.moduleHandle) ||
      failedCreations.has(row.competencyHandle) ||
      !isApprovedForCreation(row.programHandle, plan.programs.get(row.programHandle)?.exists ?? false, decisions) ||
      !isApprovedForCreation(row.moduleHandle, plan.modules.get(row.moduleHandle)?.exists ?? false, decisions) ||
      !isApprovedForCreation(row.competencyHandle, plan.competencies.get(row.competencyHandle)?.exists ?? false, decisions)
    ) {
      stats.rowsSkipped++;
      continue;
    }

    const programId = programIds.get(row.programHandle);
    const moduleId = moduleIds.get(row.moduleHandle);
    const competencyId = competencyIds.get(row.competencyHandle);

    if (!programId || !moduleId || !competencyId) {
      stats.rowsSkipped++;
      continue;
    }

    const { id: curriculumId } = await getOrCreateCurriculum2601(
      programId,
      curriculumCache,
    );

    await Curriculum.linkModule({ curriculumId, moduleId });

    await upsertCurriculumCompetency({
      curriculumId,
      moduleId,
      competencyId,
      isRequired: row.isRequired,
      requirement: row.eis,
    });

    stats.rowsProcessed++;
    stats.curriculumLinksUpserted++;
  }

  return stats;
}

function printLookupSummary(plan: ImportPlan) {
  const programTargets = new Set(plan.rows.map((row) => row.programHandle));
  const missingPrograms = [...plan.programs.values()].filter((p) => !p.exists);
  const missingModules = [...plan.modules.values()].filter((m) => !m.exists);
  const missingCompetencies = [...plan.competencies.values()].filter(
    (c) => !c.exists,
  );

  console.log(`\nParsed ${plan.rows.length} rows across ${programTargets.size} program targets (revision ${REVISION})`);
  console.log(
    `Programs:     ${plan.programs.size - missingPrograms.length} found, ${missingPrograms.length} missing`,
  );
  console.log(
    `Modules:      ${plan.modules.size - missingModules.length} found, ${missingModules.length} missing`,
  );
  console.log(
    `Competencies: ${plan.competencies.size - missingCompetencies.length} found, ${missingCompetencies.length} missing`,
  );
  console.log(
    `Parse notes:  ${plan.parseStats.defaultedKeuzeCount} rows defaulted to Keuze (empty V/O); ${plan.parseStats.skippedEmptyEis} empty eis cells skipped during parse`,
  );
}

async function main() {
  const { filePath } = await inquirer.prompt<{ filePath: string }>([
    {
      type: "input",
      name: "filePath",
      message: "Enter the path to the Jachtzeilen A/B XLSX file:",
      validate: (input: string) => {
        if (!input) return "Please enter a file path";
        if (!input.endsWith(".xlsx")) return "File must be an XLSX file";
        return true;
      },
    },
  ]);

  const workbook = loadWorkbookFromPath(filePath);
  if (!workbook.SheetNames.length) {
    throw new Error("No sheets found in the XLSX file");
  }

  const sheetName = workbook.SheetNames[0];
  assert(sheetName, "Sheet name is required");

  const worksheet = workbook.Sheets[sheetName];
  assert(worksheet, "Worksheet is required");

  const rawRows = utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    defval: "",
  });

  const { rows, defaultedKeuzeCount, skippedEmptyEis } =
    parseWideJachtzeilenSheet(rawRows);

  if (rows.length === 0) {
    throw new Error("No import rows parsed from the Excel file");
  }

  console.log("Successfully read XLSX file");

  const plan = await resolveImportPlan(rows, {
    defaultedKeuzeCount,
    skippedEmptyEis,
  });

  printLookupSummary(plan);

  const decisions = await promptForMissingEntities(plan);

  await withTransaction(async () => {
    const stats = await applyImportPlan(plan, decisions);

    console.log(`\nImport complete (revision ${REVISION})`);
    console.log(`  Rows processed:            ${stats.rowsProcessed}`);
    console.log(`  Rows skipped:              ${stats.rowsSkipped}`);
    console.log(`  Programs created:          ${stats.programsCreated}`);
    console.log(`  Modules created:           ${stats.modulesCreated}`);
    console.log(`  Competencies created:      ${stats.competenciesCreated}`);
    console.log(
      `  Curriculum links upserted: ${stats.curriculumLinksUpserted}`,
    );
  });
}

const pgUri = process.env.PGURI;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function isDirectExecution(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return import.meta.url === pathToFileURL(entry).href;
}

if (isDirectExecution()) {
  assert(pgUri, "PGURI environment variable is required");
  assert(
    supabaseUrl,
    "NEXT_PUBLIC_SUPABASE_URL environment variable is required",
  );
  assert(
    supabaseKey,
    "SUPABASE_SERVICE_ROLE_KEY environment variable is required",
  );

  withSupabaseClient(
    {
      url: supabaseUrl,
      serviceRoleKey: supabaseKey,
    },
    () =>
      withDatabase(
        {
          connectionString: pgUri,
        },
        async () => {
          await main();
        },
      )
        .then(() => {
          console.log("Done!");
          process.exit(0);
        })
        .catch((error) => {
          console.error("Error:", error);
          process.exit(1);
        }),
  );
}
