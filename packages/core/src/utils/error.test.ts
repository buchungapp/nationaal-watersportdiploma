import assert from "node:assert";
import test from "node:test";
import { withTestTransaction } from "../contexts/index.js";
import * as Location from "../models/location/index.js";
import { CoreError, CoreErrorType } from "./error.js";

test("error", () =>
  withTestTransaction(async () => {
    try {
      await Location.create({
        handle: "handle-1",
      });

      await Location.create({
        handle: "handle-1",
      });

      assert.fail("should error");
    } catch (error) {
      if (!(error instanceof CoreError)) {
        throw error;
      }

      assert.equal(error.type, CoreErrorType.UniqueKey);
    }
  }));
