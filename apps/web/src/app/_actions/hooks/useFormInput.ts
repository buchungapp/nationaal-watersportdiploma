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

function isFormData<T extends Record<string, unknown>>(
  input: Input<T>,
): input is FormData {
  return input instanceof FormData;
}

function isFormDataLikeInput<T extends Record<string, unknown>>(
  input: Input<T>,
): input is FormDataLikeInput {
  return input !== undefined && "entries" in input && !isFormData(input);
}

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

  const defaultValueArray = <K extends Key>(
    name: K,
  ): AllValues[K][] | undefined => {
    const value = returnDefaultValue<K>(name);
    return value ? [value] : undefined;
  };

  /**
   * @description This function is used to get the input value from the form / execution. If the input is undefined, it will return the default value.
   * @param name The name of the input
   * @returns The input value
   */
  const getInputValue = <K extends Key>(name: K): AllValues[K] | undefined => {
    if (input === undefined) return returnDefaultValue<K>(name);

    if (isFormData(input)) {
      const value = input.get(name as string) as AllValues[K] | null;
      return value ?? returnDefaultValue<K>(name);
    }

    if (isFormDataLikeInput(input)) {
      for (const [key, value] of input) {
        if (key === name)
          return (value as AllValues[K]) ?? returnDefaultValue<K>(name);
      }
      return returnDefaultValue<K>(name);
    }

    if (name in input) {
      return (input[name] ?? returnDefaultValue<K>(name)) as
        | AllValues[K]
        | undefined;
    }

    return returnDefaultValue<K>(name);
  };

  /**
   * @description This function is used to get the input values from the form / execution. If the input is undefined, it will return the default values.
   * @param name The name of the input
   * @returns The input values
   */
  const getInputValues = <K extends Key>(
    name: K,
  ): AllValues[K][] | undefined => {
    if (input === undefined) return defaultValueArray<K>(name);

    if (isFormData(input)) {
      const values = input.getAll(name as string) as AllValues[K][];
      return values.length > 0 ? values : defaultValueArray<K>(name);
    }

    if (isFormDataLikeInput(input)) {
      const values: AllValues[K][] = [];
      for (const [key, value] of input) {
        if (key === name) values.push(value as AllValues[K]);
      }
      return values.length > 0 ? values : defaultValueArray<K>(name);
    }

    if (name in input) {
      return input[name]
        ? [input[name] as AllValues[K]]
        : defaultValueArray<K>(name);
    }

    return defaultValueArray<K>(name);
  };

  return { getInputValue, getInputValues };
};
