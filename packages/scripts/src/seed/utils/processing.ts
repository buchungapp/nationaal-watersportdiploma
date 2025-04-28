import { oraPromise } from "ora";
import { RESET, TEXT_CYAN, TEXT_GREEN, TEXT_RED } from "./colors.js";

export async function processing<T>(
  promise: PromiseLike<T> | (() => PromiseLike<T>),
  {
    icon,
    text,
    successText,
    failText,
    indentation,
  }: {
    icon: string;
    text: string;
    successText: string;
    failText: string;
    indentation?: number;
  },
) {
  const spaces = " ".repeat(indentation ?? 0);
  return oraPromise(promise, {
    text: `${spaces + icon} ${TEXT_CYAN}${text}${RESET}`,
    successText: `${spaces + icon} ${TEXT_GREEN}${successText}${RESET}`,
    failText: `${spaces + icon} ${TEXT_RED}${failText}${RESET}`,
  });
}
