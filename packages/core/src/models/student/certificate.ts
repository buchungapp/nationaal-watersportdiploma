import { schema as s } from "@nawadi/db";
import { and, eq, isNull } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { z } from "zod";
import { useQuery } from "../../contexts/index.js";
import {
  singleOrArray,
  successfulCreateResponse,
  uuidSchema,
  withZod,
} from "../../utils/index.js";
import { insertSchema } from "./certificate.schema.js";

function generateCertificateID() {
  const dictionary = "6789BCDFGHJKLMNPQRTWbcdfghjkmnpqrtwz";
  const nanoid = customAlphabet(dictionary, 10);

  return nanoid();
}

export const startCertificate = withZod(
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
);

export const completeCompetency = withZod(
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

    await query.insert(s.studentCompletedCompetency).values(
      competencies.map((competencyId) => ({
        studentCurriculumId: input.studentCurriculumId,
        competencyId,
        certificateId: input.certificateId,
      })),
    );

    return;
  },
);

export const completeCertificate = withZod(
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
);
