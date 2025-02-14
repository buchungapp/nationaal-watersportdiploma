import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.js";
import type { Output } from "./category.schema.js";
import { Category } from "./index.js";

test("category crud", () =>
  withTestTransaction(async () => {
    const { id } = await Category.create({
      title: "title-1",
      handle: "handle-1",
    });

    const list = await Category.list();
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
      description: null,
      parent: null,
      weight: 1,
    } satisfies Output);
  }));
