import { schema as s } from '@nawadi/db'
import { and, asc, eq, getTableColumns, isNull, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { uuidSchema, withZod } from '../../utils/index.js'

export const listStatus = withZod(
  z.object({
    cohortId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const { id, tags, createdAt } = getTableColumns(s.cohortAllocation)

    const instructorActor = alias(s.actor, 'instructor_actor')
    const instructorPerson = alias(s.person, 'instructor_person')

    // TODO: I'm making this too complicated, let's try again another day.
    // const latestCompetencyProgressSq = query
    //   .select({
    //     cohortAllocationId: s.studentCohortProgress.cohortAllocationId,
    //     competencyId: s.studentCohortProgress.competencyId,
    //     maxCreatedAt: max(s.studentCohortProgress.createdAt).as(
    //       'max_created_at',
    //     ),
    //   })
    //   .from(s.studentCohortProgress)
    //   .groupBy(
    //     s.studentCohortProgress.cohortAllocationId,
    //     s.studentCohortProgress.competencyId,
    //   )
    //   .as('latest')

    // const progressPerCompetencySq = query
    //   .select(getTableColumns(s.studentCohortProgress))
    //   .from(s.studentCohortProgress)
    //   .innerJoin(
    //     latestCompetencyProgressSq,
    //     and(
    //       eq(
    //         s.studentCohortProgress.cohortAllocationId,
    //         latestCompetencyProgressSq.cohortAllocationId,
    //       ),
    //       eq(
    //         s.studentCohortProgress.competencyId,
    //         latestCompetencyProgressSq.competencyId,
    //       ),
    //       eq(
    //         s.studentCohortProgress.createdAt,
    //         latestCompetencyProgressSq.maxCreatedAt,
    //       ),
    //     ),
    //   )
    //   .as('progress_per_competency')

    // const curriculumModulesWithProgress = await query
    //   .select()
    //   .from(s.cohortAllocation)
    //   .innerJoin(
    //     s.studentCurriculum,
    //     eq(s.cohortAllocation.studentCurriculumId, s.studentCurriculum.id),
    //   )
    //   .innerJoin(
    //     s.curriculumCompetency,
    //     eq(
    //       s.curriculumCompetency.curriculumId,
    //       s.studentCurriculum.curriculumId,
    //     ),
    //   )
    //   .leftJoin(
    //     progressPerCompetencySq,
    //     eq(
    //       progressPerCompetencySq.competencyId,
    //       s.curriculumCompetency.competencyId,
    //     ),
    //   )
    //   .groupBy(s.cohortAllocation.id, s.studentCurriculum.id)
    //   .where(
    //     and(
    //       isNull(s.cohortAllocation.deletedAt),
    //       eq(s.cohortAllocation.cohortId, input.cohortId),
    //     ),
    //   )

    const rows = await query
      .select({
        id,
        tags,
        createdAt,
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
          eq(s.actor.type, 'student'),
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
      )

    return rows.map((row) => ({
      id: row.id,
      person: {
        id: row.person.id,
        firstName: row.person.firstName,
        lastNamePrefix: row.person.lastNamePrefix,
        lastName: row.person.lastName,
        dateOfBirth: row.person.dateOfBirth,
      },
      instructor: row.instructor?.id
        ? {
            id: row.instructor.id,
            firstName: row.instructor.firstName,
            lastNamePrefix: row.instructor.lastNamePrefix,
            lastName: row.instructor.lastName,
          }
        : null,
      studentCurriculum: row.studentCurriculumId
        ? {
            id: row.studentCurriculumId,
            curriculumId: row.curriculum!.id,
            program: row.program!,
            course: row.course!,
            degree: row.degree!,
            discipline: row.discipline!,
            gearType: row.gearType!,
          }
        : null,
      createdAt: row.createdAt,
      tags: row.tags,
      certificate: row.certificate
        ? {
            id: row.certificate.id,
            handle: row.certificate.handle,
            issuedAt: row.certificate.issuedAt,
            visibleFrom: row.certificate.visibleFrom,
          }
        : null,
    }))
  },
)
