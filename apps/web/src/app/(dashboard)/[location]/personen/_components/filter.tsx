"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useRouter, useSearchParams } from "next/navigation";
import { ComponentProps, useDeferredValue, useEffect, useState } from "react";
import { useSetQueryParams } from "~/app/(dashboard)/_utils/set-query-params";
import { Checkbox } from "../../../_components/checkbox";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "../../../_components/popover";

function CheckboxButton({
  children,
  className,
  onClick,
  ...props
}: Pick<ComponentProps<"button">, "onClick" | "className" | "children"> &
  ComponentProps<typeof Checkbox>) {
  return (
    <button
      className={clsx([
        className,

        // Base
        "relative isolate inline-flex items-center gap-x-2 rounded-lg text-base/6",

        // Sizing
        "px-[calc(theme(spacing[3.5])-1px)] py-[calc(theme(spacing[2.5])-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing[1.5])-1px)] sm:text-sm/6",

        // Disabled
        "data-[disabled]:opacity-50",
      ])}
      onClick={onClick}
    >
      <Checkbox {...props} />
      {children}
    </button>
  );
}

export function FilterSelect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setQueryParams = useSetQueryParams();
  const [_selectedStatus, setSelectedStatus] = useState<string[]>(
    searchParams.has("filter") ? searchParams.getAll("filter") : [],
  );

  const deferredStatus = useDeferredValue(_selectedStatus);

  useEffect(() => {
    router.push(
      setQueryParams({
        filter: deferredStatus,
      }),
    );
  }, [deferredStatus]);

  return (
    <Popover className="relative">
      <PopoverButton className={"min-w-32"}>
        Filter <ChevronDownIcon />
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="flex flex-col gap-1">
        <CheckboxButton
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("student")
                ? prev.filter((item) => item !== "student")
                : [...prev, "student"],
            );
          }}
          checked={_selectedStatus.includes("student")}
        >
          Cursist
        </CheckboxButton>
        <CheckboxButton
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("instructor")
                ? prev.filter((item) => item !== "instructor")
                : [...prev, "instructor"],
            );
          }}
          checked={_selectedStatus.includes("instructor")}
        >
          Instructeur
        </CheckboxButton>
        <CheckboxButton
          onClick={() => {
            setSelectedStatus((prev) =>
              prev.includes("location-admin")
                ? prev.filter((item) => item !== "location-admin")
                : [...prev, "location-admin"],
            );
          }}
          checked={_selectedStatus.includes("location-admin")}
        >
          Locatie-beheerder
        </CheckboxButton>
      </PopoverPanel>
    </Popover>
  );
}
