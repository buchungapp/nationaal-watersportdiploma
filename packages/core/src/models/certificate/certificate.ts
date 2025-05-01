import assert from "node:assert";
import crypto from "node:crypto";
import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import {
  and,
  asc,
  desc,
  eq,
  getTableColumns,
  gte,
  inArray,
  isNull,
  lt,
  lte,
  sql,
} from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod";
import {
  useQuery,
  useRedisClient,
  withTransaction,
} from "../../contexts/index.js";
import {
  findItem,
  formatSearchTerms,
  singleOrArray,
  singleRow,
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";
import { Course, Curriculum, Location, User } from "../index.js";

export const find = wrapQuery(
  "certificate.find",
  withZod(
    z.object({
      handle: z.string(),
      issuedAt: z.string().datetime(),
    }),
    async (input) => {
      const query = useQuery();

      const resultQuery = query
        .select()
        .from(s.certificate)
        .where(
          and(
            eq(s.certificate.handle, input.handle),
            isNull(s.certificate.deletedAt),
          ),
        );

      const [result] = await resultQuery;

      if (!result) {
        throw new Error("Failed to find certificate");
      }

      return result;
    },
  ),
);

export const byId = wrapQuery(
  "certificate.byId",
  withZod(uuidSchema, async (input) => {
    const query = useQuery();

    const resultQuery = query
      .select()
      .from(s.certificate)
      .where(and(eq(s.certificate.id, input), isNull(s.certificate.deletedAt)));

    const [result] = await resultQuery;

    if (!result) {
      throw new Error("Failed to find certificate");
    }

    const studentCurriculumQuery = query
      .select()
      .from(s.studentCurriculum)
      .where(eq(s.studentCurriculum.id, result.studentCurriculumId))
      .then(singleRow);

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
      );

    const [location, studentCurriculum, completedCompetencies] =
      await Promise.all([
        Location.fromId(result.locationId),
        studentCurriculumQuery,
        completedCompetencyQuery,
      ]);

    assert(location);

    const [student, gearType, [curriculum]] = await Promise.all([
      User.Person.byIdOrHandle({ id: studentCurriculum.personId }),
      Curriculum.GearType.fromId(studentCurriculum.gearTypeId),
      Curriculum.list({ filter: { id: studentCurriculum.curriculumId } }),
    ]);

    assert(student);
    assert(gearType);
    assert(curriculum);

    const program = await Course.Program.fromId(curriculum.programId);

    assert(program);

    return {
      ...result,
      completedCompetencies,
      location,
      student,
      gearType,
      curriculum,
      program,
    };
  }),
);

