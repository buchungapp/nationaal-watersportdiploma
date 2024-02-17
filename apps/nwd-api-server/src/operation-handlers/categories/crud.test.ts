import assert from "assert";
import test from "node:test";
import * as api from "nwd-api";
import { withDatabase } from "nwd-db";
import { withServer } from "../../testing/index.js";

test("categories crud", () =>
  withDatabase(async ({ db }) =>
    withServer({ db }, async ({ baseUrl, server }) => {
      const clientCredentials = { apiToken: "supersecret" };
      const clientConfiguration = { baseUrl };
      let mainCategoryId: number;

      await test("create main category", async () => {
        const operationResult = await api.createMainCategory(
          {
            parameters: {},
            contentType: "application/json",
            entity: () => ({
              name: "main-category",
            }),
          },
          clientCredentials,
          clientConfiguration,
        );

        assert(operationResult.status === 201);

        const entity = await operationResult.entity();
        mainCategoryId = entity.id;

        assert.deepEqual(entity, {
          id: 1,
          name: "main-category",
        });
      });

      await test("list main categories", async () => {
        const operationResult = await api.getMainCategories(
          {
            parameters: {},
            contentType: null,
          },
          clientCredentials,
          clientConfiguration,
        );

        assert(operationResult.status === 200);

        const entity = await operationResult.entity();

        assert.deepEqual(entity, [
          {
            id: 1,
            name: "main-category",
          },
        ]);
      });

      await test("create sub category", async () => {
        const operationResult = await api.createSubCategory(
          {
            parameters: {
              mainCategoryId,
            },
            contentType: "application/json",
            entity: () => ({
              name: "sub-category",
            }),
          },
          clientCredentials,
          clientConfiguration,
        );

        assert(operationResult.status === 201);

        const entity = await operationResult.entity();
        assert.deepEqual(entity, {
          id: 1,
          name: "sub-category",
        });
      });

      await test("list sub categories", async () => {
        const operationResult = await api.getSubCategories(
          {
            parameters: {
              mainCategoryId,
            },
            contentType: null,
          },
          clientCredentials,
          clientConfiguration,
        );

        assert(operationResult.status === 200);

        const entity = await operationResult.entity();

        assert.deepEqual(entity, [
          {
            id: 1,
            name: "sub-category",
          },
        ]);
      });
    }),
  ));
