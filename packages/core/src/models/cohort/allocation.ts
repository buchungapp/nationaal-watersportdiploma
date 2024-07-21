import { schema as s } from '@nawadi/db'
import { enums } from '@nawadi/lib'
import {
  SQL,
  and,
  arrayContains,
  asc,
  eq,
  exists,
  getTableColumns,
  gte,
  isNotNull,
  isNull,
  lte,
  sql,
} from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core/alias'
import { inArray } from 'drizzle-orm/sql/expressions'
import { z } from 'zod'
import { useQuery, withTransaction } from '../../contexts/index.js'
import {
  applyArrayOrEqual,
  possibleSingleRow,
  singleOrArray,
  singleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from '../../utils/index.js'
import { selectSchema as actorSelectSchema } from '../user/actor.schema.js'
import { selectSchema as personSelectSchema } from '../user/person.schema.js'
import { insertSchema, selectSchema } from './allocation.schema.js'

export const create = withZod(
  insertSchema.pick({
    actorId: true,
    cohortId: true,
    studentCurriculumId: true,
    tags: true,
  }),
  successfulCreateResponse,
  async (item) => {
    const query = useQuery()

    const actorType = await query
      .select({ type: s.actor.type })
      .from(s.actor)
      .where(
        and(
          eq(s.actor.id, item.actorId),
          isNull(s.actor.deletedAt),
          // Only allow students and instructors
          inArray(s.actor.type, ['student', 'instructor']),
        ),
      )
      .then(singleRow)

    if (actorType.type === 'instructor') {
      // We don't want duplicate instructors in a cohort
      const exists = await query
        .select({ id: s.cohortAllocation.id })
        .from(s.cohortAllocation)
        .where(
          and(
            eq(s.cohortAllocation.actorId, item.actorId),
            eq(s.cohortAllocation.cohortId, item.cohortId),
            isNull(s.cohortAllocation.deletedAt),
          ),
        )
        .then(possibleSingleRow)

      if (exists) {
        return exists
      }
    }

    const row = await query
      .insert(s.cohortAllocation)
      .values({
        actorId: item.actorId,
        cohortId: item.cohortId,
        studentCurriculumId: item.studentCurriculumId,
        tags: item.tags,
      })
      .returning({ id: s.cohortAllocation.id })
      .then(singleRow)

    return row
  },
)

export const remove = withZod(
  z.object({
    id: uuidSchema,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.cohortAllocation)
      .set({ deletedAt: sql`NOW()` })
      .where(
        and(
          eq(s.cohortAllocation.id, input.id),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .returning({ id: s.cohortAllocation.id })
      .then(singleRow)
  },
)

export const listAndCountForCohort = withZod(
  z.object({
    where: z.object({
      cohortId: uuidSchema,
      tags: z.string().array().optional(),
      gearTypeId: singleOrArray(uuidSchema).optional(),
    }),
  }),
  z.object({
    rows: selectSchema
      .pick({
        id: true,
        tags: true,
        createdAt: true,
        studentCurriculumId: true,
      })
      .extend({
        actor: z.object({
          id: selectSchema.shape.actorId,
          type: actorSelectSchema.shape.type,
        }),
        person: personSelectSchema.pick({
          id: true,
          firstName: true,
          lastNamePrefix: true,
          lastName: true,
        }),
      })
      .array(),
    count: z.number(),
  }),
  async (input) => {
    const query = useQuery()

    const whereClausules: (SQL | undefined)[] = [
      isNull(s.cohortAllocation.deletedAt),
      eq(s.cohortAllocation.cohortId, input.where.cohortId),
      input.where.tags
        ? arrayContains(s.cohortAllocation.tags, input.where.tags)
        : undefined,
      input.where.gearTypeId
        ? exists(
            query
              .select({ id: sql`1` })
              .from(s.studentCurriculum)
              .where(
                and(
                  eq(
                    s.studentCurriculum.id,
                    s.cohortAllocation.studentCurriculumId,
                  ),
                  applyArrayOrEqual(
                    s.studentCurriculum.gearTypeId,
                    input.where.gearTypeId,
                  ),
                ),
              ),
          )
        : undefined,
    ]

    const { id, tags, actorId, createdAt, studentCurriculumId } =
      getTableColumns(s.cohortAllocation)

    const rows = await query
      .select({
        id,
        tags,
        studentCurriculumId,
        actor: {
          id: actorId,
          type: s.actor.type,
        },
        person: {
          id: s.person.id,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
        },
        createdAt,
      })
      .from(s.cohortAllocation)
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          isNull(s.actor.deletedAt),
        ),
      )
      .innerJoin(
        s.person,
        and(eq(s.person.id, s.actor.personId), isNull(s.person.deletedAt)),
      )
      .where(and(...whereClausules))

    return {
      rows,
      count: rows.length,
    }
  },
)

export const listByPersonId = withZod(
  z.object({
    cohortId: uuidSchema,
    personId: uuidSchema,
    actorType: singleOrArray(z.enum(['student', 'instructor'])).default([
      'student',
      'instructor',
    ]),
  }),
  z
    .object({
      allocationId: uuidSchema,
      actorId: uuidSchema,
      type: z.enum(['student', 'instructor']),
    })
    .array(),
  async (input) => {
    const query = useQuery()

    const rows = await query
      .select({
        allocationId: s.cohortAllocation.id,
        actorId: s.actor.id,
        type: s.actor.type,
      })
      .from(s.cohortAllocation)
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          isNull(s.actor.deletedAt),
          Array.isArray(input.actorType)
            ? inArray(s.actor.type, input.actorType)
            : eq(s.actor.type, input.actorType),
        ),
      )
      .innerJoin(
        s.person,
        and(
          eq(s.person.id, s.actor.personId),
          isNull(s.person.deletedAt),
          eq(s.person.id, input.personId),
        ),
      )
      .where(
        and(
          eq(s.cohortAllocation.cohortId, input.cohortId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )

    return rows as {
      allocationId: string
      actorId: string
      type: 'student' | 'instructor'
    }[]
  },
)

export const isActorInCohortById = withZod(
  z.object({
    cohortId: uuidSchema,
    actorId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const exists = await query
      .select({ id: sql`1` })
      .from(s.cohortAllocation)
      .where(
        and(
          eq(s.cohortAllocation.cohortId, input.cohortId),
          eq(s.cohortAllocation.actorId, input.actorId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .then(possibleSingleRow)

    return !!exists
  },
)

export const setInstructorForStudent = withZod(
  z.object({
    instructorActorId: uuidSchema.nullable(),
    cohortId: uuidSchema,
    studentAllocationId: singleOrArray(uuidSchema),
  }),
  async (input) => {
    const query = useQuery()

    if (!!input.instructorActorId) {
      // Make sure the instructorId belong to an actor with type instructor and is in the cohort
      await query
        .select({ id: sql`1` })
        .from(s.cohortAllocation)
        .innerJoin(
          s.actor,
          and(
            eq(s.actor.id, s.cohortAllocation.actorId),
            isNull(s.actor.deletedAt),
            eq(s.actor.type, 'instructor'),
            eq(s.actor.id, input.instructorActorId),
          ),
        )
        .where(
          and(
            eq(s.cohortAllocation.actorId, input.instructorActorId),
            eq(s.cohortAllocation.cohortId, input.cohortId),
            isNull(s.cohortAllocation.deletedAt),
          ),
        )
        .then(singleRow)
    }

    return await query
      .update(s.cohortAllocation)
      .set({ instructorId: input.instructorActorId })
      .where(
        and(
          Array.isArray(input.studentAllocationId)
            ? inArray(s.cohortAllocation.id, input.studentAllocationId)
            : eq(s.cohortAllocation.id, input.studentAllocationId),
          eq(s.cohortAllocation.cohortId, input.cohortId),
        ),
      )
      .returning({ id: s.cohortAllocation.id })
  },
)

export const setStudentCurriculum = withZod(
  z.object({
    studentCurriculumId: uuidSchema,
    cohortId: uuidSchema,
    studentAllocationId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.cohortAllocation)
      .set({ studentCurriculumId: input.studentCurriculumId })
      .where(
        and(
          eq(s.cohortAllocation.id, input.studentAllocationId),
          eq(s.cohortAllocation.cohortId, input.cohortId),
          exists(
            query
              .select({ id: sql`1` })
              .from(s.actor)
              .where(
                and(
                  eq(s.actor.id, s.cohortAllocation.actorId),
                  isNull(s.actor.deletedAt),
                  eq(s.actor.type, 'student'),
                ),
              ),
          ),
        ),
      )
      .returning({ id: s.cohortAllocation.id })
  },
)

export const releaseStudentCurriculum = withZod(
  z.object({
    studentAllocationId: uuidSchema,
  }),
  async (input) => {
    return withTransaction(async (tx) => {
      // TODO: handle case when we already assigned a certificate

      await Promise.all([
        tx
          .update(s.cohortAllocation)
          .set({ studentCurriculumId: null })
          .where(and(eq(s.cohortAllocation.id, input.studentAllocationId)))
          .returning({ id: s.cohortAllocation.id }),
        tx
          .delete(s.studentCohortProgress)
          .where(
            and(
              eq(
                s.studentCohortProgress.cohortAllocationId,
                input.studentAllocationId,
              ),
            ),
          ),
      ])

      return
    })
  },
)

export const listPrivilegesForPerson = withZod(
  z.object({
    cohortId: uuidSchema,
    personId: uuidSchema,
  }),
  enums.Privilege.array(),
  async (input) => {
    const query = useQuery()

    const rows = await query
      .selectDistinct({
        handle: s.privilege.handle,
      })
      .from(s.cohortAllocation)
      .innerJoin(
        s.cohortAllocationRole,
        and(
          eq(s.cohortAllocationRole.cohortAllocationId, s.cohortAllocation.id),
          isNull(s.cohortAllocationRole.deletedAt),
        ),
      )
      .innerJoin(s.role, eq(s.role.id, s.cohortAllocationRole.roleId))
      .innerJoin(s.rolePrivilege, eq(s.rolePrivilege.roleId, s.role.id))
      .innerJoin(s.privilege, eq(s.privilege.id, s.rolePrivilege.privilegeId))
      .where(
        and(
          exists(
            query
              .select({ id: sql`1` })
              .from(s.actor)
              .where(
                and(
                  eq(s.actor.id, s.cohortAllocation.actorId),
                  eq(s.actor.personId, input.personId),
                  isNull(s.actor.deletedAt),
                ),
              ),
          ),
          exists(
            query
              .select({ id: sql`1` })
              .from(s.cohort)
              .where(
                and(
                  eq(s.cohort.id, s.cohortAllocation.cohortId),
                  lte(s.cohort.accessStartTime, sql`NOW()`),
                  gte(s.cohort.accessEndTime, sql`NOW()`),
                  isNull(s.cohort.deletedAt),
                ),
              ),
          ),
          eq(s.cohortAllocation.cohortId, input.cohortId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )

    return enums.Privilege.array().parse(rows.map((row) => row.handle))
  },
)

export const listStudentsWithCurricula = withZod(
  z.object({
    cohortId: uuidSchema.optional(),
    personId: uuidSchema.optional(),
    respectCohortVisibility: z.boolean().default(false),
    respectProgressVisibility: z.boolean().default(false),
  }),
  async (input) => {
    const query = useQuery()

    const { id, tags, createdAt, progressVisibleUpUntil } = getTableColumns(
      s.cohortAllocation,
    )

    const instructorActor = alias(s.actor, 'instructor_actor')
    const instructorPerson = alias(s.person, 'instructor_person')

    const rows = await query
      .select({
        id,
        tags,
        createdAt,
        progressVisibleUpUntil,
        person: {
          id: s.person.id,
          handle: s.person.handle,
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
        cohort: {
          id: s.cohort.id,
          label: s.cohort.label,
        },
        location: {
          id: s.location.id,
          name: s.location.name,
        },
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
      .innerJoin(s.cohort, eq(s.cohort.id, s.cohortAllocation.cohortId))
      .innerJoin(s.location, eq(s.location.id, s.cohort.locationId))
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
      .where(
        and(
          isNull(s.cohortAllocation.deletedAt),
          input.cohortId
            ? eq(s.cohortAllocation.cohortId, input.cohortId)
            : undefined,
          input.personId ? eq(s.person.id, input.personId) : undefined,
          input.respectCohortVisibility
            ? and(
                lte(s.cohort.accessStartTime, sql`NOW()`),
                gte(s.cohort.accessEndTime, sql`NOW()`),
              )
            : undefined,
          input.respectProgressVisibility
            ? isNotNull(s.cohortAllocation.progressVisibleUpUntil)
            : undefined,
        ),
      )
      .orderBy(
        asc(sql`LOWER(${s.person.firstName})`),
        asc(sql`LOWER(${s.person.lastName})`),
      )

    return rows.map((row) => ({
      id: row.id,
      progressVisibleForStudentUpUntil: row.progressVisibleUpUntil,
      person: {
        id: row.person.id,
        handle: row.person.handle!,
        firstName: row.person.firstName,
        lastNamePrefix: row.person.lastNamePrefix,
        lastName: row.person.lastName,
        dateOfBirth: row.person.dateOfBirth,
      },
      cohort: {
        id: row.cohort.id,
        label: row.cohort.label,
      },
      location: {
        id: row.location.id,
        name: row.location.name,
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
    }))
  },
)

export const retrieveStudentWithCurriculum = withZod(
  z.object({
    cohortId: uuidSchema.optional(),
    allocationId: uuidSchema,
    respectCohortVisibility: z.boolean().default(false),
    respectProgressVisibility: z.boolean().default(false),
  }),
  async (input) => {
    const query = useQuery()

    const { id, tags, createdAt, progressVisibleUpUntil } = getTableColumns(
      s.cohortAllocation,
    )

    const instructorActor = alias(s.actor, 'instructor_actor')
    const instructorPerson = alias(s.person, 'instructor_person')

    const row = await query
      .select({
        id,
        tags,
        createdAt,
        progressVisibleUpUntil,
        person: {
          id: s.person.id,
          handle: s.person.handle,
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
        cohort: {
          id: s.cohort.id,
          label: s.cohort.label,
        },
        location: {
          id: s.location.id,
          name: s.location.name,
        },
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
      .innerJoin(s.cohort, eq(s.cohort.id, s.cohortAllocation.cohortId))
      .innerJoin(s.location, eq(s.location.id, s.cohort.locationId))
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
          isNull(s.cohort.deletedAt),
          eq(s.cohortAllocation.id, input.allocationId),
          input.cohortId
            ? eq(s.cohortAllocation.cohortId, input.cohortId)
            : undefined,
          input.respectCohortVisibility
            ? and(
                lte(s.cohort.accessStartTime, sql`NOW()`),
                gte(s.cohort.accessEndTime, sql`NOW()`),
              )
            : undefined,
          input.respectProgressVisibility
            ? isNotNull(s.cohortAllocation.progressVisibleUpUntil)
            : undefined,
        ),
      )
      .then(possibleSingleRow)

    if (!row) {
      return null
    }

    return {
      id: row.id,
      progressVisibleForStudentUpUntil: row.progressVisibleUpUntil,
      cohort: {
        id: row.cohort.id,
        label: row.cohort.label,
      },
      location: {
        id: row.location.id,
        name: row.location.name,
      },
      person: {
        id: row.person.id,
        handle: row.person.handle!,
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
    }
  },
)

export const listInstructors = withZod(
  z.object({
    cohortId: uuidSchema,
  }),
  async (input) => {
    const query = useQuery()

    const { id, createdAt } = getTableColumns(s.cohortAllocation)

    const rows = await query
      .select({
        id,
        createdAt,
        person: {
          id: s.person.id,
          handle: s.person.handle,
          firstName: s.person.firstName,
          lastNamePrefix: s.person.lastNamePrefix,
          lastName: s.person.lastName,
          dateOfBirth: s.person.dateOfBirth,
          email: s.user.email,
        },
        role: {
          id: s.role.id,
          handle: s.role.handle,
          title: s.role.title,
        },
      })
      .from(s.cohortAllocation)
      .innerJoin(
        s.actor,
        and(
          eq(s.actor.id, s.cohortAllocation.actorId),
          eq(s.actor.type, 'instructor'),
          isNull(s.actor.deletedAt),
        ),
      )
      .innerJoin(s.person, eq(s.person.id, s.actor.personId))
      .leftJoin(s.user, eq(s.user.authUserId, s.person.userId))
      .leftJoin(
        s.cohortAllocationRole,
        and(
          eq(s.cohortAllocationRole.cohortAllocationId, s.cohortAllocation.id),
          isNull(s.cohortAllocationRole.deletedAt),
        ),
      )
      .leftJoin(
        s.role,
        and(
          eq(s.role.id, s.cohortAllocationRole.roleId),
          isNull(s.role.deletedAt),
        ),
      )
      .where(
        and(
          isNull(s.cohortAllocation.deletedAt),
          eq(s.cohortAllocation.cohortId, input.cohortId),
        ),
      )

    // Group the results by instructor
    const instructorsMap = new Map<
      string,
      {
        id: string
        person: {
          id: string
          handle: string
          firstName: string
          lastNamePrefix: string | null
          lastName: string | null
          dateOfBirth: string | null
          email: string | null
        }
        roles: {
          id: string
          handle: string
          title: string | null
        }[]
        createdAt: string
      }
    >()

    for (const row of rows) {
      if (!instructorsMap.has(row.person.id)) {
        instructorsMap.set(row.person.id, {
          id: row.id,
          person: {
            id: row.person.id,
            handle: row.person.handle!,
            firstName: row.person.firstName,
            lastNamePrefix: row.person.lastNamePrefix,
            lastName: row.person.lastName,
            dateOfBirth: row.person.dateOfBirth,
            email: row.person.email,
          },
          roles: [],
          createdAt: row.createdAt,
        })
      }

      const instructor = instructorsMap.get(row.person.id)!
      if (row.role && !instructor.roles.some((r) => r.id === row.role!.id)) {
        instructor.roles.push({
          id: row.role.id,
          handle: row.role.handle,
          title: row.role.title,
        })
      }
    }

    return Array.from(instructorsMap.values())
  },
)

export const addRole = withZod(
  z.object({
    cohortId: uuidSchema,
    allocationId: uuidSchema,
    roleHandle: z.string(),
  }),
  async (input) => {
    const query = useQuery()

    const role = await query
      .select({ id: s.role.id })
      .from(s.role)
      .where(and(eq(s.role.handle, input.roleHandle), isNull(s.role.deletedAt)))
      .then(singleRow)

    return await query
      .insert(s.cohortAllocationRole)
      .values({
        cohortAllocationId: input.allocationId,
        roleId: role.id,
      })
      .onConflictDoNothing()
  },
)

export const withdrawlRole = withZod(
  z.object({
    cohortId: uuidSchema,
    allocationId: uuidSchema,
    roleHandle: z.string(),
  }),
  async (input) => {
    const query = useQuery()

    const role = await query
      .select({ id: s.role.id })
      .from(s.role)
      .where(and(eq(s.role.handle, input.roleHandle), isNull(s.role.deletedAt)))
      .then(singleRow)

    // TODO: this is a hard delete, since our PK is a composite key
    return await query
      .delete(s.cohortAllocationRole)
      .where(
        and(
          eq(s.cohortAllocationRole.cohortAllocationId, input.allocationId),
          eq(s.cohortAllocationRole.roleId, role.id),
        ),
      )
  },
)

export const setTags = withZod(
  z.object({
    allocationId: singleOrArray(uuidSchema),
    tags: z.string().array(),
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.cohortAllocation)
      .set({ tags: input.tags })
      .where(
        Array.isArray(input.allocationId)
          ? inArray(s.cohortAllocation.id, input.allocationId)
          : eq(s.cohortAllocation.id, input.allocationId),
      )
      .returning({ id: s.cohortAllocation.id })
      .then(singleRow)
  },
)

export const makeProgressVisible = withZod(
  z.object({
    allocationId: singleOrArray(uuidSchema),
    visibleUpUntil: z.string().datetime().optional(),
  }),
  async (input) => {
    const query = useQuery()

    return await query
      .update(s.cohortAllocation)
      .set({ progressVisibleUpUntil: input.visibleUpUntil ?? sql`NOW()` })
      .where(
        Array.isArray(input.allocationId)
          ? inArray(s.cohortAllocation.id, input.allocationId)
          : eq(s.cohortAllocation.id, input.allocationId),
      )
      .returning({ id: s.cohortAllocation.id })
      .then(singleRow)
  },
)
