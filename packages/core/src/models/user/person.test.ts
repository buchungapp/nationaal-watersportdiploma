import assert from "node:assert";
import test from "node:test";
import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, eq, inArray, isNull } from "drizzle-orm";
import { useQuery, withTestTransaction } from "../../contexts/index.js";
import {
  Certificate,
  Cohort,
  Course,
  Curriculum,
  Location,
  Student,
  User,
} from "../index.js";

async function createCurriculumFixture(prefix: string) {
  const createDiscipline = Course.Discipline.create({
    title: `${prefix}-discipline`,
    handle: `${prefix}-discipline`,
  });

  const createDegree = Course.Degree.create({
    title: `${prefix}-degree`,
    handle: `${prefix}-degree`,
    rang: 1,
  });

  const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
    createDiscipline,
    createDegree,
  ]);

  const { id: courseId } = await Course.create({
    title: `${prefix}-course`,
    handle: `${prefix}-course`,
    disciplineId,
  });

  const { id: programId } = await Course.Program.create({
    handle: `${prefix}-program`,
    title: `${prefix}-program`,
    degreeId,
    courseId,
  });

  const [{ id: module1Id }, { id: module2Id }] = await Promise.all([
    Course.Module.create({
      title: `${prefix}-module-1`,
      handle: `${prefix}-module-1`,
      weight: 1,
    }),
    Course.Module.create({
      title: `${prefix}-module-2`,
      handle: `${prefix}-module-2`,
      weight: 2,
    }),
  ]);

  const [{ id: competency1Id }, { id: competency2Id }] = await Promise.all([
    Course.Competency.create({
      type: "knowledge",
      title: `${prefix}-competency-1`,
      handle: `${prefix}-competency-1`,
      weight: 1,
    }),
    Course.Competency.create({
      type: "skill",
      title: `${prefix}-competency-2`,
      handle: `${prefix}-competency-2`,
      weight: 2,
    }),
  ]);

  const { id: gearTypeId } = await Curriculum.GearType.create({
    title: `${prefix}-gear`,
    handle: `${prefix}-gear`,
  });

  const { id: curriculumId } = await Curriculum.create({
    programId,
    revision: "A",
  });

  await Promise.all([
    Curriculum.start({
      curriculumId,
      startedAt: dayjs().subtract(1, "day").toISOString(),
    }),
    Curriculum.GearType.linkToCurriculum({ curriculumId, gearTypeId }),
    Curriculum.linkModule({
      curriculumId,
      moduleId: module1Id,
    }),
    Curriculum.linkModule({
      curriculumId,
      moduleId: module2Id,
    }),
  ]);

  const [{ id: curriculumCompetency1Id }, { id: curriculumCompetency2Id }] =
    await Promise.all([
      Curriculum.Competency.create({
        curriculumId,
        moduleId: module1Id,
        competencyId: competency1Id,
        isRequired: true,
        requirement: `${prefix}-requirement-1`,
      }),
      Curriculum.Competency.create({
        curriculumId,
        moduleId: module2Id,
        competencyId: competency2Id,
        isRequired: true,
        requirement: `${prefix}-requirement-2`,
      }),
    ]);

  return {
    curriculumId,
    gearTypeId,
    curriculumCompetency1Id,
    curriculumCompetency2Id,
  };
}

test("student.certificate.completeCompetency prevents duplicate completion in normal flow", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "dup-location",
      name: "Duplicate Guard Location",
    });

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Duplicate",
      lastName: "Guard",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("duplicate-guard");

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId,
      gearTypeId,
    });

    const { id: certificateId1 } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });

    await Student.Certificate.completeCompetency({
      certificateId: certificateId1,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    await Student.Certificate.completeCertificate({
      certificateId: certificateId1,
      visibleFrom: dayjs().toISOString(),
    });

    const { id: certificateId2 } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });

    await assert.rejects(
      Student.Certificate.completeCompetency({
        certificateId: certificateId2,
        studentCurriculumId,
        competencyId: curriculumCompetency1Id,
      }),
      /already completed for this student curriculum/,
    );
  }));

