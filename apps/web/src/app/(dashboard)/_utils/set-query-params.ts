"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const useSetQueryParams = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const setQueryParams = useCallback(
    (paramsObj: Record<string, string | string[] | undefined>): string => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(paramsObj)) {
        if (Array.isArray(value)) {
          params.delete(key);
          for (const item of value) {
            params.append(key, item);
          }
        } else {
          if (value === undefined) {
            params.delete(key);
            continue;
          }

          params.set(key, value);
        }
      }
      return `${pathname}?${params.toString()}`;
    },
    [pathname, searchParams],
  );

  return setQueryParams;
};

export const setCheckboxFieldParams = (field: string, params: string[]) => {
  return params.includes(field)
    ? params.filter((item) => item !== field)
    : [field, ...params];
};

export const setRadioFieldParams = (
  field: string,
  params: string[],
  options: string[],
) => {
  if (params.includes(field)) {
    return params.filter((item) => item !== field);
  }
  const filteredParams = params.filter((param) => !options.includes(param));
  return [field, ...filteredParams];
};
