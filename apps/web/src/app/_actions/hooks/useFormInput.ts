import { preprocessFormData } from "zod-form-data";
import type { FormDataLikeInput } from "../utils";

type NullableFields<T> = { [K in keyof T]: T[K] | null };
export type NonNullableFields<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};
type CommonKeys<T extends object> = keyof T;
type AllKeys<T> = T extends T ? keyof T : never;
type Subtract<A, C> = A extends C ? never : A;
type NonCommonKeys<T extends object> = Subtract<AllKeys<T>, CommonKeys<T>>;

type PickType<T, K extends AllKeys<T>> = T extends { [k in K]?: unknown }
  ? T[K]
  : undefined;

type PickTypeOf<T, K extends string | number | symbol> = K extends AllKeys<T>
  ? PickType<T, K>
  : never;

type Merge<T extends object> = {
  [k in CommonKeys<T>]: PickTypeOf<T, k>;
} & {
  [k in NonCommonKeys<T>]?: PickTypeOf<T, k>;
};

type Input<T extends Record<string, unknown>> =
  | FormData
  | FormDataLikeInput
  | T
  | {}
  | undefined;

/**
 * @description This function checks if an object is empty (has no own properties)
 */
const isEmptyObject = (obj: unknown): obj is Record<string, never> =>
  typeof obj === "object" && obj !== null && Object.keys(obj).length === 0;

/**
 * @description This hook is used to get the input value from the form / execution
 * @param input The input from the useAction hook
 * @returns The input value
 */
export const useFormInput = <T extends Record<string, unknown>>(
  // biome-ignore lint/suspicious/noExplicitAny: Allow any input type for compatibility with next-safe-action v8
  input: Input<T> | any,
  // biome-ignore lint/suspicious/noExplicitAny: Allow any default value type for flexibility
  defaultValue?: any,
) => {
  // biome-ignore lint/suspicious/noExplicitAny: Need flexible types for dynamic form inputs
  const returnDefaultValue = (name: string): any =>
    defaultValue?.[name] ?? undefined;

  // Handle empty object case from next-safe-action v8
  const normalizedInput = isEmptyObject(input) ? undefined : input;

  // biome-ignore lint/suspicious/noExplicitAny: Need flexible types for dynamic form inputs
  const parsedInput: any = normalizedInput
    ? preprocessFormData(normalizedInput)
    : undefined;

  /**
   * @description This function is used to get the input value from the form / execution. If the input is undefined, it will return the default value.
   * @param name The name of the input
   * @returns The input value
   */
  // biome-ignore lint/suspicious/noExplicitAny: Return type needs to be flexible for backwards compatibility
  const getInputValue = (name: string): any => {
    if (parsedInput === undefined) return returnDefaultValue(name);
    if (!(name in parsedInput)) return returnDefaultValue(name);

    return parsedInput[name] ?? returnDefaultValue(name);
  };

  return { getInputValue };
};
