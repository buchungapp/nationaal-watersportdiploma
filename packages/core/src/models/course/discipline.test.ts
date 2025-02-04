import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import * as Discipline from "./discipline.js";
import type { Output } from "./discipline.schema.js";

test("discipline crud", () =>
  withTestTransaction(async () => {
    const { id } = await Discipline.create({
      title: "title-1",
      handle: "handle-1",
    });

    const list = await Discipline.list();

    assert.equal(list.length, 1);
    const [item] = list;

    assert.deepStrictEqual(item, {
      id,
      title: "title-1",
      handle: "handle-1",
      createdAt: item?.createdAt,
      updatedAt: item?.updatedAt,
      deletedAt: null,
      weight: 1,
    } satisfies Output);
  }));
