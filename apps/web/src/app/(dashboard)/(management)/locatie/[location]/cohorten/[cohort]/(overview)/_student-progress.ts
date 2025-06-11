import {
  listCurriculaByPersonId,
  listCurriculaProgressByPersonId,
} from "~/lib/nwd";

export type StudentsProgressData = Array<{
  personId: string;
  curricula: Array<{
    curriculum: Awaited<ReturnType<typeof listCurriculaByPersonId>>[number];
    progress:
      | Awaited<ReturnType<typeof listCurriculaProgressByPersonId>>[number]
      | null;
  }>;
}>;

export async function studentProgress(
  personIds: string[],
): Promise<StudentsProgressData> {
  if (personIds.length === 0) {
    return [];
  }

  const [curricula, progress] = await Promise.all([
    listCurriculaByPersonId(personIds, true),
    listCurriculaProgressByPersonId(personIds, false, false),
  ]);

  const curriculaByPersonId = new Map<string, typeof curricula>();
  const progressByStudentCurriculumId = new Map<
    string,
    (typeof progress)[number]
  >();

  for (const curriculum of curricula) {
    const existing = curriculaByPersonId.get(curriculum.personId);
    if (existing) {
      existing.push(curriculum);
    } else {
      curriculaByPersonId.set(curriculum.personId, [curriculum]);
    }
  }

  for (const progressItem of progress) {
    progressByStudentCurriculumId.set(
      progressItem.studentCurriculumId,
      progressItem,
    );
  }

  return personIds.map((personId) => {
    const personCurricula = curriculaByPersonId.get(personId) || [];

    return {
      personId,
      curricula: personCurricula.map((curriculum) => ({
        curriculum,
        progress: progressByStudentCurriculumId.get(curriculum.id) || null,
      })),
    };
  });
}
