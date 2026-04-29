import assert from "node:assert";
import test from "node:test";
import { schema as s } from "@nawadi/db";
import dayjs from "dayjs";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
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

  // Random rang above the default-seeded range (degrees 1-4 land in
  // every fresh dev DB via pnpm initialize) but inside smallint
  // bounds. Without this the fixture collides on degree_rang_index
  // whenever the seeds have already run.
  const randomRang = 1000 + Math.floor(Math.random() * 30_000);
  const createDegree = Course.Degree.create({
    title: `${prefix}-degree`,
    handle: `${prefix}-degree`,
    rang: randomRang,
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
    module1Id,
    module2Id,
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

test("student.certificate.completeCompetency ignores merge-conflict duplicates in normal duplicate guard", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-dup-location",
      name: "Merge Duplicate Guard Location",
    });

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Merge",
      lastName: "Duplicate",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("merge-duplicate-guard");

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId,
      gearTypeId,
    });

    const { id: firstCertificateId } =
      await Student.Certificate.startCertificate({
        locationId: location.id,
        studentCurriculumId,
      });

    await Student.Certificate.completeCompetency({
      certificateId: firstCertificateId,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    await query
      .update(s.studentCompletedCompetency)
      .set({ isMergeConflictDuplicate: true })
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            studentCurriculumId,
          ),
          eq(
            s.studentCompletedCompetency.competencyId,
            curriculumCompetency1Id,
          ),
        ),
      );

    const { id: secondCertificateId } =
      await Student.Certificate.startCertificate({
        locationId: location.id,
        studentCurriculumId,
      });

    await Student.Certificate.completeCompetency({
      certificateId: secondCertificateId,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    const completedCompetencies = await query
      .select({
        isMergeConflictDuplicate:
          s.studentCompletedCompetency.isMergeConflictDuplicate,
      })
      .from(s.studentCompletedCompetency)
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            studentCurriculumId,
          ),
          eq(
            s.studentCompletedCompetency.competencyId,
            curriculumCompetency1Id,
          ),
          isNull(s.studentCompletedCompetency.deletedAt),
        ),
      );

    assert.equal(completedCompetencies.length, 2);
    assert.equal(
      completedCompetencies.filter((row) => row.isMergeConflictDuplicate)
        .length,
      1,
    );
  }));

test("user.person.mergePersons keeps a canonical completion when target only has merge-conflict duplicate rows", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-canonical-location",
      name: "Merge Canonical Location",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("merge-canonical");

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "Canonical",
        lastName: "Target",
      }),
      User.Person.getOrCreate({
        firstName: "Canonical",
        lastName: "Source",
      }),
    ]);

    const [
      { id: targetStudentCurriculumId },
      { id: sourceStudentCurriculumId },
    ] = await Promise.all([
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

    const { id: targetCertificateId } =
      await Student.Certificate.startCertificate({
        locationId: location.id,
        studentCurriculumId: targetStudentCurriculumId,
      });

    await Student.Certificate.completeCompetency({
      certificateId: targetCertificateId,
      studentCurriculumId: targetStudentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    await query
      .update(s.studentCompletedCompetency)
      .set({ isMergeConflictDuplicate: true })
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            targetStudentCurriculumId,
          ),
          eq(
            s.studentCompletedCompetency.competencyId,
            curriculumCompetency1Id,
          ),
        ),
      );

    const { id: sourceCertificateId } =
      await Student.Certificate.startCertificate({
        locationId: location.id,
        studentCurriculumId: sourceStudentCurriculumId,
      });

    await Student.Certificate.completeCompetency({
      certificateId: sourceCertificateId,
      studentCurriculumId: sourceStudentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });

    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    const canonicalRows = await query
      .select({
        isMergeConflictDuplicate:
          s.studentCompletedCompetency.isMergeConflictDuplicate,
      })
      .from(s.studentCompletedCompetency)
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            targetStudentCurriculumId,
          ),
          eq(
            s.studentCompletedCompetency.competencyId,
            curriculumCompetency1Id,
          ),
          isNull(s.studentCompletedCompetency.deletedAt),
        ),
      );

    assert.equal(canonicalRows.length, 2);
    assert.equal(
      canonicalRows.filter((row) => !row.isMergeConflictDuplicate).length,
      1,
    );
  }));

test("user.person.mergePersons preserves overlapping certificates and resolves cohort allocation collisions", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-location",
      name: "Merge Location",
    });

    const {
      curriculumId,
      gearTypeId,
      curriculumCompetency1Id,
      curriculumCompetency2Id,
    } = await createCurriculumFixture("merge-conflict");

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

    const [
      { id: targetStudentCurriculumId },
      { id: sourceStudentCurriculumId },
    ] = await Promise.all([
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

    const { id: targetCertificateId } =
      await Student.Certificate.startCertificate({
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

    const { id: sourceCertificateId } =
      await Student.Certificate.startCertificate({
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
      .where(
        inArray(s.certificate.id, [targetCertificateId, sourceCertificateId]),
      );

    assert.equal(certificatesAfterMerge.length, 2);
    for (const certificate of certificatesAfterMerge) {
      assert.equal(
        certificate.studentCurriculumId,
        canonicalStudentCurriculumId,
      );
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
        createdBy: s.studentCohortProgress.createdBy,
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
    assert.deepEqual(
      Array.from(new Set(mergedProgressRows.map((row) => row.createdBy))),
      [targetPersonId],
    );

    const sourcePersonRows = await query
      .select({
        id: s.person.id,
      })
      .from(s.person)
      .where(eq(s.person.id, sourcePersonId));

    assert.equal(sourcePersonRows.length, 0);
  }));

// REGRESSION (Bugbot review on PR #461): merge must NOT treat a soft-
// deleted target curriculum as a conflict against a live source
// curriculum. Before the fix, the queries didn't filter deleted_at,
// so the merge would move source's certificates onto the deleted
// target curriculum and delete the source — burying live data behind
// a soft-deleted parent.
test("user.person.mergePersons skips soft-deleted target curriculum and migrates source as live", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-deleted-target-location",
      name: "Merge Deleted Target Location",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("merge-deleted-target");

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "DeletedTarget",
        lastName: "Person",
      }),
      User.Person.getOrCreate({
        firstName: "LiveSource",
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

    // Target had a curriculum at (curriculumId, gearTypeId) but it was
    // soft-deleted (e.g. an old failed attempt). Source has a LIVE
    // curriculum at the same identity.
    const { id: targetStudentCurriculumId } = await Student.Curriculum.start({
      personId: targetPersonId,
      curriculumId,
      gearTypeId,
    });
    await query
      .update(s.studentCurriculum)
      .set({ deletedAt: dayjs().subtract(30, "day").toISOString() })
      .where(eq(s.studentCurriculum.id, targetStudentCurriculumId));

    const { id: sourceStudentCurriculumId } = await Student.Curriculum.start({
      personId: sourcePersonId,
      curriculumId,
      gearTypeId,
    });

    // Issue a certificate against the SOURCE's live curriculum.
    const { id: sourceCertificateId } =
      await Student.Certificate.startCertificate({
        locationId: location.id,
        studentCurriculumId: sourceStudentCurriculumId,
      });
    await Student.Certificate.completeCompetency({
      certificateId: sourceCertificateId,
      studentCurriculumId: sourceStudentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });
    await Student.Certificate.completeCertificate({
      certificateId: sourceCertificateId,
      visibleFrom: dayjs().toISOString(),
    });

    // Merge source into target.
    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    // Source's curriculum should now belong to target — and be LIVE
    // (not buried under the soft-deleted target curriculum).
    const liveCurriculaForTarget = await query
      .select({
        id: s.studentCurriculum.id,
      })
      .from(s.studentCurriculum)
      .where(
        and(
          eq(s.studentCurriculum.personId, targetPersonId),
          eq(s.studentCurriculum.curriculumId, curriculumId),
          eq(s.studentCurriculum.gearTypeId, gearTypeId),
          isNull(s.studentCurriculum.deletedAt),
        ),
      );
    assert.equal(
      liveCurriculaForTarget.length,
      1,
      `Expected exactly 1 live curriculum on target after merge, got ${liveCurriculaForTarget.length}`,
    );
    assert.equal(
      liveCurriculaForTarget[0]?.id,
      sourceStudentCurriculumId,
      "Live curriculum on target should be the migrated source — not the previously-deleted target curriculum",
    );

    // The source's certificate should still be reachable through the
    // live curriculum.
    const reachableCertificates = await query
      .select({ id: s.certificate.id })
      .from(s.certificate)
      .where(
        and(
          eq(s.certificate.studentCurriculumId, sourceStudentCurriculumId),
          isNull(s.certificate.deletedAt),
        ),
      );
    assert.equal(reachableCertificates.length, 1);
    assert.equal(reachableCertificates[0]?.id, sourceCertificateId);

    // The originally-deleted target curriculum should still exist as
    // soft-deleted — we don't resurrect or hard-delete it; it just
    // doesn't participate in the merge.
    const deletedTargetCurriculum = await query
      .select({
        id: s.studentCurriculum.id,
        deletedAt: s.studentCurriculum.deletedAt,
      })
      .from(s.studentCurriculum)
      .where(eq(s.studentCurriculum.id, targetStudentCurriculumId));
    assert.equal(deletedTargetCurriculum.length, 1);
    assert.ok(
      deletedTargetCurriculum[0]?.deletedAt,
      "Deleted target curriculum should remain soft-deleted, untouched by the merge",
    );
  }));

// REGRESSION (Bugbot review on PR #461 — round 2): merge must also
// migrate SOFT-DELETED source curricula. The previous round added
// isNull(deletedAt) on both source/target queries, but that caused
// soft-deleted source curricula to be skipped entirely. They still
// reference source.person_id via student_curriculum_link_person_id_fk,
// so the end-of-merge tx.delete(s.person) tripped a FK violation and
// rolled the whole merge back.
test("user.person.mergePersons migrates soft-deleted source curriculum so end-of-merge person delete succeeds", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-deleted-source-location",
      name: "Merge Deleted Source Location",
    });

    const { curriculumId, gearTypeId } = await createCurriculumFixture(
      "merge-deleted-source",
    );

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "DeletedSource",
        lastName: "Target",
      }),
      User.Person.getOrCreate({
        firstName: "DeletedSource",
        lastName: "Source",
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

    // Source had a curriculum. It was soft-deleted at some point (e.g.
    // the operator dropped the enrollment, or it was migrated through
    // an earlier merge). Target has no curriculum.
    const { id: sourceStudentCurriculumId } = await Student.Curriculum.start({
      personId: sourcePersonId,
      curriculumId,
      gearTypeId,
    });
    await query
      .update(s.studentCurriculum)
      .set({ deletedAt: dayjs().subtract(60, "day").toISOString() })
      .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId));

    // Merge must complete without FK violation.
    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    // The deleted curriculum should now belong to target (still soft-
    // deleted — we didn't resurrect it, just changed its ownership).
    const movedCurriculum = await query
      .select({
        personId: s.studentCurriculum.personId,
        deletedAt: s.studentCurriculum.deletedAt,
      })
      .from(s.studentCurriculum)
      .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId))
      .then((rows) => rows[0]);
    assert.ok(movedCurriculum, "Source curriculum should still exist");
    assert.equal(
      movedCurriculum.personId,
      targetPersonId,
      "Soft-deleted source curriculum should now reference target person",
    );
    assert.ok(
      movedCurriculum.deletedAt,
      "Soft-deleted curriculum should remain soft-deleted after migration",
    );

    // Source person should be hard-deleted.
    const sourcePersonRows = await query
      .select({ id: s.person.id })
      .from(s.person)
      .where(eq(s.person.id, sourcePersonId));
    assert.equal(sourcePersonRows.length, 0, "Source person must be deleted");
  }));

