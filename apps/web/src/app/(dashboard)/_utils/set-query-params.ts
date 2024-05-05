"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";

export const useSetQueryParams = () => {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const setQueryParams = useCallback(
    (paramsObj: Record<string, string | string[]>): string => {
      const params = new URLSearchParams(searchParams.toString());

      Object.entries(paramsObj).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((item) => params.append(key, item));
        } else {
          params.set(key, value);
        }
      });
      return pathname + "?" + params.toString();
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
  } else {
    const filteredParams = params.filter((param) => !options.includes(param));
    return [field, ...filteredParams];
  }
};
