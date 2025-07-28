"use client";

import { ChevronDownIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { parseAsString, useQueryState } from "nuqs";
import { parseAsArrayOf } from "nuqs";
import type { ComponentProps } from "react";
import { useOptimistic, useTransition } from "react";
import { Checkbox } from "~/app/(dashboard)/_components/checkbox";
import {
  Popover,
  PopoverButton,
  PopoverPanel,
} from "~/app/(dashboard)/_components/popover";
import Spinner from "~/app/_components/spinner";

function CheckboxButton({
  children,
  className,
  onClick,
  ...props
}: Pick<ComponentProps<"button">, "onClick" | "className" | "children"> &
  ComponentProps<typeof Checkbox>) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className={clsx([
        className,

        // Base
        "relative isolate inline-flex items-center gap-x-2 rounded-lg text-base/6",

        // Sizing
        "px-[calc(--spacing(3.5)-1px)] py-[calc(--spacing(2.5)-1px)] sm:px-[calc(--spacing(3)-1px)] sm:py-[calc(--spacing(1.5)-1px)] sm:text-sm/6",

        // Disabled
        "data-disabled:opacity-50",
      ])}
      onClick={(...e) => {
        if (!onClick) return;

        return startTransition(() => {
          onClick(...e);
        });
      }}
    >
      {isPending ? (
        <Spinner className="text-slate-700" size="sm" />
      ) : (
        <Checkbox {...props} />
      )}
      {children}
    </button>
  );
}

export function FilterSelect() {
  const [filter, setFilter] = useQueryState(
    "filter",
    parseAsArrayOf(parseAsString).withOptions({
      shallow: false,
    }),
  );
  const [, setPage] = useQueryState(
    "page",
    parseAsString.withOptions({
      shallow: false,
    }),
  );
  const [, setLimit] = useQueryState(
    "limit",
    parseAsString.withOptions({
      shallow: false,
    }),
  );

  const [optimisticSelectedStatus, setOptimisticSelectedStatus] = useOptimistic(
    filter ?? ["instructor", "student"],
    (
      current,
      toggle:
        | "student"
        | "instructor"
        | "location_admin"
        | "pvb_beoordelaar"
        | "secretariaat",
    ) => {
      return current.includes(toggle)
        ? current.filter((item) => item !== toggle)
        : [...current, toggle];
    },
  );

  const handleToggle = (
    toggle:
      | "student"
      | "instructor"
      | "location_admin"
      | "pvb_beoordelaar"
      | "secretariaat",
  ) => {
    setOptimisticSelectedStatus(toggle);

    setFilter(
      optimisticSelectedStatus.includes(toggle)
        ? optimisticSelectedStatus.filter((item) => item !== toggle)
        : [...optimisticSelectedStatus, toggle],
    );

    setPage(null);
    setLimit(null);
  };

  return (
    <Popover className="relative">
      <PopoverButton outline>
        Filter <ChevronDownIcon />
      </PopoverButton>
      <PopoverPanel anchor="bottom end" className="flex flex-col gap-1">
        <CheckboxButton
          onClick={() => handleToggle("instructor")}
          checked={optimisticSelectedStatus.includes("instructor")}
        >
          Instructeur
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("student")}
          checked={optimisticSelectedStatus.includes("student")}
        >
          Student
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("location_admin")}
          checked={optimisticSelectedStatus.includes("location_admin")}
        >
          Locatiebeheerder
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("pvb_beoordelaar")}
          checked={optimisticSelectedStatus.includes("pvb_beoordelaar")}
        >
          PVB Beoordelaar
        </CheckboxButton>
        <CheckboxButton
          onClick={() => handleToggle("secretariaat")}
          checked={optimisticSelectedStatus.includes("secretariaat")}
        >
          Secretariaat
        </CheckboxButton>
      </PopoverPanel>
    </Popover>
  );
}
