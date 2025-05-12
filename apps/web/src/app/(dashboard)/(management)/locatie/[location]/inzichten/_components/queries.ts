"use server";
import { useQuery } from "@nawadi/core";
import { schema as s } from "@nawadi/db";
import { and, asc, eq, gte, lte } from "@nawadi/db/drizzle";

export async function listCertificatesBetween(
  locationId: string,
  from: Date,
  to: Date,
) {
  const query = useQuery();

  return query
    .select({
      issuedAt: s.certificate.issuedAt,
      discipline: {
        title: s.discipline.title,
        handle: s.discipline.handle,
      },
    })
    .from(s.certificate)
    .innerJoin(
      s.studentCurriculum,
      eq(s.certificate.studentCurriculumId, s.studentCurriculum.id),
    )
    .innerJoin(
      s.curriculum,
      eq(s.studentCurriculum.curriculumId, s.curriculum.id),
    )
    .innerJoin(s.program, eq(s.curriculum.programId, s.program.id))
    .innerJoin(s.course, eq(s.program.courseId, s.course.id))
    .innerJoin(s.discipline, eq(s.course.disciplineId, s.discipline.id))
    .where(
      and(
        eq(s.certificate.locationId, locationId),
        gte(s.certificate.issuedAt, from.toISOString()),
        lte(s.certificate.issuedAt, to.toISOString()),
      ),
    )
    .orderBy(asc(s.certificate.issuedAt));
}
