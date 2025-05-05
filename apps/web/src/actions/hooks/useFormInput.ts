type FormDataLikeInput = {
  [Symbol.iterator](): IterableIterator<[string, FormDataEntryValue]>;
  entries(): IterableIterator<[string, FormDataEntryValue]>;
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
) => {
  const getInputValue = (name: keyof T) => {
    if (input === undefined) return undefined;

    if (isFormData(input)) {
      const value = input.get(name as string) as string | null;
      return value ?? undefined;
    }

    if (isFormDataLikeInput(input)) {
      for (const [key, value] of input) {
        if (key === name) return value as string;
      }
      return undefined;
    }

    return input[name] as string | undefined;
  };

  const getInputValues = (name: keyof T) => {
    if (input === undefined) return undefined;

    if (isFormData(input)) {
      return input.getAll(name as string) as string[];
    }

    if (isFormDataLikeInput(input)) {
      const values: string[] = [];
      for (const [key, value] of input) {
        if (key === name) values.push(value as string);
      }
      return values.length > 0 ? values : undefined;
    }

    return input[name] ? [input[name] as string] : undefined;
  };

  return { getInputValue, getInputValues };
};
