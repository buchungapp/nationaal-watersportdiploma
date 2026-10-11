import { schema as s } from "@nawadi/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.ts";
import {
  dateTimeSchema,
  generateCertificateID,
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../../utils/index.ts";
import { assertVisibleFromWithinAllowedDelay } from "../certificate/visibility.ts";
import { insertSchema } from "./certificate.schema.ts";

export const startCertificate = wrapCommand(
  "student.certificate.start",
  withZod(
    insertSchema.pick({
      studentCurriculumId: true,
      locationId: true,
    }),
    successfulCreateResponse,
    async (input) => {
      const query = useQuery();

      const [insert] = await query
        .insert(s.certificate)
        .values({
          handle: generateCertificateID(),
          studentCurriculumId: input.studentCurriculumId,
          locationId: input.locationId,
        })
        .returning({ id: s.certificate.id });

      if (!insert) {
        throw new Error("Failed to start certificate");
      }

      return insert;
    },
  ),
);

export const completeCompetency = wrapCommand(
  "student.certificate.completeCompetency",
  withZod(
    z.object({
      studentCurriculumId: uuidSchema,
      competencyId: singleOrArray(uuidSchema),
      certificateId: uuidSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();

      const certificate = await query
        .select({ id: s.certificate.id })
        .from(s.certificate)
        .where(
          and(
            eq(s.certificate.id, input.certificateId),
            isNull(s.certificate.issuedAt),
          ),
        );

      if (certificate.length < 1) {
        throw new Error("No (mutable) certificate found");
      }

      const competencies = Array.from(
        new Set(
          Array.isArray(input.competencyId)
            ? input.competencyId
            : [input.competencyId],
        ),
      );

      // Check if all competencies belong to the student's curriculum
      const validCompetencies = await query
        .select({ competencyId: s.curriculumCompetency.id })
        .from(s.curriculumCompetency)
        .innerJoin(
          s.studentCurriculum,
          eq(
            s.curriculumCompetency.curriculumId,
            s.studentCurriculum.curriculumId,
          ),
        )
        .where(
          and(
            eq(s.studentCurriculum.id, input.studentCurriculumId),
            inArray(s.curriculumCompetency.id, competencies),
          ),
        );

      const validCompetencyIds = validCompetencies.map((c) => c.competencyId);

      // Check if all provided competencies are valid
      const invalidCompetencies = competencies.filter(
        (id) => !validCompetencyIds.includes(id),
      );

      if (invalidCompetencies.length > 0) {
        throw new Error(
          `Competencies [${invalidCompetencies.join(", ")}] do not belong to the student's curriculum`,
        );
      }

      const existingCompletedCompetencies = await query
        .select({
          competencyId: s.studentCompletedCompetency.competencyId,
        })
        .from(s.studentCompletedCompetency)
        .where(
          and(
            eq(
              s.studentCompletedCompetency.studentCurriculumId,
              input.studentCurriculumId,
            ),
            inArray(s.studentCompletedCompetency.competencyId, competencies),
            eq(s.studentCompletedCompetency.isMergeConflictDuplicate, false),
            isNull(s.studentCompletedCompetency.deletedAt),
          ),
        );

      if (existingCompletedCompetencies.length > 0) {
        throw new Error(
          `Competencies [${existingCompletedCompetencies.map((competency) => competency.competencyId).join(", ")}] already completed for this student curriculum`,
        );
      }

      await query.insert(s.studentCompletedCompetency).values(
        competencies.map((competencyId) => ({
          studentCurriculumId: input.studentCurriculumId,
          competencyId,
          certificateId: input.certificateId,
          isMergeConflictDuplicate: false,
        })),
      );

      return;
    },
  ),
);

export const completeCertificate = wrapCommand(
  "student.certificate.complete",
  withZod(
    z.object({
      certificateId: uuidSchema,
      visibleFrom: dateTimeSchema,
    }),
    z.void(),
    async (input) => {
      const query = useQuery();
      const issuedAt = new Date().toISOString();

      assertVisibleFromWithinAllowedDelay({
        issuedAt,
        visibleFrom: input.visibleFrom,
      });

      const [res] = await query
        .update(s.certificate)
        .set({
          issuedAt,
          visibleFrom: input.visibleFrom,
        })
        .where(eq(s.certificate.id, input.certificateId))
        .returning({ id: s.certificate.id });

      if (!res) {
        throw new Error("Failed to complete certificate");
      }

      return;
    },
  ),
);