export const list = wrapQuery(
  "certificate.list",
  withZod(
    z
      .object({
        filter: z
          .object({
            id: singleOrArray(uuidSchema).optional(),
            number: singleOrArray(z.string().length(10)).optional(),
            locationId: singleOrArray(uuidSchema).optional(),
            personId: singleOrArray(uuidSchema).optional(),
            issuedAfter: z.string().datetime().optional(),
            issuedBefore: z.string().datetime().optional(),
            q: z.string().optional(),
          })
          .default({}),
        sort: z
          .array(
            z.union([
              z.literal("createdAt"),
              z.literal("student"),
              z.literal("instructor"),
            ]),
          )
          .default(["createdAt"]),
        limit: z.number().int().positive().optional(),
        offset: z.number().int().nonnegative().default(0),
        // TODO: alter this default value to be true
        respectVisibility: z.boolean().default(false),
      })
      .default({}),
    async ({ filter, sort, respectVisibility, limit, offset }) => {
      const query = useQuery();

      const studentPerson = alias(s.person, "student_person");
      const instructorActor = alias(s.actor, "instructor_actor");
      const instructorPerson = alias(s.person, "instructor_person");

      const certificates = await query
        .select(getTableColumns(s.certificate))
        .from(s.certificate)
        .innerJoin(
          s.studentCurriculum,
          eq(s.studentCurriculum.id, s.certificate.studentCurriculumId),
        )
        .innerJoin(
          studentPerson,
          eq(studentPerson.id, s.studentCurriculum.personId),
        )
        .leftJoin(
          s.cohortAllocation,
          eq(s.certificate.cohortAllocationId, s.cohortAllocation.id),
        )
        .leftJoin(
          instructorActor,
          eq(instructorActor.id, s.cohortAllocation.instructorId),
        )
        .leftJoin(
          instructorPerson,
          eq(instructorPerson.id, instructorActor.personId),
        )
        .where(
          and(
            filter.id
              ? Array.isArray(filter.id)
                ? inArray(s.certificate.id, filter.id)
                : eq(s.certificate.id, filter.id)
              : undefined,
            filter.number
              ? Array.isArray(filter.number)
                ? inArray(s.certificate.handle, filter.number)
                : eq(s.certificate.handle, filter.number)
              : undefined,
            filter.locationId
              ? Array.isArray(filter.locationId)
                ? inArray(s.certificate.locationId, filter.locationId)
                : eq(s.certificate.locationId, filter.locationId)
              : undefined,
            filter.issuedAfter
              ? gte(s.certificate.issuedAt, filter.issuedAfter)
              : undefined,
            filter.issuedBefore
              ? lt(s.certificate.issuedAt, filter.issuedBefore)
              : undefined,
            filter.personId
              ? Array.isArray(filter.personId)
                ? inArray(s.studentCurriculum.personId, filter.personId)
                : eq(s.studentCurriculum.personId, filter.personId)
              : undefined,
            isNull(s.certificate.deletedAt),
            respectVisibility
              ? lte(s.certificate.visibleFrom, sql`NOW()`)
              : undefined,
            filter.q
              ? sql`(
                setweight(to_tsvector('simple', COALESCE(${s.certificate.handle}, '')), 'A') ||
                setweight(to_tsvector('simple', 
                  COALESCE(${studentPerson.firstName}, '') || ' ' || 
                  COALESCE(${studentPerson.lastNamePrefix}, '') || ' ' || 
                  COALESCE(${studentPerson.lastName}, '')
                ), 'A')
              ) @@ to_tsquery('simple', ${formatSearchTerms(filter.q, "and")})`
              : undefined,
          ),
        )
        .orderBy(
          ...sort.map((sort) => {
            switch (sort) {
              case "student":
                return asc(sql`LOWER(${studentPerson.firstName})`);
              case "instructor":
                return asc(sql`LOWER(${instructorPerson.firstName})`);
              default:
                return desc(s.certificate.createdAt);
            }
          }),
        );

      if (certificates.length === 0) {
        return [];
      }

      const uniqueStudentCurriculumIds = Array.from(
        new Set(certificates.map((c) => c.studentCurriculumId)),
      );

      const uniqueCertificateIds = Array.from(
        new Set(certificates.map((c) => c.id)),
      );

      const studentCurriculaQuery = query
        .select()
        .from(s.studentCurriculum)
        .where(inArray(s.studentCurriculum.id, uniqueStudentCurriculumIds));

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
        );

      const [locations, studentCurricula, completedCompetencies, gearTypes] =
        await Promise.all([
          Location.list(),
          studentCurriculaQuery,
          completedCompetenciesQuery,
          Curriculum.GearType.list(),
        ]);

      const curricula = await Curriculum.list({
        filter: {
          id: Array.from(
            new Set(studentCurricula.map((sc) => sc.curriculumId)),
          ),
        },
      });

      const programs = await Course.Program.list({
        filter: {
          id: Array.from(new Set(curricula.map((c) => c.programId))),
        },
      });

      const students = await User.Person.list({
        filter: {
          personId: Array.from(
            new Set(studentCurricula.map((sc) => sc.personId)),
          ),
        },
      });

      const enrichedCertificates = certificates.map((certificate) => {
        const location = findItem({
          items: locations,
          predicate: (l) => l.id === certificate.locationId,
          enforce: true,
        });

        const studentCurriculum = findItem({
          items: studentCurricula,
          predicate: (sc) => sc.id === certificate.studentCurriculumId,
          enforce: true,
        });

        const student = findItem({
          items: students,
          predicate: (s) => s.id === studentCurriculum.personId,
          enforce: true,
        });

        const relevantCompletedCompetencies = completedCompetencies.filter(
          (cc) =>
            cc.student_completed_competency.studentCurriculumId ===
            studentCurriculum.id,
        );

        const gearType = findItem({
          items: gearTypes,
          predicate: (gt) => gt.id === studentCurriculum.gearTypeId,
          enforce: true,
        });

        const curriculum = findItem({
          items: curricula,
          predicate: (c) => c.id === studentCurriculum.curriculumId,
          enforce: true,
        });

        const program = findItem({
          items: programs,
          predicate: (p) => p.id === curriculum.programId,
          enforce: true,
        });

        return {
          ...certificate,
          location,
          student,
          gearType,
          curriculum,
          program,
          completedCompetencies: relevantCompletedCompetencies,
        };
      });

      return {
        items: enrichedCertificates,
        count: enrichedCertificates.length,
        limit: limit ?? null,
        offset,
      };
    },
  ),
);

