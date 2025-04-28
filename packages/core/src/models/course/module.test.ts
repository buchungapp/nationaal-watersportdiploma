import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import * as Module from "./module.js";
import type { Output } from "./module.schema.js";

test("module crud", () =>
  withTestTransaction(async () => {
    const { id } = await Module.create({
      title: "title-1",
      handle: "handle-1",
    });

    const list = await Module.list();
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
    } satisfies Output);
  }));
