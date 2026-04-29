import { schema as s } from "@nawadi/db";
import {
  and,
  asc,
  eq,
  getTableColumns,
  isNotNull,
  isNull,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import { uuidSchema, withZod, wrapQuery } from "../../utils/index.js";

// TODO: There will come a day that I will simplify this query
export const listStatus = wrapQuery(
  "cohort.certificate.listStatus",
  withZod(
    z.object({
      cohortId: uuidSchema,
    }),
    async (input) => {
      const query = useQuery();

      const { id, tags, createdAt, progressVisibleUpUntil } = getTableColumns(
        s.cohortAllocation,
      );

      const instructorActor = alias(s.actor, "instructor_actor");
      const instructorPerson = alias(s.person, "instructor_person");

      const rankedSq = query
        .select({
          cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
          curriculumModuleCompetencyId: s.studentCohortProgress.competencyId,
          progress: s.studentCohortProgress.progress,
          rn: sql<number>`ROW_NUMBER() OVER (
    PARTITION BY ${s.studentCohortProgress.cohortAllocationId}, ${s.studentCohortProgress.competencyId}
    ORDER BY ${s.studentCohortProgress.createdAt} DESC
  )`
            .mapWith(Number)
            .as("rn"),
        })
        .from(s.studentCohortProgress)
        .as("ranked");

      const latestProgress = query.$with("latest_progress").as(
        query
          .select({
            cohortAllocationId: rankedSq.cohortAllocationId,
            curriculumModuleCompetencyId: rankedSq.curriculumModuleCompetencyId,
            progress: rankedSq.progress,
          })
          .from(rankedSq)
          .where(eq(rankedSq.rn, 1)),
      );

      // Competencies the student has already proven on a previously
      // issued certificate for the same student curriculum. We use
      // these to compute `newlyIssuable` per module: a module that's
      // partly already canonical and partly newly cohort-complete is
      // still "issuable now" — the new certificate would cover only
      // the not-yet-canonical part (competentiegericht opleiden), and
      // `issueCertificatesInCohort` filters accordingly. Without this
      // CTE the diplomas tab can't tell the operator whether a click
      // on "Diploma uitreiken" will actually mint anything new.
      const canonicalCompetency = query.$with("canonical_competency").as(
        query
          .selectDistinct({
            studentCurriculumId:
              s.studentCompletedCompetency.studentCurriculumId,
            competencyId: s.studentCompletedCompetency.competencyId,
          })
          .from(s.studentCompletedCompetency)
          .innerJoin(
            s.certificate,
            eq(s.certificate.id, s.studentCompletedCompetency.certificateId),
          )
          .where(
            and(
              eq(s.studentCompletedCompetency.isMergeConflictDuplicate, false),
              isNull(s.studentCompletedCompetency.deletedAt),
              isNull(s.certificate.deletedAt),
              isNotNull(s.certificate.issuedAt),
            ),
          ),
      );

      const moduleStatusQuery = query
        .with(latestProgress, canonicalCompetency)
        .select({
          studentCurriculumId: s.studentCurriculum.id,
          module: {
            ...getTableColumns(s.module),
            type: sql<string>`CASE WHEN COUNT(${s.curriculumCompetency.id}) FILTER (WHERE ${s.curriculumCompetency.isRequired}) = COUNT(${s.curriculumCompetency.id}) THEN 'required' ELSE 'optional' END`,
          },
          totalCompetencies:
            sql<number>`COUNT(${s.curriculumCompetency.id})`.mapWith(Number),
          completedCompetencies:
            sql<number>`COUNT(${s.curriculumCompetency.id}) FILTER (WHERE COALESCE(${latestProgress.progress}, 0) >= 100)`.mapWith(
              Number,
            ),
          uncompletedCompetencies:
            sql<number>`COUNT(${s.curriculumCompetency.id}) FILTER (WHERE COALESCE(${latestProgress.progress}, 0) < 100)`.mapWith(
              Number,
            ),
          // Module is "issuable right now" iff every competency is
          // either at cohort-progress=100 or already canonical, AND at
          // least one competency is cohort-progress=100 but not yet
          // canonical (otherwise the issuance produces nothing new).
          // Drives the `geblokkeerd` row state and the diplomas-tab
          // count under option d.
          newlyIssuable: sql<boolean>`(
              COUNT(${s.curriculumCompetency.id}) FILTER (
                WHERE COALESCE(${latestProgress.progress}, 0) >= 100
                   OR ${canonicalCompetency.competencyId} IS NOT NULL
              ) = COUNT(${s.curriculumCompetency.id})
              AND COUNT(${s.curriculumCompetency.id}) FILTER (
                WHERE COALESCE(${latestProgress.progress}, 0) >= 100
                  AND ${canonicalCompetency.competencyId} IS NULL
              ) > 0
            )`.mapWith(Boolean),
        })
        .from(s.studentCurriculum)
        .innerJoin(
          s.curriculumCompetency,
          eq(
            s.curriculumCompetency.curriculumId,
            s.studentCurriculum.curriculumId,
          ),
        )
        .innerJoin(s.module, eq(s.module.id, s.curriculumCompetency.moduleId))
        .innerJoin(
          s.cohortAllocation,
          eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
        )
        .leftJoin(
          latestProgress,
          and(
            eq(
              latestProgress.curriculumModuleCompetencyId,
              s.curriculumCompetency.id,
            ),
            eq(s.cohortAllocation.id, latestProgress.cohortAllocationId),
          ),
        )
        .leftJoin(
          canonicalCompetency,
          and(
            eq(canonicalCompetency.studentCurriculumId, s.studentCurriculum.id),
            eq(canonicalCompetency.competencyId, s.curriculumCompetency.id),
          ),
        )
        .groupBy(s.studentCurriculum.id, s.module.id)
        .where(
          and(
            isNull(s.studentCurriculum.deletedAt),
            isNull(s.cohortAllocation.deletedAt),
            eq(s.cohortAllocation.cohortId, input.cohortId),
          ),
        );

      const studentsQuery = query
        .select({
          id,
          tags,
          createdAt,
          progressVisibleUpUntil,
          person: {
            id: s.person.id,
            firstName: s.person.firstName,
            lastNamePrefix: s.person.lastNamePrefix,
            lastName: s.person.lastName,
            dateOfBirth: s.person.dateOfBirth,
          },
          instructor: {
            id: instructorPerson.id,
            firstName: instructorPerson.firstName,
            lastNamePrefix: instructorPerson.lastNamePrefix,
            lastName: instructorPerson.lastName,
          },
          studentCurriculumId: s.cohortAllocation.studentCurriculumId,
          curriculum: {
            id: s.curriculum.id,
          },
          program: {
            id: s.program.id,
            handle: s.program.handle,
            title: s.program.title,
          },
          course: {
            id: s.course.id,
            handle: s.course.handle,
            title: s.course.title,
          },
          degree: {
            id: s.degree.id,
            handle: s.degree.handle,
            title: s.degree.title,
          },
          discipline: {
            id: s.discipline.id,
            handle: s.discipline.handle,
            title: s.discipline.title,
          },
          gearType: {
            id: s.gearType.id,
            handle: s.gearType.handle,
            title: s.gearType.title,
          },
          certificate: {
            id: s.certificate.id,
            handle: s.certificate.handle,
            issuedAt: s.certificate.issuedAt,
            visibleFrom: s.certificate.visibleFrom,
          },
        })
        .from(s.cohortAllocation)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.id, s.cohortAllocation.actorId),
            eq(s.actor.type, "student"),
          ),
        )
        .innerJoin(s.person, eq(s.person.id, s.actor.personId))
        .leftJoin(
          instructorActor,
          eq(instructorActor.id, s.cohortAllocation.instructorId),
        )
        .leftJoin(
          instructorPerson,
          eq(instructorPerson.id, instructorActor.personId),
        )
        .leftJoin(
          s.studentCurriculum,
          eq(s.studentCurriculum.id, s.cohortAllocation.studentCurriculumId),
        )
        .leftJoin(
          s.curriculum,
          eq(s.curriculum.id, s.studentCurriculum.curriculumId),
        )
        .leftJoin(s.program, eq(s.program.id, s.curriculum.programId))
        .leftJoin(s.course, eq(s.course.id, s.program.courseId))
        .leftJoin(s.degree, eq(s.degree.id, s.program.degreeId))
        .leftJoin(s.discipline, eq(s.discipline.id, s.course.disciplineId))
        .leftJoin(s.gearType, eq(s.gearType.id, s.studentCurriculum.gearTypeId))
        .leftJoin(
          s.certificate,
          and(
            eq(s.certificate.cohortAllocationId, s.cohortAllocation.id),
            isNull(s.certificate.deletedAt),
          ),
        )
        .where(
          and(
            isNull(s.cohortAllocation.deletedAt),
            eq(s.cohortAllocation.cohortId, input.cohortId),
          ),
        )
        .orderBy(
          asc(sql`LOWER(${s.person.firstName})`),
          asc(sql`LOWER(${s.person.lastName})`),
        );

      const [students, moduleStatus] = await Promise.all([
        studentsQuery,
        moduleStatusQuery,
      ]);

      return students.map((student) => {
        const moduleStatusForStudent = moduleStatus.filter(
          (status) =>
            status.studentCurriculumId === student.studentCurriculumId,
        );

        if (student.studentCurriculumId && moduleStatusForStudent.length < 1) {
          throw new Error(
            `Module status not found for student curriculum ${student.studentCurriculumId}`,
          );
        }

        return {
          id: student.id,
          progressVisibleForStudentUpUntil: student.progressVisibleUpUntil,
          person: {
            id: student.person.id,
            firstName: student.person.firstName,
            lastNamePrefix: student.person.lastNamePrefix,
            lastName: student.person.lastName,
            dateOfBirth: student.person.dateOfBirth,
          },
          instructor: student.instructor?.id
            ? {
                id: student.instructor.id,
                firstName: student.instructor.firstName,
                lastNamePrefix: student.instructor.lastNamePrefix,
                lastName: student.instructor.lastName,
              }
            : null,
          studentCurriculum: student.studentCurriculumId
            ? {
                id: student.studentCurriculumId,
                curriculumId: student.curriculum?.id,
                // biome-ignore lint/style/noNonNullAssertion: intentional
                program: student.program!,
                // biome-ignore lint/style/noNonNullAssertion: intentional
                course: student.course!,
                // biome-ignore lint/style/noNonNullAssertion: intentional
                degree: student.degree!,
                // biome-ignore lint/style/noNonNullAssertion: intentional
                discipline: student.discipline!,
                // biome-ignore lint/style/noNonNullAssertion: intentional
                gearType: student.gearType!,
                moduleStatus: moduleStatusForStudent.map((status) => ({
                  module: status.module,
                  totalCompetencies: status.totalCompetencies,
                  completedCompetencies: status.completedCompetencies,
                  uncompletedCompetencies: status.uncompletedCompetencies,
                  newlyIssuable: status.newlyIssuable,
                })),
              }
            : null,
          createdAt: student.createdAt,
          tags: student.tags,
          certificate: student.certificate
            ? {
                id: student.certificate.id,
                handle: student.certificate.handle,
                issuedAt: student.certificate.issuedAt,
                visibleFrom: student.certificate.visibleFrom,
              }
            : null,
        };
      });
    },
  ),
);
