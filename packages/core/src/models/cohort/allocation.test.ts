import assert from "node:assert";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { schema as s } from "@nawadi/db";
import { eq } from "drizzle-orm";
import { useQuery, withTestTransaction } from "../../contexts/index.js";
import dayjs from "../../utils/dayjs.js";
import {
  Cohort,
  Course,
  Curriculum,
  Location,
  Student,
  User,
} from "../index.js";

async function createCurriculumFixture(prefix: string) {
  const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
    Course.Discipline.create({
      title: `${prefix}-discipline`,
      handle: `${prefix}-discipline`,
    }),
    Course.Degree.create({
      title: `${prefix}-degree`,
      handle: `${prefix}-degree`,
      rang: 1000 + Math.floor(Math.random() * 30_000),
    }),
  ]);

  const { id: courseId } = await Course.create({
    title: `${prefix}-course`,
    handle: `${prefix}-course`,
    disciplineId,
  });

  const { id: programId } = await Course.Program.create({
    title: `${prefix}-program`,
    handle: `${prefix}-program`,
    degreeId,
    courseId,
  });

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
  ]);

  return { curriculumId, gearTypeId };
}

async function createAllocationFixture() {
  const query = useQuery();
  const prefix = `allocation-${randomUUID().slice(0, 8)}`;

  const { id: locationId } = await Location.create({
    handle: `${prefix}-location`,
    name: `${prefix} location`,
  });

  const { id: cohortId } = await Cohort.create({
    label: `${prefix} cohort`,
    handle: `${prefix}-cohort`,
    locationId,
    accessStartTime: dayjs().subtract(1, "day").toISOString(),
    accessEndTime: dayjs().add(1, "day").toISOString(),
  });

  const { id: personId } = await User.Person.getOrCreate({
    firstName: prefix,
    lastName: "Student",
  });

  const [actor] = await query
    .insert(s.actor)
    .values({
      personId,
      locationId,
      type: "student",
    })
    .returning({ id: s.actor.id });

  assert.ok(actor);
  const actorId = actor.id;

  const { id: allocationId } = await Cohort.Allocation.create({
    actorId,
    cohortId,
  });

  const { curriculumId, gearTypeId } = await createCurriculumFixture(prefix);
  const { id: studentCurriculumId } = await Student.Curriculum.start({
    personId,
    curriculumId,
    gearTypeId,
  });

  await query
    .update(s.actor)
    .set({ deletedAt: dayjs().toISOString() })
    .where(eq(s.actor.id, actorId));

  return {
    allocationId,
    cohortId,
    studentCurriculumId,
  };
}

test("cohort allocation ignores allocations whose student actor is soft-deleted", () =>
  withTestTransaction(async () => {
    const { allocationId, cohortId } = await createAllocationFixture();

    const allocation = await Cohort.Allocation.retrieveStudentWithCurriculum({
      allocationId,
      cohortId,
    });

    assert.equal(allocation, null);
  }));

test("cohort allocation cannot attach a curriculum to a soft-deleted student actor", () =>
  withTestTransaction(async () => {
    const { allocationId, cohortId, studentCurriculumId } =
      await createAllocationFixture();

    await assert.rejects(
      Cohort.Allocation.setStudentCurriculum({
        cohortId,
        studentAllocationId: allocationId,
        studentCurriculumId,
      }),
      /Expected 1 row, got 0/,
    );
  }));
