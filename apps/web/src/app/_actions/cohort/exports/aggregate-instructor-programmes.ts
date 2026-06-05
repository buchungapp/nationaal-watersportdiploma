export type InstructorProgrammeExportStudent = {
  instructor: {
    id: string;
    firstName: string;
    lastNamePrefix: string | null;
    lastName: string | null;
  } | null;
  studentCurriculum: {
    program?: { id: string } | null;
    course: { title: string | null };
    degree: { title: string | null };
  } | null;
};

function formatInstructorName(
  instructor: NonNullable<InstructorProgrammeExportStudent["instructor"]>,
): string {
  return [
    instructor.firstName,
    instructor.lastNamePrefix,
    instructor.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

export function formatProgramma(student: InstructorProgrammeExportStudent): string {
  const course = student.studentCurriculum?.course?.title;
  const degree = student.studentCurriculum?.degree?.title;
  return course && degree ? `${course} ${degree}` : "Geen programma";
}

export function aggregateInstructorProgrammeRows(
  students: InstructorProgrammeExportStudent[],
): string[][] {
  const claimed = students.filter((student) => student.instructor?.id);

  const groups = new Map<
    string,
    {
      instructorName: string;
      programma: string;
      count: number;
    }
  >();

  for (const student of claimed) {
    const instructor = student.instructor;
    if (!instructor) {
      continue;
    }

    // #region agent log
    if (student.studentCurriculum && !student.studentCurriculum.program?.id) {
      fetch("http://127.0.0.1:7863/ingest/173945db-8a6f-4fd3-964e-6ba5e92e056e", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Debug-Session-Id": "00aa10",
        },
        body: JSON.stringify({
          sessionId: "00aa10",
          hypothesisId: "A",
          location: "aggregate-instructor-programmes.ts:loop",
          message: "studentCurriculum without program.id",
          data: {
            hasCurriculum: !!student.studentCurriculum,
            hasProgram: !!student.studentCurriculum?.program,
            hasProgramId: !!student.studentCurriculum?.program?.id,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
    }
    // #endregion

    const programId = student.studentCurriculum?.program?.id ?? "none";
    const key = `${instructor.id}|${programId}`;
    const programma = formatProgramma(student);
    const instructorName = formatInstructorName(instructor);

    const existing = groups.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      groups.set(key, { instructorName, programma, count: 1 });
    }
  }

  return [...groups.values()]
    .sort((a, b) => {
      const byName = a.instructorName.localeCompare(b.instructorName, "nl");
      if (byName !== 0) {
        return byName;
      }
      return a.programma.localeCompare(b.programma, "nl");
    })
    .map(({ instructorName, programma, count }) => [
      instructorName,
      programma,
      String(count),
    ]);
}
