import { createSafeActionClient } from "next-safe-action";
import { after } from "next/server";
import { z } from "zod";
import { getUserOrThrow } from "~/lib/nwd";
import posthog from "~/lib/posthog";
import { DEFAULT_SERVER_ERROR_MESSAGE } from "./utils";

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
