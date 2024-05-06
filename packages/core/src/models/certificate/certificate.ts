import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { and, desc, eq, gte, inArray, lt } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { findItem, singleRow, uuidSchema, withZod } from '../../utils/index.js'
import { Curriculum, Location, Program, User } from '../index.js'

export const find = withZod(
  z.object({
    handle: z.string(),
    issuedAt: z.string().datetime(),
  }),
  async (input) => {
    const query = useQuery()

    const resultQuery = query
      .select()
      .from(s.certificate)
      .where(and(eq(s.certificate.handle, input.handle)))

    const [result] = await resultQuery

    if (!result) {
      throw new Error('Failed to find certificate')
    }

    return result
  },
)

export const byId = withZod(uuidSchema, async (input) => {
  const query = useQuery()

  const resultQuery = query
    .select()
    .from(s.certificate)
    .where(eq(s.certificate.id, input))

  const [result] = await resultQuery

  if (!result) {
    throw new Error('Failed to find certificate')
  }

  const studentCurriculumQuery = query
    .select()
    .from(s.studentCurriculum)
    .where(eq(s.studentCurriculum.id, result.studentCurriculumId))
    .then(singleRow)

  const completedCompetencyQuery = query
    .select()
    .from(s.studentCompletedCompetency)
    .innerJoin(
      s.curriculumCompetency,
      eq(s.studentCompletedCompetency.competencyId, s.curriculumCompetency.id),
    )
    .where(
      and(
        eq(
          s.studentCompletedCompetency.studentCurriculumId,
          result.studentCurriculumId,
        ),
        eq(s.studentCompletedCompetency.certificateId, result.id),
      ),
    )

  const [location, studentCurriculum, completedCompetencies] =
    await Promise.all([
      Location.fromId(result.locationId),
      studentCurriculumQuery,
      completedCompetencyQuery,
    ])

  assert(location)

  const [student, gearType, [curriculum]] = await Promise.all([
    User.Person.fromId(studentCurriculum.personId),
    Curriculum.GearType.fromId(studentCurriculum.gearTypeId),
    Curriculum.list({ filter: { id: studentCurriculum.curriculumId } }),
  ])

  assert(student)
  assert(gearType)
  assert(curriculum)

  const program = await Program.fromId(curriculum.programId)

  assert(program)

  return {
    ...result,
    completedCompetencies,
    location,
    student,
    gearType,
    curriculum,
    program,
  }
})

export const list = withZod(
  z
    .object({
      filter: z
        .object({
          locationId: uuidSchema.optional(),
          issuedAfter: z.string().datetime().optional(),
          issuedBefore: z.string().datetime().optional(),
        })
        .default({}),
    })
    .default({}),
  async ({ filter }) => {
    const query = useQuery()

    const certificates = await query
      .select()
      .from(s.certificate)
      .where(
        and(
          filter.locationId
            ? eq(s.certificate.locationId, filter.locationId)
            : undefined,
          filter.issuedAfter
            ? gte(s.certificate.issuedAt, filter.issuedAfter)
            : undefined,
          filter.issuedBefore
            ? lt(s.certificate.issuedAt, filter.issuedBefore)
            : undefined,
        ),
      )
      .orderBy(desc(s.certificate.createdAt))

    if (certificates.length === 0) {
      return []
    }

    const uniqueStudentCurriculumIds = Array.from(
      new Set(certificates.map((c) => c.studentCurriculumId)),
    )

    const uniqueCertificateIds = Array.from(
      new Set(certificates.map((c) => c.id)),
    )

    const studentCurriculaQuery = query
      .select()
      .from(s.studentCurriculum)
      .where(inArray(s.studentCurriculum.id, uniqueStudentCurriculumIds))

    const completedCompetenciesQuery = query
      .select()
      .from(s.studentCompletedCompetency)
      .innerJoin(
        s.curriculumCompetency,
        eq(
          s.studentCompletedCompetency.competencyId,
          s.curriculumCompetency.id,
        ),
      )
      .where(
        and(
          inArray(
            s.studentCompletedCompetency.studentCurriculumId,
            uniqueStudentCurriculumIds,
          ),
          inArray(
            s.studentCompletedCompetency.certificateId,
            uniqueCertificateIds,
          ),
        ),
      )

    const [
      locations,
      studentCurricula,
      completedCompetencies,
      users,
      gearTypes,
    ] = await Promise.all([
      Location.list(),
      studentCurriculaQuery,
      completedCompetenciesQuery,
      User.Person.list({ filter: { locationId: filter.locationId } }),
      Curriculum.GearType.list(),
    ])

    const curricula = await Curriculum.list({
      filter: {
        id: Array.from(new Set(studentCurricula.map((sc) => sc.curriculumId))),
      },
    })

    const programs = await Program.list({
      filter: {
        id: Array.from(new Set(curricula.map((c) => c.programId))),
      },
    })

    return certificates.map((certificate) => {
      const location = findItem({
        items: locations,
        predicate: (l) => l.id === certificate.locationId,
        enforce: true,
      })

      const studentCurriculum = findItem({
        items: studentCurricula,
        predicate: (sc) => sc.id === certificate.studentCurriculumId,
        enforce: true,
      })

      const student = findItem({
        items: users,
        predicate: (u) => u.id === studentCurriculum.personId,
        enforce: true,
      })

      const relevantCompletedCompetencies = completedCompetencies.filter(
        (cc) =>
          cc.student_completed_competency.studentCurriculumId ===
          studentCurriculum.id,
      )

      const gearType = findItem({
        items: gearTypes,
        predicate: (gt) => gt.id === studentCurriculum.gearTypeId,
        enforce: true,
      })

      const curriculum = findItem({
        items: curricula,
        predicate: (c) => c.id === studentCurriculum.curriculumId,
        enforce: true,
      })

      const program = findItem({
        items: programs,
        predicate: (p) => p.id === curriculum.programId,
        enforce: true,
      })

      return {
        ...certificate,
        location,
        student,
        gearType,
        curriculum,
        program,
        completedCompetencies: relevantCompletedCompetencies,
      }
    })
  },
)
