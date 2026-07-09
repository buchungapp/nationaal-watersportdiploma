import type {
  CompareModule,
  CompareModuleGroup,
  CompareRow,
} from "./types";

type CompareCompetency = CompareModule["competencies"][number];

function rowKey(module: CompareModule, competency: CompareCompetency) {
  return `${module.moduleId}::${competency.competencyId}`;
}

function upsertRow(
  rows: Map<string, CompareRow>,
  module: CompareModule,
  competency: CompareCompetency,
  side: "aText" | "bText",
) {
  const key = rowKey(module, competency);
  const text = competency.requirement?.trim() ?? "";
  const existing = rows.get(key);

  if (existing) {
    existing[side] = text;
  } else {
    rows.set(key, {
      rowKey: key,
      competencyId: competency.competencyId,
      moduleId: module.moduleId,
      moduleTitle: module.title,
      moduleWeight: module.weight,
      title: competency.title,
      weight: competency.weight,
      aText: side === "aText" ? text : "",
      bText: side === "bText" ? text : "",
    });
  }
}

function fillSide(
  rows: Map<string, CompareRow>,
  modules: CompareModule[],
  side: "aText" | "bText",
) {
  for (const module of modules) {
    for (const competency of module.competencies) {
      upsertRow(rows, module, competency, side);
    }
  }
}

function unionModules(
  leftModules: CompareModule[],
  rightModules: CompareModule[],
) {
  const modules = new Map<string, CompareModule>();

  for (const module of [...leftModules, ...rightModules]) {
    const existing = modules.get(module.moduleId);
    if (!existing || module.weight < existing.weight) {
      modules.set(module.moduleId, module);
    }
  }

  return modules;
}

/** Merge two level module trees into grouped rows for side-by-side comparison. */
export function buildComparison(
  leftModules: CompareModule[],
  rightModules: CompareModule[],
): CompareModuleGroup[] {
  const rows = new Map<string, CompareRow>();

  fillSide(rows, leftModules, "aText");
  fillSide(rows, rightModules, "bText");

  const modules = unionModules(leftModules, rightModules);
  const groups = new Map<string, CompareModuleGroup>();

  for (const [moduleId, module] of modules) {
    groups.set(moduleId, {
      moduleKey: moduleId,
      moduleId,
      moduleTitle: module.title,
      moduleWeight: module.weight,
      competencies: [],
    });
  }

  for (const row of rows.values()) {
    const group = groups.get(row.moduleId);
    if (!group) continue;
    group.competencies.push(row);
  }

  return Array.from(groups.values())
    .sort((a, b) => a.moduleWeight - b.moduleWeight)
    .map((group) => ({
      ...group,
      competencies: group.competencies.sort((a, b) => a.weight - b.weight),
    }));
}
