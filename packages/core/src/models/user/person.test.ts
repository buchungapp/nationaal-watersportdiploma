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
      liveCurriculaForTarget[0]!.id,
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
    assert.equal(reachableCertificates[0]!.id, sourceCertificateId);

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
      deletedTargetCurriculum[0]!.deletedAt,
      "Deleted target curriculum should remain soft-deleted, untouched by the merge",
    );
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
      personEntry.modules[0]!.certificateId,
      newerCertId,
      "Module should reference the canonical (newer) certificate, not the merge-conflict duplicate (older one)",
    );
  }));
