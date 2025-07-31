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
  | undefined;

// Helper type to check if a type is an array
type IsArray<T> = T extends readonly unknown[] ? true : false;

// Helper type to get the element type of an array
type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * @description This hook is used to get the input value from the form / execution
 * @param input The input from the useAction hook
 * @returns The input value
 */
export const useFormInput = <T extends Record<string, unknown>>(
  input: Input<T>,
  defaultValue?: NullableFields<Partial<T>>,
) => {
  type AllValues = NonNullableFields<Merge<T>>;
  type Key = keyof AllValues;

  const returnDefaultValue = <K extends Key>(
    name: K,
  ): AllValues[K] | undefined =>
    (defaultValue?.[name] ?? undefined) as AllValues[K] | undefined;

  const parsedInput = (
    input ? preprocessFormData(input) : undefined
  ) as NullableFields<Partial<T>>;

  /**
   * @description This function is used to get the input value from the form / execution. If the input is undefined, it will return the default value.
   * @param name The name of the input
   * @returns The input value
   */
  const getInputValue = <K extends Key>(name: K): AllValues[K] | undefined => {
    if (parsedInput === undefined) return returnDefaultValue<K>(name);
    if (!(name in parsedInput)) return returnDefaultValue<K>(name);

    return (parsedInput[name] as AllValues[K]) ?? returnDefaultValue<K>(name);
  };

  /**
   * @description Gets the input value and ensures it's an array if the expected type is an array
   * @param name The name of the input
   * @returns The input value as an array
   */
  const getInputValueAsArray = <K extends Key>(
    name: K,
  ): AllValues[K] | undefined => {
    const value = getInputValue<K>(name);
    if (value === undefined) return undefined;
    if (value === null) return [] as AllValues[K];

    if (!Array.isArray(value)) {
      return [value] as AllValues[K];
    }

    return value;
  };

  return { getInputValue, getInputValueAsArray };
};