test("user.person.mergePersons preserves overlapping certificates and resolves cohort allocation collisions", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-location",
      name: "Merge Location",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id, curriculumCompetency2Id } =
      await createCurriculumFixture("merge-conflict");

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "Target",
        lastName: "Person",
      }),
      User.Person.getOrCreate({
        firstName: "Source",
        lastName: "Person",
      }),
    ]);

    await Promise.all([
      User.Person.createLocationLink({
        personId: targetPersonId,
        locationId: location.id,
      }),
      User.Person.createLocationLink({
        personId: sourcePersonId,
        locationId: location.id,
      }),
    ]);

    const [{ id: targetActorId }, { id: sourceActorId }] = await Promise.all([
      User.Actor.upsert({
        personId: targetPersonId,
        locationId: location.id,
        type: "student",
      }),
      User.Actor.upsert({
        personId: sourcePersonId,
        locationId: location.id,
        type: "student",
      }),
    ]);

    const [{ id: targetStudentCurriculumId }, { id: sourceStudentCurriculumId }] =
      await Promise.all([
        Student.Curriculum.start({
          personId: targetPersonId,
          curriculumId,
          gearTypeId,
        }),
        Student.Curriculum.start({
          personId: sourcePersonId,
          curriculumId,
          gearTypeId,
        }),
      ]);

    const { id: cohortId } = await Cohort.create({
      handle: "merge-cohort",
      label: "Merge Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(1, "day").toISOString(),
    });

    const [{ id: targetAllocationId }, { id: sourceAllocationId }] =
      await Promise.all([
        Cohort.Allocation.create({
          actorId: targetActorId,
          cohortId,
          studentCurriculumId: targetStudentCurriculumId,
          tags: [],
        }),
        Cohort.Allocation.create({
          actorId: sourceActorId,
          cohortId,
          studentCurriculumId: sourceStudentCurriculumId,
          tags: [],
        }),
      ]);

    const { id: targetCertificateId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId: targetStudentCurriculumId,
    });

    await Student.Certificate.completeCompetency({
      certificateId: targetCertificateId,
      studentCurriculumId: targetStudentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    await Student.Certificate.completeCertificate({
      certificateId: targetCertificateId,
      visibleFrom: dayjs().toISOString(),
    });

    await Certificate.assignToCohortAllocation({
      certificateId: targetCertificateId,
      cohortAllocationId: targetAllocationId,
    });

    const { id: sourceCertificateId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId: sourceStudentCurriculumId,
    });

    await Student.Certificate.completeCompetency({
      certificateId: sourceCertificateId,
      studentCurriculumId: sourceStudentCurriculumId,
      competencyId: [curriculumCompetency1Id, curriculumCompetency2Id],
    });

    await Student.Certificate.completeCertificate({
      certificateId: sourceCertificateId,
      visibleFrom: dayjs().toISOString(),
    });

    await Certificate.assignToCohortAllocation({
      certificateId: sourceCertificateId,
      cohortAllocationId: sourceAllocationId,
    });

    await Promise.all([
      Cohort.StudentProgress.upsertProgress({
        cohortAllocationId: targetAllocationId,
        competencyProgress: [
          {
            competencyId: curriculumCompetency1Id,
            progress: 100,
          },
        ],
        createdBy: targetPersonId,
      }),
      Cohort.StudentProgress.upsertProgress({
        cohortAllocationId: sourceAllocationId,
        competencyProgress: [
          {
            competencyId: curriculumCompetency1Id,
            progress: 100,
          },
          {
            competencyId: curriculumCompetency2Id,
            progress: 100,
          },
        ],
        createdBy: sourcePersonId,
      }),
    ]);

    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    const canonicalCurricula = await query
      .select({
        id: s.studentCurriculum.id,
      })
      .from(s.studentCurriculum)
      .where(
        and(
          eq(s.studentCurriculum.personId, targetPersonId),
          eq(s.studentCurriculum.curriculumId, curriculumId),
          eq(s.studentCurriculum.gearTypeId, gearTypeId),
        ),
      );

    assert.equal(canonicalCurricula.length, 1);
    const canonicalStudentCurriculumId = canonicalCurricula[0]?.id;
    assert.ok(canonicalStudentCurriculumId);

    const certificatesAfterMerge = await query
      .select({
        id: s.certificate.id,
        studentCurriculumId: s.certificate.studentCurriculumId,
        cohortAllocationId: s.certificate.cohortAllocationId,
      })
      .from(s.certificate)
      .where(inArray(s.certificate.id, [targetCertificateId, sourceCertificateId]));

    assert.equal(certificatesAfterMerge.length, 2);
    for (const certificate of certificatesAfterMerge) {
      assert.equal(certificate.studentCurriculumId, canonicalStudentCurriculumId);
    }

    const completedCompetencies = await query
      .select({
        competencyId: s.studentCompletedCompetency.competencyId,
        certificateId: s.studentCompletedCompetency.certificateId,
        isMergeConflictDuplicate:
          s.studentCompletedCompetency.isMergeConflictDuplicate,
      })
      .from(s.studentCompletedCompetency)
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            canonicalStudentCurriculumId,
          ),
          isNull(s.studentCompletedCompetency.deletedAt),
        ),
      );

    const competency1Rows = completedCompetencies.filter(
      (row) => row.competencyId === curriculumCompetency1Id,
    );
    assert.equal(competency1Rows.length, 2);
    assert.equal(
      competency1Rows.filter((row) => row.isMergeConflictDuplicate).length,
      1,
    );

    const competency2Rows = completedCompetencies.filter(
      (row) => row.competencyId === curriculumCompetency2Id,
    );
    assert.equal(competency2Rows.length, 1);
    assert.equal(competency2Rows[0]?.isMergeConflictDuplicate, false);

    const activeAllocations = await query
      .select({
        id: s.cohortAllocation.id,
      })
      .from(s.cohortAllocation)
      .where(
        and(
          eq(s.cohortAllocation.cohortId, cohortId),
          eq(s.cohortAllocation.actorId, targetActorId),
          eq(
            s.cohortAllocation.studentCurriculumId,
            canonicalStudentCurriculumId,
          ),
          isNull(s.cohortAllocation.deletedAt),
        ),
      );

    assert.equal(activeAllocations.length, 1);
    const activeAllocationId = activeAllocations[0]?.id;
    assert.ok(activeAllocationId);

    const linkedCertificates = certificatesAfterMerge.filter(
      (certificate) => certificate.cohortAllocationId === activeAllocationId,
    );
    const unlinkedCertificates = certificatesAfterMerge.filter(
      (certificate) => certificate.cohortAllocationId === null,
    );

    assert.equal(linkedCertificates.length, 1);
    assert.equal(unlinkedCertificates.length, 1);

    const mergedProgressRows = await query
      .select({
        competencyId: s.studentCohortProgress.competencyId,
      })
      .from(s.studentCohortProgress)
      .where(
        eq(s.studentCohortProgress.cohortAllocationId, activeAllocationId),
      );

    assert.equal(mergedProgressRows.length, 2);
    const competencyIds = mergedProgressRows.map((row) => row.competencyId);
    assert.equal(
      competencyIds.filter((id) => id === curriculumCompetency1Id).length,
      1,
    );
    assert.equal(
      competencyIds.filter((id) => id === curriculumCompetency2Id).length,
      1,
    );

    const sourcePersonRows = await query
      .select({
        id: s.person.id,
      })
      .from(s.person)
      .where(eq(s.person.id, sourcePersonId));

    assert.equal(sourcePersonRows.length, 0);
  }));