export const assignToCohortAllocation = wrapCommand(
  "certificate.assignToCohortAllocation",
  withZod(
    z.object({
      certificateId: uuidSchema,
      cohortAllocationId: uuidSchema.nullable(),
    }),
    async ({ certificateId, cohortAllocationId }) => {
      const query = useQuery();

      await query
        .update(s.certificate)
        .set({ cohortAllocationId: cohortAllocationId })
        .where(
          and(
            eq(s.certificate.id, certificateId),
            isNull(s.certificate.deletedAt),
          ),
        );
    },
  ),
);

export const withdraw = wrapCommand(
  "certificate.withdraw",
  withZod(uuidSchema, async (input) => {
    return withTransaction(async (tx) => {
      const certificate = await tx
        .select()
        .from(s.certificate)
        .where(
          and(
            eq(s.certificate.id, input),
            isNull(s.certificate.deletedAt),
            // Must be maximum 72 hours after the certificate was issued
            gte(
              s.certificate.createdAt,
              dayjs().subtract(72, "h").toISOString(),
            ),
          ),
        )
        .then(singleRow);

      await Promise.all([
        tx
          .update(s.certificate)
          .set({ deletedAt: new Date().toISOString() })
          .where(
            and(
              eq(s.certificate.id, certificate.id),
              isNull(s.certificate.deletedAt),
            ),
          ),
        tx
          .delete(s.studentCompletedCompetency)
          .where(
            eq(s.studentCompletedCompetency.certificateId, certificate.id),
          ),
      ]);
    });
  }),
);

export const storeHandles = wrapCommand(
  "certificate.storeHandles",
  withZod(
    z.object({
      fileName: z.string().optional(),
      sort: z
        .union([z.literal("student"), z.literal("instructor")])
        .default("student"),
      handles: z.array(z.string().length(10)).min(1),
    }),
    async ({ fileName, sort, handles }) => {
      const redis = useRedisClient();
      const uuid = crypto.randomUUID();
      const key = `c-export:${uuid}`;
      const expirationTime = 60 * 60 * 24; // 24 hours in seconds

      const pipeline = redis.pipeline();

      pipeline.sadd(`${key}:items`, handles);
      pipeline.expire(`${key}:items`, expirationTime);

      pipeline.hset(`${key}:settings`, {
        fileName: fileName,
        sort,
      });
      pipeline.expire(`${key}:settings`, expirationTime);

      await pipeline.exec();

      return uuid;
    },
  ),
);

export const retrieveHandles = wrapQuery(
  "certificate.retrieveHandles",
  withZod(
    z.object({
      uuid: z.string().uuid(),
    }),
    z.object({
      settings: z.object({
        fileName: z.string().optional(),
        sort: z.union([z.literal("student"), z.literal("instructor")]),
      }),
      handles: z.array(z.string().length(10)),
    }),
    async ({ uuid }) => {
      const redis = useRedisClient();
      const key = `c-export:${uuid}`;
      const results = await redis
        .pipeline()
        .hgetall(`${key}:settings`)
        .smembers(`${key}:items`)
        .exec();

      if (!results || results.length !== 2) {
        throw new Error("Failed to execute Redis pipeline");
      }

      const [settingsResult, handlesResult] = results;

      if (!settingsResult || !handlesResult) {
        throw new Error("Unexpected Redis pipeline result structure");
      }

      const [settingsError, settings] = settingsResult;
      const [handlesError, handles] = handlesResult;

      if (settingsError || handlesError) {
        throw new Error("Redis operation failed");
      }

      if (!Array.isArray(handles)) {
        throw new Error("Invalid handles data");
      }

      if (handles.length === 0) {
        throw new Error("Export not found");
      }

      const expectedSettingsSchema = z.object({
        fileName: z.string().optional(),
        sort: z.union([z.literal("student"), z.literal("instructor")]),
      });

      return {
        settings: expectedSettingsSchema.parse(settings),
        handles: handles as string[],
      };
    },
  ),
);
