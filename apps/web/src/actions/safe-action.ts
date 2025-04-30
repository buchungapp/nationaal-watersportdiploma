import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { zfd } from "zod-form-data";

export const DEFAULT_SERVER_ERROR_MESSAGE =
  "Er is iets misgegaan. Probeer het later opnieuw.";

export const actionClient = createSafeActionClient({
  handleServerError(e) {
    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

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
});

export const voidActionSchema = z
  .void()
  .or(zfd.formData({}).default(new FormData()));
