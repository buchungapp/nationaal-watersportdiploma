import { schema as s } from "@nawadi/db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { exists } from "drizzle-orm/expressions";
import { sql } from "drizzle-orm/sql/sql";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  possibleSingleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/index.js";
import { insertSchema } from "./curriculum.schema.js";

export const start = withZod(
  insertSchema.pick({
    personId: true,
    curriculumId: true,
    gearTypeId: true,
    startedAt: true,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    const [insert] = await query
      .insert(s.studentCurriculum)
      .values({
        personId: input.personId,
        curriculumId: input.curriculumId,
        gearTypeId: input.gearTypeId,
        startedAt: input.startedAt,
      })
      .returning({ id: s.studentCurriculum.id });

    if (!insert) {
      throw new Error("Failed to start program");
    }

    return insert;
  },
);

export const findOrEnroll = withZod(
  insertSchema.pick({
    personId: true,
    curriculumId: true,
    gearTypeId: true,
    startedAt: true,
  }),
  successfulCreateResponse,
  async (input) => {
    const query = useQuery();

    // Check for existing student curriculum
    const existingCurriculum = await query
      .select({ id: s.studentCurriculum.id })
      .from(s.studentCurriculum)
      .where(
        and(
          eq(s.studentCurriculum.personId, input.personId),
          eq(s.studentCurriculum.curriculumId, input.curriculumId),
          eq(s.studentCurriculum.gearTypeId, input.gearTypeId),
          isNull(s.studentCurriculum.deletedAt),
        ),
      )
      .then(possibleSingleRow);

    if (existingCurriculum) {
      return existingCurriculum;
    }

    const [insert] = await query
      .insert(s.studentCurriculum)
      .values({
        personId: input.personId,
        curriculumId: input.curriculumId,
        gearTypeId: input.gearTypeId,
        startedAt: input.startedAt,
      })
      .returning({ id: s.studentCurriculum.id });

    if (!insert) {
      throw new Error("Failed to start program");
    }

    return insert;
  },
);

export const listCompletedCompetenciesById = withZod(
  z.object({
    id: uuidSchema,
  }),
  async (input) => {
    const query = useQuery();

    const rows = await query
      .select()
      .from(s.studentCompletedCompetency)
      .where(
        and(
          eq(s.studentCompletedCompetency.studentCurriculumId, input.id),
          isNull(s.studentCompletedCompetency.deletedAt),
          exists(
            query
              .select({ id: sql`1` })
              .from(s.studentCurriculum)
              .where(
                and(
                  eq(s.studentCurriculum.id, input.id),
                  isNull(s.studentCurriculum.deletedAt),
                ),
              ),
          ),
          exists(
            query
              .select({ id: sql`1` })
              .from(s.certificate)
              .where(
                and(
                  eq(
                    s.certificate.id,
                    s.studentCompletedCompetency.certificateId,
                  ),
                  isNull(s.certificate.deletedAt),
                  isNotNull(s.certificate.issuedAt),
                ),
              ),
          ),
        ),
      );

    return rows.map((row) => ({
      certificateId: row.certificateId,
      competencyId: row.competencyId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }));
  },
);
