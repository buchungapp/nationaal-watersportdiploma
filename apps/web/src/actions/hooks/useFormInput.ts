import type { FormDataLikeInput } from "../safe-action";

type Nullable<T> = { [K in keyof T]: T[K] | null };

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
  defaultValue?: Nullable<Partial<T>>,
) => {
  const returnValue = <K>(name: keyof T) =>
    defaultValue?.[name] as K | undefined;
  const defaultValueArray = <K>(name: keyof T) =>
    returnValue<K>(name) ? [returnValue<K>(name)] : undefined;

  /**
   * @description This function is used to get the input value from the form / execution. If the input is undefined, it will return the default value.
   * @param name The name of the input
   * @returns The input value
   */
  const getInputValue = <K>(name: keyof T) => {
    if (input === undefined) return returnValue<K>(name);

    if (isFormData(input)) {
      const value = input.get(name as string) as K | null;
      return value ?? returnValue<K>(name);
    }

    if (isFormDataLikeInput(input)) {
      for (const [key, value] of input) {
        if (key === name) return value as K;
      }
      return returnValue<K>(name);
    }

    return (input[name] as K | undefined) ?? returnValue<K>(name);
  };

  /**
   * @description This function is used to get the input values from the form / execution. If the input is undefined, it will return the default values.
   * @param name The name of the input
   * @returns The input values
   */
  const getInputValues = <K>(name: keyof T) => {
    if (input === undefined) return defaultValueArray<K>(name);

    if (isFormData(input)) {
      const values = input.getAll(name as string) as K[];
      return values.length > 0 ? values : defaultValueArray<K>(name);
    }

    if (isFormDataLikeInput(input)) {
      const values: K[] = [];
      for (const [key, value] of input) {
        if (key === name) values.push(value as K);
      }
      return values.length > 0 ? values : defaultValueArray<K>(name);
    }

    return input[name] ? [input[name] as K] : defaultValueArray<K>(name);
  };

  return { getInputValue, getInputValues };
};
