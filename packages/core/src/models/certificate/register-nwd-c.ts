import { schema as s } from "@nawadi/db";
import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { z } from "zod";
import { withTransaction } from "../../contexts/index.js";
import {
  dateTimeSchema,
  possibleSingleRow,
  successfulCreateResponse,
  uuidSchema,
  withZod,
  wrapCommand,
} from "../../utils/index.js";
import { Curriculum, Course, Student } from "../index.js";

export const NWD_C_DEGREE_HANDLE = "niveau-c";

export const registerNwdC = wrapCommand(
  "certificate.registerNwdC",
  withZod(
    z.object({
      personId: uuidSchema,
      curriculumId: uuidSchema,
      gearTypeId: uuidSchema,
      locationId: uuidSchema,
      issuedAt: dateTimeSchema,
      visibleFrom: dateTimeSchema.optional(),
      opmerkingen: z.string().optional(),
      toegevoegdDoor: uuidSchema.optional(),
    }),
    successfulCreateResponse,
    async (input) => {
      return withTransaction(async (tx) => {
        const curricula = await Curriculum.list({
          filter: { id: input.curriculumId, onlyCurrentActive: true },
        });

        const curriculum = curricula[0];
        if (!curriculum) {
          throw new Error("Curriculum niet gevonden of niet actief");
        }

        const program = await Course.Program.fromId(curriculum.programId);
        if (!program || program.degree.handle !== NWD_C_DEGREE_HANDLE) {
          throw new Error(
            "Alleen NWD-C programma's kunnen via het secretariaat worden geregistreerd",
          );
        }

        const gearTypes = await Curriculum.GearType.list({
          filter: { curriculumId: input.curriculumId },
        });

        if (!gearTypes.some((gearType) => gearType.id === input.gearTypeId)) {
          throw new Error("Vaartuig hoort niet bij dit curriculum");
        }

        const existingCertificates = await tx
          .select({ id: s.certificate.id })
          .from(s.certificate)
          .innerJoin(
            s.studentCurriculum,
            eq(s.studentCurriculum.id, s.certificate.studentCurriculumId),
          )
          .where(
            and(
              eq(s.studentCurriculum.personId, input.personId),
              eq(s.studentCurriculum.curriculumId, input.curriculumId),
              eq(s.studentCurriculum.gearTypeId, input.gearTypeId),
              isNull(s.certificate.deletedAt),
              isNotNull(s.certificate.issuedAt),
            ),
          );

        if (existingCertificates.length > 0) {
          throw new Error(
            "Deze persoon heeft al een actief NWD-C certificaat voor dit vaartuig in deze discipline",
          );
        }

        const orphanedStudentCurriculum = await tx
          .select({ id: s.studentCurriculum.id })
          .from(s.studentCurriculum)
          .where(
            and(
              eq(s.studentCurriculum.personId, input.personId),
              eq(s.studentCurriculum.curriculumId, input.curriculumId),
              eq(s.studentCurriculum.gearTypeId, input.gearTypeId),
              isNull(s.studentCurriculum.deletedAt),
            ),
          );

        if (orphanedStudentCurriculum.length > 0) {
          const cleanedUpAt = new Date().toISOString();
          await tx
            .update(s.studentCurriculum)
            .set({ deletedAt: cleanedUpAt })
            .where(
              and(
                eq(s.studentCurriculum.personId, input.personId),
                eq(s.studentCurriculum.curriculumId, input.curriculumId),
                eq(s.studentCurriculum.gearTypeId, input.gearTypeId),
                isNull(s.studentCurriculum.deletedAt),
              ),
            );
        }

        const { id: studentCurriculumId } = await Student.Curriculum.start({
          personId: input.personId,
          curriculumId: input.curriculumId,
          gearTypeId: input.gearTypeId,
          startedAt: input.issuedAt,
        });

        const { id: certificateId } =
          await Student.Certificate.startCertificate({
            locationId: input.locationId,
            studentCurriculumId,
          });

        await Student.Certificate.completeCertificate({
          certificateId,
          issuedAt: input.issuedAt,
          visibleFrom: input.visibleFrom ?? input.issuedAt,
          opmerkingen: input.opmerkingen,
          toegevoegdDoor: input.toegevoegdDoor,
        });

        return { id: certificateId };
      });
    },
  ),
);

export const withdrawNwdC = wrapCommand(
  "certificate.withdrawNwdC",
  withZod(
    z.object({
      certificateId: uuidSchema,
      personId: uuidSchema,
    }),
    async (input) => {
      return withTransaction(async (tx) => {
        const certificate = await tx
          .select({
            id: s.certificate.id,
            studentCurriculumId: s.certificate.studentCurriculumId,
            personId: s.studentCurriculum.personId,
            degreeHandle: s.degree.handle,
          })
          .from(s.certificate)
          .innerJoin(
            s.studentCurriculum,
            eq(s.studentCurriculum.id, s.certificate.studentCurriculumId),
          )
          .innerJoin(
            s.curriculum,
            eq(s.curriculum.id, s.studentCurriculum.curriculumId),
          )
          .innerJoin(s.program, eq(s.program.id, s.curriculum.programId))
          .innerJoin(s.degree, eq(s.degree.id, s.program.degreeId))
          .where(
            and(
              eq(s.certificate.id, input.certificateId),
              isNull(s.certificate.deletedAt),
            ),
          )
          .then(possibleSingleRow);

        if (!certificate) {
          throw new Error("Certificaat niet gevonden");
        }

        if (certificate.personId !== input.personId) {
          throw new Error("Certificaat hoort niet bij deze persoon");
        }

        if (certificate.degreeHandle !== NWD_C_DEGREE_HANDLE) {
          throw new Error(
            "Alleen NWD-C certificaten kunnen via het secretariaat worden ingetrokken",
          );
        }

        const withdrawnAt = new Date().toISOString();

        await Promise.all([
          tx
            .update(s.certificate)
            .set({ deletedAt: withdrawnAt })
            .where(
              and(
                eq(s.certificate.id, certificate.id),
                isNull(s.certificate.deletedAt),
              ),
            ),
          tx
            .update(s.studentCurriculum)
            .set({ deletedAt: withdrawnAt })
            .where(
              and(
                eq(s.studentCurriculum.id, certificate.studentCurriculumId),
                isNull(s.studentCurriculum.deletedAt),
              ),
            ),
          tx
            .delete(s.studentCompletedCompetency)
            .where(
              eq(s.studentCompletedCompetency.certificateId, certificate.id),
            ),
        ]);
      });
    },
  ),
);
