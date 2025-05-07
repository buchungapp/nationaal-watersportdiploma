import { z } from "zod";

export const DEFAULT_SERVER_ERROR_MESSAGE =
  "Er is iets misgegaan. Probeer het later opnieuw.";

export type FormDataLikeInput = {
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
};

// Allows action to be called with or without form data, useful for actions that are triggered by a form submission without any form data
export const voidActionSchema =
  // biome-ignore lint/suspicious/noConfusingVoidType: This is used to allow the action to be called with or without form data
  z.custom<FormData | FormDataLikeInput | void>();
