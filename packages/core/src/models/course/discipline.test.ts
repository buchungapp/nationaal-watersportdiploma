import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.ts";
import type { Output } from "./discipline.schema.ts";
import * as Discipline from "./discipline.ts";

test("discipline crud", () =>
  withTestTransaction(async () => {
    const { id } = await Discipline.create({
      title: "title-1",
      handle: "handle-1",
    });

    const list = await Discipline.list();
    assert.equal(list.length, 1);

    const [item] = list;
    assert.ok(item);

    assert.deepStrictEqual(item, {
      id,
      title: "title-1",
      handle: "handle-1",
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: null,
      weight: 1,
      abbreviation: null,
    } satisfies Output);
  }));
