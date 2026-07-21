import "server-only";

import { cacheLife } from "next/cache";
import { normalizeRequirementText } from "~/app/(public)/diplomalijn/instructeur/_components/compare-eigenvaardigheid/normalize-requirement-text";
import type {
  CompareCompetency,
  CompareDiscipline,
  CompareLevel,
  CompareModule,
} from "~/app/(public)/diplomalijn/instructeur/_components/compare-eigenvaardigheid/types";
import {
  JACHTZEILEN_EV_BASE,
  JACHTZEILEN_EV_HANDLE,
  sortJachtzeilenCourses,
} from "~/app/(public)/diplomalijn/instructeur/_data/jachtzeilen-ev";
import {
  listCourses,
  listCurriculaByDiscipline,
  listProgramsForCourse,
} from "~/lib/nwd";

const MIN_EV_RANG = 5;
/** NWD C (rang 7) has no module list — exclude from compare selectors. */
const MAX_COMPARE_RANG = 6;

function formatLevelLabel(degreeTitle: string): string {
  const trimmed = degreeTitle.trim();
  if (/^nwd\s/i.test(trimmed)) return trimmed;
  if (/^[ABC]$/i.test(trimmed)) return `NWD ${trimmed.toUpperCase()}`;
  return trimmed;
}

function levelLetter(label: string): string {
  const match = label.match(/\b([ABC])\b/i);
  return match?.[1]?.toUpperCase() ?? label.charAt(0).toUpperCase();
}

function serializeModules(
  curriculum: Awaited<ReturnType<typeof listCurriculaByDiscipline>>[number],
): CompareModule[] {
  return curriculum.modules
    .sort((a, b) => a.weight - b.weight)
    .map((module) => ({
      moduleId: module.id,
      handle: module.handle,
      title: module.title ?? "",
      weight: module.weight,
      competencies: module.competencies
        .sort((a, b) => a.weight - b.weight)
        .map((competency): CompareCompetency => {
          const linked = competency as typeof competency & {
            competencyId?: string;
          };

          return {
            competencyId: linked.competencyId ?? competency.handle,
            handle: competency.handle,
            title: competency.title ?? "",
            weight: competency.weight,
            requirement: normalizeRequirementText(competency.requirement),
          };
        }),
    }));
}

function buildLevelsForCourse(
  programs: Awaited<ReturnType<typeof listProgramsForCourse>>,
  curricula: Awaited<ReturnType<typeof listCurriculaByDiscipline>>,
): CompareLevel[] {
  const evPrograms = programs
    .filter(
      (program) =>
        program.degree.rang >= MIN_EV_RANG &&
        program.degree.rang <= MAX_COMPARE_RANG,
    )
    .sort((a, b) => a.degree.rang - b.degree.rang);

  return evPrograms.map((program) => {
    const curriculum = curricula.find((c) => c.programId === program.id);
    const modules = curriculum ? serializeModules(curriculum) : [];
    const label = formatLevelLabel(program.degree.title ?? "");

    return {
      programId: program.id,
      label,
      letter: levelLetter(label),
      hasModules: modules.length > 0,
      modules,
    };
  });
}

export async function getEigenvaardigheidCompareData(): Promise<
  CompareDiscipline[]
> {
  "use cache";
  cacheLife("days");

  const instructeurCourses = await listCourses("instructeur");
  const byDiscipline = new Map<string, typeof instructeurCourses>();

  for (const course of instructeurCourses) {
    const disciplineId = course.discipline.id;
    const existing = byDiscipline.get(disciplineId) ?? [];
    existing.push(course);
    byDiscipline.set(disciplineId, existing);
  }

  const disciplines: CompareDiscipline[] = [];

  for (const [disciplineId, courses] of byDiscipline) {
    const discipline = courses[0]!.discipline;
    const isJachtzeilen = discipline.handle === JACHTZEILEN_EV_HANDLE;
    const sortedCourses = isJachtzeilen
      ? sortJachtzeilenCourses(courses)
      : courses;

    const curricula = await listCurriculaByDiscipline(disciplineId);

    const exposedCourses = isJachtzeilen
      ? sortedCourses
      : sortedCourses.length === 1
        ? sortedCourses
        : [sortedCourses[0]!];

    for (const course of exposedCourses) {
      const programs = await listProgramsForCourse(course.id);
      const levels = buildLevelsForCourse(programs, curricula);

      if (levels.length === 0) continue;

      const baseTitle = discipline.title ?? discipline.handle;
      const title =
        isJachtzeilen && exposedCourses.length > 1
          ? `${baseTitle} — ${course.title}`
          : baseTitle;

      const programPageHref = isJachtzeilen
        ? `${JACHTZEILEN_EV_BASE}/${course.handle}`
        : `/diplomalijn/instructeur/eigenvaardigheid/${discipline.handle}`;

      disciplines.push({
        id: isJachtzeilen
          ? `${discipline.handle}:${course.handle}`
          : discipline.handle,
        handle: discipline.handle,
        title,
        programPageHref,
        levels,
      });
    }
  }

  return disciplines.sort((a, b) => a.title.localeCompare(b.title, "nl"));
}

export async function getEigenvaardigheidLevelsForCourse(
  courseId: string,
  disciplineId: string,
): Promise<CompareLevel[]> {
  "use cache";
  cacheLife("days");

  const [programs, curricula] = await Promise.all([
    listProgramsForCourse(courseId),
    listCurriculaByDiscipline(disciplineId),
  ]);

  return buildLevelsForCourse(programs, curricula);
}
