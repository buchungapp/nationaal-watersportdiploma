import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../../contexts/index.ts";
import type { Output } from "./location.schema.ts";
import * as Location from "./location.ts";

test("location crud", () =>
  withTestTransaction(async () => {
    const { id } = await Location.create({
      handle: "handle-1",
      name: "title-1",
      websiteUrl: "https://example.com",
    });

    const list = await Location.list();
    assert.equal(list.length, 1);

    const [item] = list;
    assert.ok(item);

    assert.deepStrictEqual(item, {
      id,
      handle: "handle-1",
      name: "title-1",
      websiteUrl: "https://example.com",
      email: null,
      shortDescription: null,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      deletedAt: null,
      logo: null,
      logoCertificate: null,
      logoSquare: null,
      socialMedia: [],
      googlePlaceId: null,
      googlePlaceData: null,
    } satisfies Output);
  }));
