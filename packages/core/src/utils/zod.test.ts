import * as assert from "node:assert/strict";
import { describe, test } from "node:test";
import { z } from "zod";
import { withZod } from "./zod.js";

describe("withZod", async () => {
  // Test schemas
  const inputSchema = z.object({
    name: z.string(),
    age: z.number(),
  });

  const outputSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    age: z.number(),
  });

  const defaultInputSchema = z
    .object({
      name: z.string(),
      age: z.number().default(18),
    })
    .default({ name: "default", age: 18 });

  await test("should successfully validate and transform input and output", async () => {
    const mockFunc = async (input: z.infer<typeof inputSchema>) => {
      return {
        id: "123e4567-e89b-12d3-a456-426614174000",
        ...input,
      };
    };

    const wrappedFunc = withZod(inputSchema, outputSchema, mockFunc);
    const result = await wrappedFunc({
      name: "John",
      age: 25,
    });

    assert.deepStrictEqual(result, {
      id: "123e4567-e89b-12d3-a456-426614174000",
      name: "John",
      age: 25,
    });
  });

  await test("should throw error on invalid input", async () => {
    const mockFunc = async (input: z.infer<typeof inputSchema>) => {
      return {
        id: "123e4567-e89b-12d3-a456-426614174000",
        ...input,
      };
    };

    const wrappedFunc = withZod(inputSchema, outputSchema, mockFunc);

    await assert.rejects(async () => {
      // @ts-expect-error Testing invalid input
      await wrappedFunc({ name: "John" });
    });
  });

  await test("should throw error on invalid output", async () => {
    const mockFunc = async () => {
      return {
        id: "invalid-uuid",
        name: "John",
        age: 25,
      };
    };

    const wrappedFunc = withZod(inputSchema, outputSchema, mockFunc);

    await assert.rejects(async () => {
      await wrappedFunc({
        name: "John",
        age: 25,
      });
    });
  });

  await test("should work with default values in schema", async () => {
    const mockFunc = async (input: z.infer<typeof defaultInputSchema>) => {
      return input;
    };

    const wrappedFunc = withZod(defaultInputSchema, mockFunc);
    const result = await wrappedFunc();

    assert.deepStrictEqual(result, {
      name: "default",
      age: 18,
    });
  });

  await test("should work without output schema", async () => {
    const mockFunc = async (input: z.infer<typeof inputSchema>) => {
      return {
        processed: true,
        ...input,
      };
    };

    const wrappedFunc = withZod(inputSchema, mockFunc);
    const result = await wrappedFunc({
      name: "John",
      age: 25,
    });

    assert.deepStrictEqual(result, {
      processed: true,
      name: "John",
      age: 25,
    });
  });

  await test("should preserve function properties", async () => {
    const mockFunc = async (input: z.infer<typeof inputSchema>) => input;
    mockFunc.customProperty = "test";

    const wrappedFunc = withZod(inputSchema, mockFunc);

    // @ts-expect-error Testing runtime property
    assert.strictEqual(wrappedFunc.customProperty, "test");
    // @ts-expect-error Testing runtime property
    assert.strictEqual(wrappedFunc.inputSchema, inputSchema);
  });

  await test("should handle array inputs", async () => {
    const arrayInputSchema = z.array(z.string());
    const mockFunc = async (input: string[]) => input.join(",");

    const wrappedFunc = withZod(arrayInputSchema, z.string(), mockFunc);
    const result = await wrappedFunc(["a", "b", "c"]);

    assert.strictEqual(result, "a,b,c");
  });
});
