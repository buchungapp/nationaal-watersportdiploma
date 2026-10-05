import "server-only";

import { cacheLife } from "next/cache";
import { listCourses, listPrograms } from "~/lib/nwd";

/** Instructeur EV programs use degree rang 5 (A), 6 (B), 7 (C). */
const EV_DEGREE_RANG = {
  a: 5,
  b: 6,
  c: 7,
} as const;

export type EigenvaardigheidMatrixLevels = {
  a: boolean;
  b: boolean;
  c: boolean;
};

export type EigenvaardigheidMatrixRow = {
  handle: string;
  title: string;
  levels: EigenvaardigheidMatrixLevels;
};

export async function getEigenvaardigheidMatrix(): Promise<
  EigenvaardigheidMatrixRow[]
> {
  "use cache";
  cacheLife("days");

  const [instructeurCourses, programs] = await Promise.all([
    listCourses("instructeur"),
    listPrograms(),
  ]);

  const instructeurCourseIds = new Set(instructeurCourses.map((c) => c.id));

  const byDisciplineId = new Map<
    string,
    EigenvaardigheidMatrixRow & { weight: number }
  >();

  for (const course of instructeurCourses) {
    const { discipline } = course;
    const existing = byDisciplineId.get(discipline.id);
    if (existing) continue;

    byDisciplineId.set(discipline.id, {
      handle: discipline.handle,
      title: discipline.title ?? discipline.handle,
      levels: { a: false, b: false, c: false },
      weight: discipline.weight,
    });
  }

  for (const program of programs) {
    if (!instructeurCourseIds.has(program.course.id)) continue;

    let row = byDisciplineId.get(program.course.discipline.id);
    if (!row) {
      const { discipline } = program.course;
      row = {
        handle: discipline.handle,
        title: discipline.title ?? discipline.handle,
        levels: { a: false, b: false, c: false },
        weight: discipline.weight,
      };
      byDisciplineId.set(discipline.id, row);
    }

    const { rang } = program.degree;
    if (rang === EV_DEGREE_RANG.a) row.levels.a = true;
    if (rang === EV_DEGREE_RANG.b) row.levels.b = true;
    if (rang === EV_DEGREE_RANG.c) row.levels.c = true;
  }

  return Array.from(byDisciplineId.values())
    .sort((a, b) => a.weight - b.weight)
    .map(({ handle, title, levels }) => ({ handle, title, levels }));
}
