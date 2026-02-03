import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import dayjs from "../../utils/dayjs.js";
import { DEFAULT_TEST_TIMESTAMP, defaultTimestamps } from "../../utils/test.js";
import { Degree, Discipline } from "../course/index.js";
import { Course } from "../index.js";
import * as Curriculum from "./curriculum.js";

test("curriculum crud", () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: "discipline-1",
      handle: "dc1",
    });

    const createDegree = Degree.create({
      title: "degree-1",
      handle: "dg1",
      rang: 1,
    });

    const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
      createDiscipline,
      createDegree,
    ]);

    const { id: courseId } = await Course.create({
      title: "course-1",
      handle: "co1",
      disciplineId,
    });

    const { id: programId } = await Course.Program.create({
      handle: "pr1",
      degreeId,
      courseId,
    });

    const { id } = await Curriculum.create({
      programId: programId,
      revision: "A",
    });

    const list = await Curriculum.list();

    assert.equal(list.length, 1);
    const [item] = list;

    assert.deepStrictEqual(defaultTimestamps(item), {
      id,
      revision: "A",
      startedAt: null,
      programId: programId,
      modules: [],
      createdAt: DEFAULT_TEST_TIMESTAMP,
      updatedAt: DEFAULT_TEST_TIMESTAMP,
      deletedAt: null,
    });
  }));

test("curriculum list filters", () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: "discipline-1",
      handle: "dc1",
    });

    const createDegree = Degree.create({
      title: "degree-1",
      handle: "dg1",
      rang: 1,
    });

    const [{ id: disciplineId }, { id: degreeId }] = await Promise.all([
      createDiscipline,
      createDegree,
    ]);

    const { id: courseId } = await Course.create({
      title: "course-1",
      handle: "co1",
      disciplineId,
    });

    const { id: programId } = await Course.Program.create({
      handle: "pr1",
      degreeId,
      courseId,
    });

    const startedAt = dayjs().toISOString();

    const { id } = await Curriculum.create({
      programId: programId,
      revision: "A",
    });

    await Curriculum.start({
      curriculumId: id,
      startedAt,
    });

    await Curriculum.create({
      programId: programId,
      revision: "B",
    });

    const list = await Curriculum.list({ filter: { onlyCurrentActive: true } });

    assert.equal(list.length, 1);
    const [item] = list;

    assert.deepStrictEqual(defaultTimestamps(item), {
      id,
      revision: "A",
      startedAt,
      programId: programId,
      modules: [],
      createdAt: DEFAULT_TEST_TIMESTAMP,
      updatedAt: DEFAULT_TEST_TIMESTAMP,
      deletedAt: null,
    });
  }));