// REGRESSION combined: source has a soft-deleted curriculum, target
// has a LIVE curriculum at the same identity. Source-deleted shouldn't
// conflict with target-live (partial unique index = live-only). The
// soft-deleted source must still migrate via personId update.
test("user.person.mergePersons handles deleted source + live target at same identity", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-deleted-source-live-target-loc",
      name: "Merge Deleted Source vs Live Target Location",
    });

    const { curriculumId, gearTypeId } = await createCurriculumFixture(
      "merge-deleted-source-live-target",
    );

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "DSLT",
        lastName: "Target",
      }),
      User.Person.getOrCreate({
        firstName: "DSLT",
        lastName: "Source",
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

    // Source has a soft-deleted curriculum.
    const { id: sourceStudentCurriculumId } = await Student.Curriculum.start({
      personId: sourcePersonId,
      curriculumId,
      gearTypeId,
    });
    await query
      .update(s.studentCurriculum)
      .set({ deletedAt: dayjs().subtract(30, "day").toISOString() })
      .where(eq(s.studentCurriculum.id, sourceStudentCurriculumId));

    // Target has a LIVE curriculum at the same identity.
    const { id: targetStudentCurriculumId } = await Student.Curriculum.start({
      personId: targetPersonId,
      curriculumId,
      gearTypeId,
    });

    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    // Both curricula should still exist on target — the live one
    // canonical, the deleted one preserved for history.
    const allCurricula = await query
      .select({
        id: s.studentCurriculum.id,
        deletedAt: s.studentCurriculum.deletedAt,
      })
      .from(s.studentCurriculum)
      .where(
        and(
          eq(s.studentCurriculum.personId, targetPersonId),
          eq(s.studentCurriculum.curriculumId, curriculumId),
          eq(s.studentCurriculum.gearTypeId, gearTypeId),
        ),
      );
    assert.equal(
      allCurricula.length,
      2,
      `Expected both curricula on target (live + deleted), got ${allCurricula.length}`,
    );
    const liveCount = allCurricula.filter((c) => c.deletedAt == null).length;
    assert.equal(liveCount, 1, "Exactly one curriculum should be live");
    const liveId = allCurricula.find((c) => c.deletedAt == null)?.id;
    assert.equal(
      liveId,
      targetStudentCurriculumId,
      "Live curriculum should be the original target curriculum",
    );
  }));

// REGRESSION (Bugbot round 3 audit): mergePersons must repoint
// counterparty actor references too. Source's actor.id can be used
// as instructor on someone else's cohort_allocation (and as
// `aangemaakt_door` on PVB tables, `toegevoegd_door` on
// persoon_kwalificatie, etc.). Without repointing, the source-actor
// delete tripped a FK violation and rolled the merge back.
test("user.person.mergePersons repoints cohort_allocation.instructor_id when source actor was someone else's instructor", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-instructor-counterparty-loc",
      name: "Merge Instructor Counterparty Location",
    });

    const { curriculumId, gearTypeId } = await createCurriculumFixture(
      "merge-instructor-counterparty",
    );

    const [
      { id: targetPersonId },
      { id: sourcePersonId },
      { id: studentPersonId },
    ] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "InstructorMergeTarget",
        lastName: "X",
      }),
      User.Person.getOrCreate({
        firstName: "InstructorMergeSource",
        lastName: "X",
      }),
      User.Person.getOrCreate({
        firstName: "StudentForInstructorMerge",
        lastName: "X",
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
      User.Person.createLocationLink({
        personId: studentPersonId,
        locationId: location.id,
      }),
    ]);

    // Source has an INSTRUCTOR actor in this location. Target has the
    // same role pre-existing too (so the type+location-matched mapping
    // resolves cleanly). Student has a STUDENT actor.
    const [
      { id: sourceInstructorActorId },
      { id: targetInstructorActorId },
      { id: studentActorId },
    ] = await Promise.all([
      User.Actor.upsert({
        personId: sourcePersonId,
        locationId: location.id,
        type: "instructor",
      }),
      User.Actor.upsert({
        personId: targetPersonId,
        locationId: location.id,
        type: "instructor",
      }),
      User.Actor.upsert({
        personId: studentPersonId,
        locationId: location.id,
        type: "student",
      }),
    ]);

    const { id: studentStudentCurriculumId } = await Student.Curriculum.start({
      personId: studentPersonId,
      curriculumId,
      gearTypeId,
    });

    const { id: cohortId } = await Cohort.create({
      handle: "instructor-counterparty-cohort",
      label: "Instructor Counterparty Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });

    const { id: studentAllocationId } = await Cohort.Allocation.create({
      actorId: studentActorId,
      cohortId,
      studentCurriculumId: studentStudentCurriculumId,
      tags: [],
    });

    // Set source's instructor actor as the student's instructor.
    await query
      .update(s.cohortAllocation)
      .set({ instructorId: sourceInstructorActorId })
      .where(eq(s.cohortAllocation.id, studentAllocationId));

    // Merge source → target. Without the repoint fix, the
    // tx.delete(s.actor) inside mergePersons would fail FK-violation
    // on cohort_allocation.instructor_id.
    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    // The student's allocation now has the instructor pointing at
    // target's instructor actor (matched by type + locationId).
    const finalAllocation = await query
      .select({
        instructorId: s.cohortAllocation.instructorId,
      })
      .from(s.cohortAllocation)
      .where(eq(s.cohortAllocation.id, studentAllocationId))
      .then((rows) => rows[0]);
    assert.ok(finalAllocation, "Student allocation should still exist");
    assert.equal(
      finalAllocation.instructorId,
      targetInstructorActorId,
      "instructor_id should now reference target's instructor actor, not the deleted source one",
    );

    // Source person was hard-deleted.
    const sourcePersonRows = await query
      .select({ id: s.person.id })
      .from(s.person)
      .where(eq(s.person.id, sourcePersonId));
    assert.equal(sourcePersonRows.length, 0);
  }));

