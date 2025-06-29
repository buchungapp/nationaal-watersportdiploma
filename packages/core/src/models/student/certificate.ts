import { schema as s } from "@nawadi/db";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  generateCertificateID,
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../../utils/index.js";
import { insertSchema } from "./certificate.schema.js";

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

      const competencies = Array.isArray(input.competencyId)
        ? input.competencyId
        : [input.competencyId];

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

      await query.insert(s.studentCompletedCompetency).values(
        competencies.map((competencyId) => ({
          studentCurriculumId: input.studentCurriculumId,
          competencyId,
          certificateId: input.certificateId,
        })),
      );

      return;
    },
  ),
);

export const completeCertificate = wrapCommand(
  "student.certificate.complete",
  withZod(
    insertSchema
      .pick({
        visibleFrom: true,
      })
      .extend({
        certificateId: uuidSchema,
      }),
    z.void(),
    async (input) => {
      const query = useQuery();

      const [res] = await query
        .update(s.certificate)
        .set({
          issuedAt: new Date().toISOString(),
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
