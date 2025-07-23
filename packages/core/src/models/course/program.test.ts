import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import { DEFAULT_TEST_TIMESTAMP, defaultTimestamps } from "../../utils/test.js";
import * as Course from "./course.js";
import * as Degree from "./degree.js";
import * as Discipline from "./discipline.js";
import * as Program from "./program.js";

test("program crud", () =>
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

    const { id: programId } = await Program.create({
      handle: "pr1",
      degreeId,
      courseId,
    });

    const list = await Program.list();

    const byHandle = await Program.fromHandle("pr1");

    assert.equal(list.length, 1);
    const [item] = list;

    const expected = {
      id: programId,
      title: null,
      handle: "pr1",
      createdAt: DEFAULT_TEST_TIMESTAMP,
      updatedAt: DEFAULT_TEST_TIMESTAMP,
      deletedAt: null,

      course: {
        id: courseId,
        abbreviation: null,
        title: "course-1",
        description: null,
        handle: "co1",
        createdAt: DEFAULT_TEST_TIMESTAMP,
        updatedAt: DEFAULT_TEST_TIMESTAMP,
        deletedAt: null,

        discipline: {
          id: disciplineId,
          abbreviation: null,
          title: "discipline-1",
          handle: "dc1",
          deletedAt: null,
          createdAt: DEFAULT_TEST_TIMESTAMP,
          updatedAt: DEFAULT_TEST_TIMESTAMP,
          weight: 1,
        },

        categories: [],
      },

      degree: {
        id: degreeId,
        title: "degree-1",
        handle: "dg1",
        rang: 1,
        createdAt: DEFAULT_TEST_TIMESTAMP,
        updatedAt: DEFAULT_TEST_TIMESTAMP,
        deletedAt: null,
      },
    };

    assert.deepStrictEqual(defaultTimestamps(item), expected);
    assert.deepStrictEqual(defaultTimestamps(byHandle), expected);
  }));