// REGRESSION (Bugbot round 3 audit, person-side): mergePersons must
// repoint person counterparty references in PVB tables. If source was
// a beoordelaar / leercoach / kandidaat anywhere, the row still
// references source.id and the end-of-merge person delete would FK-
// violate.
test("user.person.mergePersons repoints PVB counterparty refs when source was beoordelaar / leercoach / kandidaat", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "merge-pvb-counterparty-loc",
      name: "Merge PVB Counterparty Location",
    });

    const [{ id: targetPersonId }, { id: sourcePersonId }] = await Promise.all([
      User.Person.getOrCreate({
        firstName: "PvbMergeTarget",
        lastName: "X",
      }),
      User.Person.getOrCreate({
        firstName: "PvbMergeSource",
        lastName: "X",
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

    // pvb_beoordelaar_beschikbaarheid only requires pvb_aanvraag +
    // pvb_voorstel_datum + person (beoordelaar). We can shortcut by
    // just inserting the minimum needed FK chain. Skip: out of scope
    // for this regression — for the ALL-PVB-tables sweep, a fuller
    // fixture in a future PR makes sense.
    //
    // For this test we exercise the simplest person-counterparty FK
    // path that doesn't need full PVB scaffolding: directly INSERT
    // the row needed to verify the UPDATE sweep.

    // Simulate "source was the leercoach on someone else's
    // toestemming": insert a minimal pvb_aanvraag (kandidaat=target so
    // the FK from `kandidaat_id` is valid), then a pvb_leercoach_
    // toestemming with `leercoach_id=source`. After merge, leercoach_id
    // must point at target.
    const otherPersonId = (
      await User.Person.getOrCreate({
        firstName: "PvbKandidaat",
        lastName: "X",
      })
    ).id;
    await User.Person.createLocationLink({
      personId: otherPersonId,
      locationId: location.id,
    });
    const otherActorId = (
      await User.Actor.upsert({
        personId: otherPersonId,
        locationId: location.id,
        type: "student",
      })
    ).id;

    // Step 1: minimal pvb_aanvraag with otherPerson as kandidaat. The
    // table's actual columns are id/handle/kandidaatId/locatieId/type/
    // opmerkingen — no kerntaakId or leercoachId here (those concerns
    // live on pvbLeercoachToestemming and the per-onderdeel rows).
    const pvbAanvraagInsert = await query
      .insert(s.pvbAanvraag)
      .values({
        handle: `pvb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        kandidaatId: otherPersonId,
        locatieId: location.id,
        type: "intern",
        opmerkingen: null,
      })
      .returning({ id: s.pvbAanvraag.id });
    const pvbAanvraagId = pvbAanvraagInsert[0]?.id;
    assert.ok(pvbAanvraagId, "Should have created the pvb_aanvraag");

    // Step 2: leercoach_toestemming pointing at the source person as
    // leercoach. After merge, leercoach_id must repoint to target.
    const toestemmingInsert = await query
      .insert(s.pvbLeercoachToestemming)
      .values({
        pvbAanvraagId,
        leercoachId: sourcePersonId,
        status: "gevraagd",
        aangemaaktDoor: otherActorId,
      })
      .returning({ id: s.pvbLeercoachToestemming.id });
    const toestemmingId = toestemmingInsert[0]?.id;
    assert.ok(toestemmingId, "Should have created the toestemming row");

    await User.Person.mergePersons({
      personId: sourcePersonId,
      targetPersonId,
    });

    const updated = await query
      .select({
        leercoachId: s.pvbLeercoachToestemming.leercoachId,
      })
      .from(s.pvbLeercoachToestemming)
      .where(eq(s.pvbLeercoachToestemming.id, toestemmingId))
      .then((rows) => rows[0]);
    assert.ok(updated, "Toestemming row should still exist");
    assert.equal(
      updated.leercoachId,
      targetPersonId,
      "leercoach_id should now reference target person, not the deleted source",
    );

    const aanvraag = await query
      .select({ kandidaatId: s.pvbAanvraag.kandidaatId })
      .from(s.pvbAanvraag)
      .where(eq(s.pvbAanvraag.id, pvbAanvraagId))
      .then((rows) => rows[0]);
    assert.equal(
      aanvraag?.kandidaatId,
      otherPersonId,
      "kandidaat_id should be untouched (third-party person)",
    );

    const sourcePersonRows = await query
      .select({ id: s.person.id })
      .from(s.person)
      .where(eq(s.person.id, sourcePersonId));
    assert.equal(sourcePersonRows.length, 0, "Source person must be deleted");
  }));

// REGRESSION (Bugbot review on PR #461): the canonical-certificate
// ranking in withModulesRanked must NOT pick a merge-conflict
// duplicate row even when its certificate was issued earlier than the
// canonical one. ROW_NUMBER orders by certificate.issuedAt ASC; if the
// duplicate isn't filtered out, an old historical record could outrank
// the canonical one and become the displayed certificate.
test("student.curriculum.listProgressByPersonId picks canonical (non-merge-duplicate) certificate even when duplicate was issued earlier", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "modules-rank-canon-location",
      name: "Modules Rank Canonical Location",
    });

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Canonical",
      lastName: "Pick",
    });
    await User.Person.createLocationLink({ personId, locationId: location.id });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("modules-rank-canon");

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId,
      gearTypeId,
    });

    // Older certificate — represents a pre-merge record. Its completion
    // row will be marked isMergeConflictDuplicate=true to simulate the
    // post-merge state.
    const { id: olderCertId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });
    await Student.Certificate.completeCompetency({
      certificateId: olderCertId,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });
    await Student.Certificate.completeCertificate({
      certificateId: olderCertId,
      visibleFrom: dayjs().subtract(1, "year").toISOString(),
    });
    // Backdate the issuedAt so the older cert sorts first under ASC.
    await query
      .update(s.certificate)
      .set({ issuedAt: dayjs().subtract(1, "year").toISOString() })
      .where(eq(s.certificate.id, olderCertId));
    // Mark the older completion row as the merge-conflict duplicate.
    await query
      .update(s.studentCompletedCompetency)
      .set({ isMergeConflictDuplicate: true })
      .where(
        and(
          eq(
            s.studentCompletedCompetency.studentCurriculumId,
            studentCurriculumId,
          ),
          eq(
            s.studentCompletedCompetency.competencyId,
            curriculumCompetency1Id,
          ),
          eq(s.studentCompletedCompetency.certificateId, olderCertId),
        ),
      );

    // Newer certificate — the canonical post-merge record.
    const { id: newerCertId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });
    await Student.Certificate.completeCompetency({
      certificateId: newerCertId,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });
    await Student.Certificate.completeCertificate({
      certificateId: newerCertId,
      visibleFrom: dayjs().toISOString(),
    });

    const progress = await Student.Curriculum.listProgressByPersonId({
      personId,
    });

    // Expect exactly one studentCurriculum entry for our person.
    const personEntry = progress.find((row) => row.personId === personId);
    assert.ok(personEntry, "Expected a progress entry for the test person");
    assert.equal(
      personEntry.modules.length,
      1,
      `Expected one module to surface, got ${personEntry.modules.length}`,
    );
    assert.equal(
      personEntry.modules[0]?.certificateId,
      newerCertId,
      "Module should reference the canonical (newer) certificate, not the merge-conflict duplicate (older one)",
    );
  }));

// REGRESSION (option d, post-merge issuance): the diplomas-tab module
// status must expose `newlyIssuable` so the UI can distinguish modules
// where the cohort run would mint a fresh diploma from modules that
// are already fully canonical via an earlier certificate. Without this
// the operator sees a "klaar voor uitgifte" row that, on click, would
// silently produce a partial diploma — which is the exact silent-
// corruption scenario we want to surface as `geblokkeerd` instead.
test("cohort.certificate.listStatus exposes newlyIssuable per module (canonical vs new)", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "newly-issuable-loc",
      name: "Newly Issuable Test Location",
    });

    const fixture = await createCurriculumFixture("newly-issuable");

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "NewlyIssuable",
      lastName: "Student",
    });
    await User.Person.createLocationLink({
      personId,
      locationId: location.id,
    });

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId: fixture.curriculumId,
      gearTypeId: fixture.gearTypeId,
    });

    // Issue an earlier cert that covers competency 1 only — module 1
    // becomes fully canonical, module 2 is still untouched.
    const { id: earlierCertId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });
    await Student.Certificate.completeCompetency({
      certificateId: earlierCertId,
      studentCurriculumId,
      competencyId: fixture.curriculumCompetency1Id,
    });
    await Student.Certificate.completeCertificate({
      certificateId: earlierCertId,
      visibleFrom: dayjs().subtract(1, "day").toISOString(),
    });

    // Now spin up a cohort with the same student. Cohort progress hits
    // BOTH competencies (instructor re-ticks comp1 too) so both modules
    // satisfy the cohort-side completion criterion. The newlyIssuable
    // flag is what tells them apart.
    const { id: cohortId } = await Cohort.create({
      label: "Issuable Cohort",
      handle: "issuable-cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });

    const { id: studentActorId } = await User.Actor.upsert({
      personId,
      locationId: location.id,
      type: "student",
    });

    await Cohort.Allocation.create({
      cohortId,
      actorId: studentActorId,
      studentCurriculumId,
    });

    const { id: instructorPersonId } = await User.Person.getOrCreate({
      firstName: "Issuable",
      lastName: "Instructor",
    });
    await User.Person.createLocationLink({
      personId: instructorPersonId,
      locationId: location.id,
    });

    // Find the allocation we just created so we can post progress.
    const status = await Cohort.Certificate.listStatus({ cohortId });
    const studentRow = status.find((row) => row.person.id === personId);
    assert.ok(studentRow, "Expected the student to appear in cohort status");

    await Cohort.StudentProgress.upsertProgress({
      cohortAllocationId: studentRow.id,
      competencyProgress: [
        { competencyId: fixture.curriculumCompetency1Id, progress: 100 },
        { competencyId: fixture.curriculumCompetency2Id, progress: 100 },
      ],
      createdBy: instructorPersonId,
    });

    const finalStatus = await Cohort.Certificate.listStatus({ cohortId });
    const finalStudent = finalStatus.find((row) => row.person.id === personId);
    assert.ok(finalStudent?.studentCurriculum);
    const moduleStatuses = finalStudent.studentCurriculum.moduleStatus;

    const module1 = moduleStatuses.find(
      (m) => m.module.id === fixture.module1Id,
    );
    const module2 = moduleStatuses.find(
      (m) => m.module.id === fixture.module2Id,
    );
    assert.ok(module1, "Module 1 should appear in the status");
    assert.ok(module2, "Module 2 should appear in the status");

    // Module 1: comp1 is already canonical. Cohort progress is 100 but
    // there is nothing NEW to issue here. newlyIssuable must be false.
    assert.equal(
      module1.newlyIssuable,
      false,
      "Module 1 is fully canonical from earlier cert — issuance would mint nothing new",
    );

    // Module 2: comp2 is at 100 in this cohort and has no canonical
    // record yet. This is the only module the cohort run can produce a
    // fresh diploma for.
    assert.equal(
      module2.newlyIssuable,
      true,
      "Module 2 has a fresh competency at 100 with no canonical row — newly issuable",
    );
  }));

// REGRESSION (option d, fully-redundant cohort run): when every
// competency the cohort would issue is already canonical, every
// module's newlyIssuable is false. This is the `geblokkeerd` row state
// the diplomas tab needs to render as "kan geen diploma uitreiken — al
// eerder behaald."
test("cohort.certificate.listStatus newlyIssuable=false for all modules when fully redundant", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "fully-redundant-loc",
      name: "Fully Redundant Cohort Location",
    });

    const fixture = await createCurriculumFixture("fully-redundant");

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "FullyRedundant",
      lastName: "Student",
    });
    await User.Person.createLocationLink({
      personId,
      locationId: location.id,
    });

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId: fixture.curriculumId,
      gearTypeId: fixture.gearTypeId,
    });

    // Earlier cert covers BOTH competencies — the curriculum is fully
    // canonical. Any subsequent cohort run on the same curriculum has
    // nothing new to issue.
    const { id: earlierCertId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });
    await Student.Certificate.completeCompetency({
      certificateId: earlierCertId,
      studentCurriculumId,
      competencyId: [
        fixture.curriculumCompetency1Id,
        fixture.curriculumCompetency2Id,
      ],
    });
    await Student.Certificate.completeCertificate({
      certificateId: earlierCertId,
      visibleFrom: dayjs().subtract(1, "day").toISOString(),
    });

    const { id: cohortId } = await Cohort.create({
      label: "Redundant Cohort",
      handle: "redundant-cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });

    const { id: studentActorId } = await User.Actor.upsert({
      personId,
      locationId: location.id,
      type: "student",
    });
    await Cohort.Allocation.create({
      cohortId,
      actorId: studentActorId,
      studentCurriculumId,
    });

    const { id: instructorPersonId } = await User.Person.getOrCreate({
      firstName: "Redundant",
      lastName: "Instructor",
    });
    await User.Person.createLocationLink({
      personId: instructorPersonId,
      locationId: location.id,
    });

    const initial = await Cohort.Certificate.listStatus({ cohortId });
    const studentRow = initial.find((row) => row.person.id === personId);
    assert.ok(studentRow);

    await Cohort.StudentProgress.upsertProgress({
      cohortAllocationId: studentRow.id,
      competencyProgress: [
        { competencyId: fixture.curriculumCompetency1Id, progress: 100 },
        { competencyId: fixture.curriculumCompetency2Id, progress: 100 },
      ],
      createdBy: instructorPersonId,
    });

    const finalStatus = await Cohort.Certificate.listStatus({ cohortId });
    const finalStudent = finalStatus.find((row) => row.person.id === personId);
    assert.ok(finalStudent?.studentCurriculum);
    for (const module of finalStudent.studentCurriculum.moduleStatus) {
      assert.equal(
        module.newlyIssuable,
        false,
        `Module ${module.module.id} should be fully redundant — every comp already canonical`,
      );
    }
  }));

// REGRESSION (Bugbot review on PR #461 — round 4): listCompletedCompetenciesById
// must filter `isMergeConflictDuplicate = true`. Without the filter, a flagged
// historical row from a merge gets returned as if it were canonical, which
// poisons consumers that ask "what has this student already proven?" — most
// notably the cohort issuance pre-filter, which would silently drop a competency
// from the new certificate (or surface a spurious "geen nieuwe competenties"
// error) even though no canonical row exists.
test("student.curriculum.listCompletedCompetenciesById excludes merge-conflict duplicate rows", () =>
  withTestTransaction(async () => {
    const query = useQuery();

    const location = await Location.create({
      handle: "list-completed-merge-dup-loc",
      name: "List Completed Merge Dup Location",
    });

    const { curriculumId, gearTypeId, curriculumCompetency1Id } =
      await createCurriculumFixture("list-completed-merge-dup");

    const { id: personId } = await User.Person.getOrCreate({
      firstName: "ListCompleted",
      lastName: "MergeDup",
    });
    await User.Person.createLocationLink({
      personId,
      locationId: location.id,
    });

    const { id: studentCurriculumId } = await Student.Curriculum.start({
      personId,
      curriculumId,
      gearTypeId,
    });

    // Issue a canonical cert covering competency 1.
    const { id: certificateId } = await Student.Certificate.startCertificate({
      locationId: location.id,
      studentCurriculumId,
    });
    await Student.Certificate.completeCompetency({
      certificateId,
      studentCurriculumId,
      competencyId: curriculumCompetency1Id,
    });
    await Student.Certificate.completeCertificate({
      certificateId,
      visibleFrom: dayjs().subtract(1, "day").toISOString(),
    });

    // Sanity check: canonical row is returned.
    const before = await Student.Curriculum.listCompletedCompetenciesById({
      id: studentCurriculumId,
    });
    assert.equal(
      before.length,
      1,
      "Canonical row should be returned before flagging",
    );

    // Flag the row as a merge-conflict duplicate, simulating the
    // post-merge state where source's competency landed on target's
    // curriculum but was flagged because target already had Z.
    await query
      .update(s.studentCompletedCompetency)
      .set({ isMergeConflictDuplicate: true })
      .where(
        eq(
          s.studentCompletedCompetency.studentCurriculumId,
          studentCurriculumId,
        ),
      );

    const after = await Student.Curriculum.listCompletedCompetenciesById({
      id: studentCurriculumId,
    });
    assert.equal(
      after.length,
      0,
      "Flagged merge-conflict duplicate row must NOT be returned — it is not canonical",
    );
  }));

test("user.person.linkToLocation creates a fresh active link", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "link-fresh-location",
      name: "Link Fresh Location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Link",
      lastName: "Fresh",
    });

    await User.Person.linkToLocation({ personId, locationId: location.id });

    const links = await query
      .select({ status: s.personLocationLink.status })
      .from(s.personLocationLink)
      .where(
        and(
          eq(s.personLocationLink.personId, personId),
          eq(s.personLocationLink.locationId, location.id),
        ),
      );
    assert.equal(links.length, 1);
    assert.equal(links[0]?.status, "linked");
  }));

test("user.person.linkToLocation is idempotent on already-linked", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "link-idem-location",
      name: "Link Idem Location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Link",
      lastName: "Idem",
    });

    await User.Person.linkToLocation({ personId, locationId: location.id });
    await User.Person.linkToLocation({ personId, locationId: location.id });

    const links = await query
      .select({ status: s.personLocationLink.status })
      .from(s.personLocationLink)
      .where(
        and(
          eq(s.personLocationLink.personId, personId),
          eq(s.personLocationLink.locationId, location.id),
        ),
      );
    assert.equal(links.length, 1);
  }));

test("user.person.linkToLocation throws when existing link is revoked", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "link-revoked-location",
      name: "Link Revoked Location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Link",
      lastName: "Revoked",
    });

    await query.insert(s.personLocationLink).values({
      personId,
      locationId: location.id,
      status: "revoked",
      permissionLevel: "none",
    });

    await assert.rejects(
      User.Person.linkToLocation({ personId, locationId: location.id }),
      /eerder verwijderd/,
    );
  }));

test("user.person.linkToLocation throws when existing link is removed", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "link-removed-location",
      name: "Link Removed Location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Link",
      lastName: "Removed",
    });

    await query.insert(s.personLocationLink).values({
      personId,
      locationId: location.id,
      status: "removed",
      permissionLevel: "none",
    });

    await assert.rejects(
      User.Person.linkToLocation({ personId, locationId: location.id }),
      /eerder verwijderd/,
    );
  }));

test("findCandidateMatchesInLocation returns empty for empty input", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "find-empty-location",
      name: "Find Empty Location",
    });
    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [],
    });
    assert.deepEqual(result, { matchesByRow: [], crossRowGroups: [] });
  }));

test("findCandidateMatchesInLocation surfaces a strong-band match for an exact paste", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "find-exact-location",
      name: "Find Exact Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
      birthCity: "Amsterdam",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          email: null,
        },
      ],
    });

    assert.equal(result.matchesByRow.length, 1);
    // biome-ignore lint/style/noNonNullAssertion: bounded by length assertion above
    const row = result.matchesByRow[0]!;
    assert.equal(row.rowIndex, 0);
    assert.equal(row.candidates.length, 1);
    // biome-ignore lint/style/noNonNullAssertion: bounded by length assertion above
    const cand = row.candidates[0]!;
    assert.equal(cand.personId, existingPersonId);
    assert.ok(cand.score >= 200, `expected score >= 200, got ${cand.score}`);
    assert.ok(cand.reasons.includes("zelfde voornaam"));
    assert.ok(cand.reasons.includes("zelfde achternaam"));
    assert.ok(cand.reasons.includes("zelfde geboortedatum"));
    assert.equal(cand.isAlreadyInTargetCohort, false);
  }));

test("findCandidateMatchesInLocation does NOT surface a person whose link is revoked (GDPR)", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "find-revoked-location",
      name: "Find Revoked Location",
    });
    const { id: revokedPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await query.insert(s.personLocationLink).values({
      personId: revokedPersonId,
      locationId: location.id,
      status: "revoked",
      permissionLevel: "none",
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          email: null,
        },
      ],
    });

    assert.equal(result.matchesByRow.length, 0);
  }));

test("findCandidateMatchesInLocation does NOT surface a soft-deleted person", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "find-deleted-location",
      name: "Find Deleted Location",
    });
    const { id: personId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({ personId, locationId: location.id });
    await query
      .update(s.person)
      .set({ deletedAt: sql`NOW()` })
      .where(eq(s.person.id, personId));

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
      ],
    });

    assert.equal(result.matchesByRow.length, 0);
  }));

test("findCandidateMatchesInLocation forms a cross-row group when 2 rows resolve to the same person", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "find-group-location",
      name: "Find Group Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 3,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          email: null,
        },
        {
          rowIndex: 17,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: null, // missing prefix on this paste, still a strong match
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
      ],
    });

    assert.equal(result.crossRowGroups.length, 1);
    assert.deepEqual(result.crossRowGroups[0]?.rowIndices, [3, 17]);
    assert.deepEqual(result.crossRowGroups[0]?.sharedCandidatePersonIds, [
      existingPersonId,
    ]);
  }));

test("findCandidateMatchesInLocation forms a 3-way cross-row group", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "find-triplet-location",
      name: "Find Triplet Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [3, 17, 22].map((rowIndex) => ({
        rowIndex,
        firstName: "Adam",
        lastName: "Vries",
        lastNamePrefix: "de",
        dateOfBirth: "2010-05-12",
        birthCity: "",
        email: null,
      })),
    });

    assert.equal(result.crossRowGroups.length, 1);
    assert.deepEqual(
      result.crossRowGroups[0]?.rowIndices.sort((a, b) => a - b),
      [3, 17, 22],
    );
  }));

test("previewBulkImport persists a snapshot row and returns the model", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "preview-bulk-location",
      name: "Preview Bulk Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "One",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          birthCountry: "nl",
          email: null,
        },
      ],
    });

    assert.ok(preview.previewToken);
    assert.equal(preview.attempt, 1);

    const stored = await query
      .select()
      .from(s.bulkImportPreview)
      .where(eq(s.bulkImportPreview.token, preview.previewToken));
    assert.equal(stored.length, 1);
    assert.equal(stored[0]?.status, "active");
    assert.equal(stored[0]?.attempt, 1);
    assert.equal(stored[0]?.locationId, location.id);
    assert.equal(stored[0]?.createdByPersonId, operatorPersonId);
  }));

test("commitBulkImport applies use_existing decision and writes audit row", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-use-existing-location",
      name: "Commit Use Existing Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Two",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          birthCountry: "nl",
          email: null,
        },
      ],
    });

    const result = await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "use_existing", personId: existingPersonId },
      },
    });

    const committed = result as {
      kind: "committed";
      linkedPersonIds: string[];
    };
    assert.equal(committed.kind, "committed");
    assert.deepEqual(committed.linkedPersonIds, [existingPersonId]);

    // Audit row written
    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(
        eq(s.personMergeAudit.bulkImportPreviewToken, preview.previewToken),
      );
    assert.equal(audits.length, 1);
    assert.equal(audits[0]?.decisionKind, "use_existing");
    assert.equal(audits[0]?.targetPersonId, existingPersonId);
    assert.equal(audits[0]?.source, "bulk_import_preview");
    assert.deepEqual(audits[0]?.presentedCandidatePersonIds, [
      existingPersonId,
    ]);

    // Preview row marked committed
    const previewAfter = await query
      .select()
      .from(s.bulkImportPreview)
      .where(eq(s.bulkImportPreview.token, preview.previewToken));
    assert.equal(previewAfter[0]?.status, "committed");

    // Actor created for student role
    const actors = await query
      .select()
      .from(s.actor)
      .where(
        and(
          eq(s.actor.personId, existingPersonId),
          eq(s.actor.locationId, location.id),
          eq(s.actor.type, "student"),
        ),
      );
    assert.equal(actors.length, 1);
  }));

test("commitBulkImport rejects use_existing for personId outside GDPR scope", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-gdpr-location",
      name: "Commit GDPR Location",
    });
    const otherLocation = await Location.create({
      handle: "commit-gdpr-other-location",
      name: "Commit GDPR Other Location",
    });
    const { id: outsiderPersonId } = await User.Person.getOrCreate({
      firstName: "Outside",
      lastName: "Person",
      dateOfBirth: "2010-05-12",
    });
    // Outsider linked only to OTHER location.
    await User.Person.linkToLocation({
      personId: outsiderPersonId,
      locationId: otherLocation.id,
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Three",
    });

    // Preview is empty (nothing in our location), but operator crafts a
    // payload claiming to use_existing on the outsider's id. Commit must
    // reject server-side.
    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [
        {
          rowIndex: 0,
          firstName: "Outside",
          lastName: "Person",
          lastNamePrefix: null,
          dateOfBirth: "2010-05-12",
          birthCity: "",
          birthCountry: "nl",
          email: null,
        },
      ],
    });

    await assert.rejects(
      User.Person.commitBulkImport({
        previewToken: preview.previewToken,
        performedByPersonId: operatorPersonId,
        decisions: {
          "0": { kind: "use_existing", personId: outsiderPersonId },
        },
      }),
      /GDPR-grenscontrole/,
    );

    // No audit row written for the rejected attempt
    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(
        eq(s.personMergeAudit.bulkImportPreviewToken, preview.previewToken),
      );
    assert.equal(audits.length, 0);
  }));

test("commitBulkImport refuses a committed preview", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "commit-twice-location",
      name: "Commit Twice Location",
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Four",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [],
    });

    // First commit: empty decisions (no rows) — succeeds, marks committed.
    await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {},
    });

    await assert.rejects(
      User.Person.commitBulkImport({
        previewToken: preview.previewToken,
        performedByPersonId: operatorPersonId,
        decisions: {},
      }),
      /al verwerkt|geblokkeerd/,
    );
  }));

test("commitBulkImport refuses a preview owned by a different operator", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "commit-wrong-owner-location",
      name: "Commit Wrong Owner Location",
    });
    const { id: operatorAId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "A",
    });
    const { id: operatorBId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "B",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorAId,
      roles: ["student"],
      candidates: [],
    });

    await assert.rejects(
      User.Person.commitBulkImport({
        previewToken: preview.previewToken,
        performedByPersonId: operatorBId,
        decisions: {},
      }),
      /hoort niet bij deze gebruiker/,
    );
  }));

test("cleanupExpiredBulkImportPreviews deletes expired active rows", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "cleanup-location",
      name: "Cleanup Location",
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Cleanup",
    });

    // Create one fresh row (won't expire) and one already-expired row.
    const fresh = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [],
    });

    // Manually backdate one row.
    await query.insert(s.bulkImportPreview).values({
      locationId: location.id,
      createdByPersonId: operatorPersonId,
      detectionSnapshot: {},
      rowsParsed: { candidates: [], roles: ["student"] },
      attempt: 1,
      status: "active",
      expiresAt: dayjs().subtract(2, "hour").toISOString(),
    });

    const result = await User.Person.cleanupExpiredBulkImportPreviews({});
    assert.equal(result.activeExpired, 1);

    // Fresh row is still there.
    const fresh_after = await query
      .select()
      .from(s.bulkImportPreview)
      .where(eq(s.bulkImportPreview.token, fresh.previewToken));
    assert.equal(fresh_after.length, 1);
  }));

test("findCandidateMatchesInLocation detects paste-vs-paste groups even with NO existing match", () =>
  withTestTransaction(async () => {
    // Brand-new Adam pasted three times. No existing person in the location.
    // The detection must still flag this as a cross-row group, otherwise
    // each row would default to "create new" → 3 duplicate Person records.
    const location = await Location.create({
      handle: "find-paste-only-location",
      name: "Find Paste-Only Location",
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [3, 17, 22].map((rowIndex) => ({
        rowIndex,
        firstName: "Adam",
        lastName: "Vries",
        lastNamePrefix: "de",
        dateOfBirth: "2010-05-12",
        birthCity: "",
        email: null,
      })),
    });

    // No existing matches surface — the location is empty.
    assert.equal(result.matchesByRow.length, 0);

    // But the cross-row group fires from paste-vs-paste similarity alone.
    assert.equal(result.crossRowGroups.length, 1);
    assert.deepEqual(result.crossRowGroups[0]?.rowIndices, [3, 17, 22]);
    // Empty when there's no existing match — caller knows to default to
    // "create one new person, link all three rows to it."
    assert.deepEqual(result.crossRowGroups[0]?.sharedCandidatePersonIds, []);
  }));

test("findCandidateMatchesInLocation merges paste-pair edges with existing-match edges", () =>
  withTestTransaction(async () => {
    // Setup: location has Adam de Vries linked-active. Operator pastes 3 rows:
    //   row 3: Adam de Vries (matches existing Adam)
    //   row 17: Adam de Vries (matches existing Adam)
    //   row 22: similar enough to row 3/17 (paste-vs-paste) but doesn't strong-match existing
    //           because data differs (e.g., DOB year off by 1).
    // Expectation: all three rows form one connected group. Row 22 is in the
    // group via the paste-pair edge to rows 3/17, even though it doesn't
    // strong-match the existing Adam directly.
    const location = await Location.create({
      handle: "find-mixed-edges-location",
      name: "Find Mixed Edges Location",
    });
    const { id: existingAdamId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingAdamId,
      locationId: location.id,
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 3,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          email: null,
        },
        {
          rowIndex: 17,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
        {
          rowIndex: 22,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
      ],
    });

    assert.equal(result.crossRowGroups.length, 1);
    assert.deepEqual(result.crossRowGroups[0]?.rowIndices, [3, 17, 22]);
    // Existing Adam still shows up in the shared set because rows 3, 17,
    // and 22 all strong-match him.
    assert.deepEqual(result.crossRowGroups[0]?.sharedCandidatePersonIds, [
      existingAdamId,
    ]);
  }));

test("findCandidateMatchesInLocation: 2 paste rows similar to each other but not to existing", () =>
  withTestTransaction(async () => {
    // Setup: location has Eva. Operator pastes 2 rows for a brand-new Adam.
    // Eva is irrelevant — Adam doesn't match her. But the 2 Adam rows match
    // each other.
    const location = await Location.create({
      handle: "find-paste-only-2way-location",
      name: "Find Paste-Only 2-way Location",
    });
    const { id: evaId } = await User.Person.getOrCreate({
      firstName: "Eva",
      lastName: "Janssen",
      dateOfBirth: "2008-03-22",
    });
    await User.Person.linkToLocation({
      personId: evaId,
      locationId: location.id,
    });

    const result = await User.Person.findCandidateMatchesInLocation({
      locationId: location.id,
      candidates: [
        {
          rowIndex: 0,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
        {
          rowIndex: 1,
          firstName: "Adam",
          lastName: "Vries",
          lastNamePrefix: "de",
          dateOfBirth: "2010-05-12",
          birthCity: "",
          email: null,
        },
      ],
    });

    // No existing-person matches for either row.
    assert.equal(result.matchesByRow.length, 0);
    // But the paste-vs-paste edge forms a group.
    assert.equal(result.crossRowGroups.length, 1);
    assert.deepEqual(result.crossRowGroups[0]?.rowIndices, [0, 1]);
    assert.deepEqual(result.crossRowGroups[0]?.sharedCandidatePersonIds, []);
  }));

test("commitBulkImport: 3 rows targeting same existing person → 3 cohort allocations sharing one actor, 3 audit rows", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-dedup-existing-location",
      name: "Commit Dedup Existing Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: cohortId } = await Cohort.create({
      handle: "dedup-cohort",
      label: "Dedup Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Dedup",
    });

    // 3 paste rows for the same Adam — operator confirmed "same person".
    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      targetCohortId: cohortId,
      roles: ["student"],
      candidates: [3, 17, 22].map((rowIndex) => ({
        rowIndex,
        firstName: "Adam",
        lastName: "Vries",
        lastNamePrefix: "de",
        dateOfBirth: "2010-05-12",
        birthCity: "Amsterdam",
        birthCountry: "nl",
        email: null,
      })),
    });

    const result = await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "3": { kind: "use_existing", personId: existingPersonId },
        "17": { kind: "use_existing", personId: existingPersonId },
        "22": { kind: "use_existing", personId: existingPersonId },
      },
    });

    assert.equal(
      (result as { kind: "committed"; linkedPersonIds: string[] }).kind,
      "committed",
    );

    // Cohort allocations: 3 rows → 3 allocations, all sharing the same
    // actor (one Person, one Actor for student role). Each pasted row
    // is a distinct intent; allocations are not deduped.
    const allocations = await query
      .select()
      .from(s.cohortAllocation)
      .innerJoin(s.actor, eq(s.actor.id, s.cohortAllocation.actorId))
      .where(
        and(
          eq(s.cohortAllocation.cohortId, cohortId),
          eq(s.actor.personId, existingPersonId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      );
    assert.equal(
      allocations.length,
      3,
      `Expected 3 cohort_allocations, got ${allocations.length}`,
    );
    // All point to the same actor.
    const actorIds = new Set(allocations.map((a) => a.actor.id));
    assert.equal(
      actorIds.size,
      1,
      `Expected one actor across all 3 allocations, got ${actorIds.size}`,
    );

    // Audit: 3 rows (one per pasted CSV row), all decisionKind=use_existing.
    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(
        eq(s.personMergeAudit.bulkImportPreviewToken, preview.previewToken),
      );
    assert.equal(audits.length, 3);
    for (const audit of audits) {
      assert.equal(audit.decisionKind, "use_existing");
      assert.equal(audit.targetPersonId, existingPersonId);
    }
  }));

test("commitBulkImport: cross-row create_new group with shareNewPersonWithGroup → 1 person, 1 audit per row", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-dedup-new-location",
      name: "Commit Dedup New Location",
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "DedupNew",
    });

    // Paste 3 rows for the same brand-new Adam, no existing match.
    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [0, 1, 2].map((rowIndex) => ({
        rowIndex,
        firstName: "Adam",
        lastName: "Vries",
        lastNamePrefix: "de",
        dateOfBirth: "2010-05-12",
        birthCity: "Amsterdam",
        birthCountry: "nl",
        email: null,
      })),
    });

    // Stub createPerson — track invocations.
    let createPersonCalls = 0;
    const fakePersonId = "00000000-0000-0000-0000-0000000000aa";
    await query.insert(s.person).values({
      id: fakePersonId,
      handle: "stub-adam",
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });

    const result = await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "create_new", shareNewPersonWithGroup: "g1" },
        "1": { kind: "create_new", shareNewPersonWithGroup: "g1" },
        "2": { kind: "create_new", shareNewPersonWithGroup: "g1" },
      },
      createPerson: async () => {
        createPersonCalls += 1;
        return { personId: fakePersonId };
      },
    });

    assert.equal(
      (result as { kind: "committed"; createdPersonIds: string[] }).kind,
      "committed",
    );
    assert.equal(
      createPersonCalls,
      1,
      `Expected createPerson called 1x for shared group, got ${createPersonCalls}`,
    );

    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(
        eq(s.personMergeAudit.bulkImportPreviewToken, preview.previewToken),
      );
    assert.equal(audits.length, 3);
    for (const audit of audits) {
      assert.equal(audit.decisionKind, "create_new");
      assert.equal(audit.targetPersonId, fakePersonId);
    }
  }));

test("commitBulkImport: 3 different-people create_new (no group) → 3 createPerson calls", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-different-people-location",
      name: "Commit Different People Location",
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "DiffPeople",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      roles: ["student"],
      candidates: [0, 1, 2].map((rowIndex) => ({
        rowIndex,
        firstName: `Person${rowIndex}`,
        lastName: "Test",
        lastNamePrefix: null,
        dateOfBirth: "2010-05-12",
        birthCity: "",
        birthCountry: "nl",
        email: null,
      })),
    });

    let createPersonCalls = 0;
    const fakeIds = [
      "00000000-0000-0000-0000-0000000000a1",
      "00000000-0000-0000-0000-0000000000a2",
      "00000000-0000-0000-0000-0000000000a3",
    ];
    for (let i = 0; i < 3; i++) {
      await query.insert(s.person).values({
        id: fakeIds[i],
        handle: `stub-${i}`,
        firstName: `Person${i}`,
        lastName: "Test",
        dateOfBirth: "2010-05-12",
      });
    }

    await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "create_new" },
        "1": { kind: "create_new" },
        "2": { kind: "create_new" },
      },
      createPerson: async () => {
        const id = fakeIds[createPersonCalls];
        createPersonCalls += 1;
        // biome-ignore lint/style/noNonNullAssertion: stub bounded by indices
        return { personId: id! };
      },
    });

    assert.equal(
      createPersonCalls,
      3,
      "Different-people mode should call createPerson per row",
    );
  }));

test("listDuplicatePairsInLocation surfaces a strong match within the location", () =>
  withTestTransaction(async () => {
    const location = await Location.create({
      handle: "list-pairs-loc",
      name: "List Pairs Location",
    });
    const { id: adamA } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    const { id: adamB } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-13",
    });
    await User.Person.linkToLocation({
      personId: adamA,
      locationId: location.id,
    });
    await User.Person.linkToLocation({
      personId: adamB,
      locationId: location.id,
    });

    const pairs = await User.Person.listDuplicatePairsInLocation({
      locationId: location.id,
      threshold: 100,
      limit: 50,
    });

    assert.equal(pairs.length, 1);
    // biome-ignore lint/style/noNonNullAssertion: bounded by length assertion above
    const pair = pairs[0]!;
    const ids = [pair.primary.id, pair.duplicate.id].sort();
    assert.deepEqual(ids, [adamA, adamB].sort());
    assert.ok(pair.score >= 100);
  }));

test("listDuplicatePairsInLocation excludes persons whose link is revoked (GDPR)", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "list-pairs-revoked-loc",
      name: "List Pairs Revoked Location",
    });
    const { id: adamA } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    const { id: adamB } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-13",
    });
    await User.Person.linkToLocation({
      personId: adamA,
      locationId: location.id,
    });
    // adamB linked but revoked
    await query.insert(s.personLocationLink).values({
      personId: adamB,
      locationId: location.id,
      status: "revoked",
      permissionLevel: "none",
    });

    const pairs = await User.Person.listDuplicatePairsInLocation({
      locationId: location.id,
      threshold: 100,
    });
    assert.equal(pairs.length, 0);
  }));

test("listDuplicatePairsInLocation with cohortId only returns pairs inside that cohort", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "list-pairs-cohort-loc",
      name: "List Pairs Cohort Location",
    });
    const { id: adamA } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-12",
    });
    const { id: adamB } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Vries",
      lastNamePrefix: "de",
      dateOfBirth: "2010-05-13",
    });
    await User.Person.linkToLocation({
      personId: adamA,
      locationId: location.id,
    });
    await User.Person.linkToLocation({
      personId: adamB,
      locationId: location.id,
    });

    const cohortInside = await Cohort.create({
      handle: "inside-cohort",
      label: "Inside",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });
    const cohortOutside = await Cohort.create({
      handle: "outside-cohort",
      label: "Outside",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });

    // Allocate both Adams into cohortInside via student actors.
    for (const personId of [adamA, adamB]) {
      const actor = await User.Actor.upsert({
        type: "student",
        personId,
        locationId: location.id,
      });
      await query.insert(s.cohortAllocation).values({
        cohortId: cohortInside.id,
        actorId: actor.id,
      });
    }

    const insidePairs = await User.Person.listDuplicatePairsInLocation({
      locationId: location.id,
      cohortId: cohortInside.id,
      threshold: 100,
    });
    assert.equal(insidePairs.length, 1);

    const outsidePairs = await User.Person.listDuplicatePairsInLocation({
      locationId: location.id,
      cohortId: cohortOutside.id,
      threshold: 100,
    });
    assert.equal(outsidePairs.length, 0);
  }));

test("mergePersons writes a personMergeAudit row when auditMetadata provided", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "merge-audit-loc",
      name: "Merge Audit Location",
    });
    const { id: primaryId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Primary",
      dateOfBirth: "2010-05-12",
    });
    const { id: duplicateId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Duplicate",
      dateOfBirth: "2010-05-12",
    });
    const { id: operatorId } = await User.Person.getOrCreate({
      firstName: "Operator",
      lastName: "Audit",
    });
    await User.Person.linkToLocation({
      personId: primaryId,
      locationId: location.id,
    });
    await User.Person.linkToLocation({
      personId: duplicateId,
      locationId: location.id,
    });

    await User.Person.mergePersons({
      personId: duplicateId,
      targetPersonId: primaryId,
      auditMetadata: {
        performedByPersonId: operatorId,
        locationId: location.id,
        source: "personen_page",
        score: 175,
        reasons: ["same first name", "same birth date"],
      },
    });

    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(eq(s.personMergeAudit.targetPersonId, primaryId));
    assert.equal(audits.length, 1);
    // biome-ignore lint/style/noNonNullAssertion: bounded by length assertion above
    const audit = audits[0]!;
    assert.equal(audit.decisionKind, "merge");
    assert.equal(audit.source, "personen_page");
    assert.equal(audit.score, 175);
    assert.deepEqual(audit.reasons, ["same first name", "same birth date"]);
    assert.equal(audit.sourcePersonId, duplicateId);
    assert.equal(audit.performedByPersonId, operatorId);
  }));

test("mergePersons without auditMetadata does NOT write an audit row", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "merge-no-audit-loc",
      name: "Merge No Audit Location",
    });
    const { id: primaryId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Primary",
      dateOfBirth: "2010-05-12",
    });
    const { id: duplicateId } = await User.Person.getOrCreate({
      firstName: "Adam",
      lastName: "Duplicate",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: primaryId,
      locationId: location.id,
    });

    await User.Person.mergePersons({
      personId: duplicateId,
      targetPersonId: primaryId,
    });

    const audits = await query
      .select()
      .from(s.personMergeAudit)
      .where(eq(s.personMergeAudit.targetPersonId, primaryId));
    assert.equal(audits.length, 0);
  }));

test("isInLocationScope returns true for linked-active, false for revoked or absent", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "scope-loc",
      name: "Scope Location",
    });
    const otherLocation = await Location.create({
      handle: "scope-other-loc",
      name: "Scope Other Location",
    });

    const { id: linkedActiveId } = await User.Person.getOrCreate({
      firstName: "Linked",
      lastName: "Active",
    });
    await User.Person.linkToLocation({
      personId: linkedActiveId,
      locationId: location.id,
    });

    const { id: revokedId } = await User.Person.getOrCreate({
      firstName: "Revoked",
      lastName: "Person",
    });
    await query.insert(s.personLocationLink).values({
      personId: revokedId,
      locationId: location.id,
      status: "revoked",
      permissionLevel: "none",
    });

    const { id: outsiderId } = await User.Person.getOrCreate({
      firstName: "Outsider",
      lastName: "Person",
    });
    await User.Person.linkToLocation({
      personId: outsiderId,
      locationId: otherLocation.id,
    });

    assert.equal(
      await User.Person.isInLocationScope({
        personId: linkedActiveId,
        locationId: location.id,
      }),
      true,
    );
    assert.equal(
      await User.Person.isInLocationScope({
        personId: revokedId,
        locationId: location.id,
      }),
      false,
    );
    assert.equal(
      await User.Person.isInLocationScope({
        personId: outsiderId,
        locationId: location.id,
      }),
      false,
    );
  }));

test("searchForAutocompleteInLocation only returns linked-active persons", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const locationA = await Location.create({
      handle: "search-loc-a",
      name: "Search Location A",
    });
    const locationB = await Location.create({
      handle: "search-loc-b",
      name: "Search Location B",
    });

    const { id: insideId } = await User.Person.getOrCreate({
      firstName: "Inside",
      lastName: "Adam",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: insideId,
      locationId: locationA.id,
    });

    const { id: outsideId } = await User.Person.getOrCreate({
      firstName: "Outside",
      lastName: "Adam",
      dateOfBirth: "2010-05-13",
    });
    await User.Person.linkToLocation({
      personId: outsideId,
      locationId: locationB.id,
    });

    const { id: revokedId } = await User.Person.getOrCreate({
      firstName: "Revoked",
      lastName: "Adam",
      dateOfBirth: "2010-05-14",
    });
    await query.insert(s.personLocationLink).values({
      personId: revokedId,
      locationId: locationA.id,
      status: "revoked",
      permissionLevel: "none",
    });

    const found = await User.Person.searchForAutocompleteInLocation({
      q: "Adam",
      locationId: locationA.id,
    });
    const ids = found.map((p) => p.id);
    assert.ok(ids.includes(insideId));
    assert.ok(!ids.includes(outsideId), "outsider must not appear");
    assert.ok(!ids.includes(revokedId), "revoked must not appear");
  }));

test("commitBulkImport: tagsByRowIndex applied to cohort_allocation.tags", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-tags-location",
      name: "Commit Tags Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Tagged",
      lastName: "Bakker",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: cohortId } = await Cohort.create({
      handle: "tagged-cohort",
      label: "Tagged Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "TagOperator",
      lastName: "X",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      targetCohortId: cohortId,
      roles: ["student"],
      candidates: [
        {
          rowIndex: 0,
          firstName: "Tagged",
          lastName: "Bakker",
          lastNamePrefix: null,
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          birthCountry: "nl",
          email: null,
        },
      ],
    });

    await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "use_existing", personId: existingPersonId },
      },
      tagsByRowIndex: {
        "0": ["optimist", "tuesday-group"],
      },
    });

    const allocation = await query
      .select({ tags: s.cohortAllocation.tags })
      .from(s.cohortAllocation)
      .innerJoin(s.actor, eq(s.actor.id, s.cohortAllocation.actorId))
      .where(
        and(
          eq(s.cohortAllocation.cohortId, cohortId),
          eq(s.actor.personId, existingPersonId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .then((rows) => rows[0]);

    assert.ok(allocation, "Expected one cohort_allocation");
    assert.deepStrictEqual(
      [...allocation.tags].sort(),
      ["optimist", "tuesday-group"],
      `Expected both tags applied, got ${JSON.stringify(allocation.tags)}`,
    );
  }));

test("commitBulkImport: empty tagsByRowIndex → no tags column written", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-no-tags-location",
      name: "Commit No Tags Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Untagged",
      lastName: "Bakker",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: cohortId } = await Cohort.create({
      handle: "untagged-cohort",
      label: "Untagged Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "NoTagOperator",
      lastName: "X",
    });

    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      targetCohortId: cohortId,
      roles: ["student"],
      candidates: [
        {
          rowIndex: 0,
          firstName: "Untagged",
          lastName: "Bakker",
          lastNamePrefix: null,
          dateOfBirth: "2010-05-12",
          birthCity: "Amsterdam",
          birthCountry: "nl",
          email: null,
        },
      ],
    });

    // No tagsByRowIndex passed.
    await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "use_existing", personId: existingPersonId },
      },
    });

    const allocation = await query
      .select({ tags: s.cohortAllocation.tags })
      .from(s.cohortAllocation)
      .innerJoin(s.actor, eq(s.actor.id, s.cohortAllocation.actorId))
      .where(
        and(
          eq(s.cohortAllocation.cohortId, cohortId),
          eq(s.actor.personId, existingPersonId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      )
      .then((rows) => rows[0]);

    assert.ok(allocation, "Expected one cohort_allocation");
    assert.deepStrictEqual(
      allocation.tags,
      [],
      "Expected no tags applied when tagsByRowIndex omitted",
    );
  }));

test("commitBulkImport: cross-row same_person → N allocations, each with that row's own tags", () =>
  withTestTransaction(async () => {
    const query = useQuery();
    const location = await Location.create({
      handle: "commit-tag-perrow-location",
      name: "Commit Tag Per Row Location",
    });
    const { id: existingPersonId } = await User.Person.getOrCreate({
      firstName: "Aggregate",
      lastName: "Bakker",
      dateOfBirth: "2010-05-12",
    });
    await User.Person.linkToLocation({
      personId: existingPersonId,
      locationId: location.id,
    });
    const { id: cohortId } = await Cohort.create({
      handle: "tag-perrow-cohort",
      label: "Tag Per Row Cohort",
      locationId: location.id,
      accessStartTime: dayjs().subtract(1, "day").toISOString(),
      accessEndTime: dayjs().add(30, "day").toISOString(),
    });
    const { id: operatorPersonId } = await User.Person.getOrCreate({
      firstName: "PerRowOperator",
      lastName: "X",
    });

    // 3 paste rows for the same Adam, each with its own tag set.
    // Operator's mental model: each row is one course/sub-group →
    // 3 allocations, NOT a single allocation with merged tags.
    const preview = await User.Person.previewBulkImport({
      locationId: location.id,
      performedByPersonId: operatorPersonId,
      targetCohortId: cohortId,
      roles: ["student"],
      candidates: [0, 1, 2].map((rowIndex) => ({
        rowIndex,
        firstName: "Aggregate",
        lastName: "Bakker",
        lastNamePrefix: null,
        dateOfBirth: "2010-05-12",
        birthCity: "Amsterdam",
        birthCountry: "nl",
        email: null,
      })),
    });

    await User.Person.commitBulkImport({
      previewToken: preview.previewToken,
      performedByPersonId: operatorPersonId,
      decisions: {
        "0": { kind: "use_existing", personId: existingPersonId },
        "1": { kind: "use_existing", personId: existingPersonId },
        "2": { kind: "use_existing", personId: existingPersonId },
      },
      tagsByRowIndex: {
        "0": ["optimist"],
        "1": ["dinsdag"],
        "2": ["zondag-recital"],
      },
    });

    const allocations = await query
      .select({ tags: s.cohortAllocation.tags })
      .from(s.cohortAllocation)
      .innerJoin(s.actor, eq(s.actor.id, s.cohortAllocation.actorId))
      .where(
        and(
          eq(s.cohortAllocation.cohortId, cohortId),
          eq(s.actor.personId, existingPersonId),
          isNull(s.cohortAllocation.deletedAt),
        ),
      );

    assert.equal(
      allocations.length,
      3,
      `Expected 3 cohort_allocations, got ${allocations.length}`,
    );
    const tagSets = allocations.map((a) => [...a.tags].sort().join(",")).sort();
    assert.deepStrictEqual(
      tagSets,
      ["dinsdag", "optimist", "zondag-recital"],
      `Expected each allocation to carry its own row's tags, got ${JSON.stringify(tagSets)}`,
    );
  }));
