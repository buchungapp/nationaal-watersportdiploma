import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import { DEFAULT_TEST_TIMESTAMP, defaultTimestamps } from "../../utils/test.js";
import { Course } from "../index.js";
import * as Discipline from "./discipline.js";
import { Category } from "./index.js";

test("course crud", () =>
  withTestTransaction(async () => {
    const createDiscipline = Discipline.create({
      title: "discipline-1",
      handle: "dc1",
    });

    const createCategory = Category.create({
      title: "parent",
      handle: "ca1",
    }).then(async ({ id }) => {
      return {
        id,
        createChild: await Category.create({
          title: "child",
          handle: "ca2",
          parentCategoryId: id,
        }),
      };
    });

    const [
      { id: disciplineId },
      {
        id: parentCategoryId,
        createChild: { id: childCategoryId },
      },
    ] = await Promise.all([createDiscipline, createCategory]);

    const { id } = await Course.create({
      title: "course-1",
      handle: "pr1",
      disciplineId,
      categories: [childCategoryId],
    });

    const list = await Course.list();

    const byHandle = await Course.findOne({ handle: "pr1" });

    assert.equal(list.length, 1);
    const [item] = list;

    const expected = {
      id,
      abbreviation: null,
      title: "course-1",
      description: null,
      handle: "pr1",
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

      categories: [
        {
          id: childCategoryId,
          title: "child",
          handle: "ca2",
          description: null,
          createdAt: DEFAULT_TEST_TIMESTAMP,
          updatedAt: DEFAULT_TEST_TIMESTAMP,
          deletedAt: null,
          weight: 2,
          parent: {
            id: parentCategoryId,
            title: "parent",
            handle: "ca1",
            description: null,
            createdAt: DEFAULT_TEST_TIMESTAMP,
            updatedAt: DEFAULT_TEST_TIMESTAMP,
            deletedAt: null,
            weight: 1,
          },
        },
      ],
    };

    assert.deepStrictEqual(defaultTimestamps(item), expected);
    assert.deepStrictEqual(defaultTimestamps(byHandle), expected);
  }));
