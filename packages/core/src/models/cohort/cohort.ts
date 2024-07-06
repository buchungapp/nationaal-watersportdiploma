import { schema as s } from '@nawadi/db'
import { SQL, and, asc, eq, getTableColumns, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { useQuery } from '../../contexts/index.js'
import {
  handleSchema,
  possibleSingleRow,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { insertSchema, selectSchema } from './cohort.schema.js'

export const create = withZod(
  insertSchema
    .pick({
      label: true,
      handle: true,
      locationId: true,
      accessStartTime: true,
      accessEndTime: true,
    })
    .refine((data) => {
      return data.accessStartTime < data.accessEndTime
    }, 'accessStartTime should be before accessEndTime'),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const row = await query
      .insert(s.cohort)
      .values({
        label: item.label,
        handle: item.handle,
        locationId: item.locationId,
        accessStartTime: item.accessStartTime,
        accessEndTime: item.accessEndTime,
      })
      .returning({ id: s.cohort.id })
      .then(singleRow)

    return row
  },
)

export const listByLocationId = withZod(
  z.object({
    id: uuidSchema,
  }),
  selectSchema.array(),
  async (input) => {
    const query = useQuery()

    const rows = await query
      .select()
      .from(s.cohort)
      .where(eq(s.cohort.locationId, input.id))
      .orderBy(asc(s.cohort.accessStartTime), asc(s.cohort.accessEndTime))

    return rows
  },
)

export const byIdOrHandle = withZod(
  z.union([
    z.object({ id: uuidSchema }),
    z.object({ handle: handleSchema, locationId: uuidSchema }),
  ]),
  selectSchema.nullable(),
  async (input) => {
    const query = useQuery()

    const whereClausules: (SQL | undefined)[] = []

    if ('id' in input) {
      whereClausules.push(eq(s.cohort.id, input.id))
    }

    if ('handle' in input) {
      whereClausules.push(eq(s.cohort.handle, input.handle))
      whereClausules.push(eq(s.cohort.locationId, input.locationId))
    }

    const rows = await query
      .select()
      .from(s.cohort)
      .where(and(...whereClausules))

    const row = possibleSingleRow(rows)

    return row ?? null
  },
)

export const listStudentsWithCurricula = withZod(
  z.object({
    cohortId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const { id, tags, createdAt } = getTableColumns(s.cohortAllocation)

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
      .where(
        and(
          isNull(s.cohortAllocation.deletedAt),
          eq(s.cohortAllocation.cohortId, input.cohortId),
        ),
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
    }))
  },
)

export const retrieveStudentWithCurriculum = withZod(
  z.object({
    cohortId: uuidSchema,
    allocationId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const { id, tags, createdAt } = getTableColumns(s.cohortAllocation)

    const row = await query
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
      .where(
        and(
          isNull(s.cohortAllocation.deletedAt),
          eq(s.cohortAllocation.cohortId, input.cohortId),
          eq(s.cohortAllocation.id, input.allocationId),
        ),
      )
      .then(possibleSingleRow)

    if (!row) {
      return null
    }

    return {
      id: row.id,
      person: {
        id: row.person.id,
        firstName: row.person.firstName,
        lastNamePrefix: row.person.lastNamePrefix,
        lastName: row.person.lastName,
        dateOfBirth: row.person.dateOfBirth,
      },
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
    }
  },
)
