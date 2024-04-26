import { schema as s } from '@nawadi/db'
import assert from 'assert'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import { withZod } from '../../utils/index.js'
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

    const studentCurriculumQuery = query
      .select()
      .from(s.studentCurriculum)
      .where(eq(s.studentCurriculum.id, result.studentCurriculumId))

    const completedCompetencyQuery = query
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
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            result.studentCurriculumId,
          ),
          eq(s.studentCompletedCompetency.certificateId, result.id),
        ),
      )

    const [location, [studentCurriculum], completedCompetencies] =
      await Promise.all([
        Location.fromId(result.locationId),
        studentCurriculumQuery,
        completedCompetencyQuery,
      ])

    assert(location)
    assert(studentCurriculum)

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
  },
)
