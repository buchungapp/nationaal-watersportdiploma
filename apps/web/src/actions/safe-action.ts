import { createSafeActionClient } from "next-safe-action";
import { after } from "next/server";
import { z } from "zod";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";

export const DEFAULT_SERVER_ERROR_MESSAGE =
  "Er is iets misgegaan. Probeer het later opnieuw.";

export const actionClientWithMeta = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
  defineMetadataSchema() {
    return z.object({
      name: z.string(),
    });
  },
}).use(async ({ next, metadata }) => {
  after(async () => {
    try {
      const user = await getUserOrThrow();

      posthog.capture({
        distinctId: user.authUserId,
        event: "action-executed",
        properties: {
          action: metadata.name,
        },
      });

      await posthog.shutdown();
    } catch (error) {
      console.error("Failed to capture action execution", error);
    }
  });

  return next();
});

export type FormDataLikeInput = {
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
};

// Allows action to be called with or without form data, useful for actions that are triggered by a form submission without any form data
export const voidActionSchema =
  // biome-ignore lint/suspicious/noConfusingVoidType: This is used to allow the action to be called with or without form data
  z.custom<FormData | FormDataLikeInput | void>();
