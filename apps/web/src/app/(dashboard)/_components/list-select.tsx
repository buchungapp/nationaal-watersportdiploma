"use client";
import { CheckIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { Input } from "./input";

type AllowedBy = string | number;

export function ListSelect<
  T extends Record<string, unknown>,
  BY extends {
    [K in keyof T]: T[K] extends AllowedBy ? K : never;
  }[keyof T],
>({
  options,
  by,
  displayValue,
  defaultValue,
  onChange,
  placeholder,
  name,
  filter,
  minSelected = 1,
}: {
  options: T[];
  by: BY;
  displayValue: (value: T) => string;
  defaultValue?: T[BY][];
  onChange?: (value: T[BY][]) => void;
  placeholder?: string;
  name?: string;
  filter?: (option: T) => boolean;
  minSelected?: number;
}) {
  const [query, setQuery] = useState<string>("");
  const [selectedItems, setSelectedItems] = useState<T[BY][]>(
    defaultValue ?? [],
  );

  useEffect(() => {
    setSelectedItems(defaultValue ?? []);
  }, [defaultValue]);

  return (
    <div>
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      <div className="flex flex-col gap-1 pt-1 max-h-[200px] overflow-y-auto">
        {options
          .filter((option) => {
            if (query === "") return true;
            if (filter) return filter(option);
            return displayValue(option)
              .toLowerCase()
              .includes(query.toLowerCase());
          })
          .map((option) => (
            <ListSelectOption
              key={option[by] as AllowedBy}
              option={option}
              selected={selectedItems.includes(option[by])}
              disabled={
                selectedItems.includes(option[by]) &&
                selectedItems.length <= minSelected
              }
              displayValue={displayValue}
              toggleSelected={() =>
                setSelectedItems((prev) => {
                  const newSelectedItems = prev.includes(option[by])
                    ? prev.filter((item) => item !== option[by])
                    : [...prev, option[by]];

                  if (newSelectedItems.length < minSelected) {
                    return prev;
                  }

                  onChange?.(newSelectedItems);
                  return newSelectedItems;
                })
              }
            />
          ))}
      </div>
      {name
        ? selectedItems.map((item) => (
            <input
              key={item as AllowedBy}
              type="hidden"
              name={name}
              value={item as AllowedBy}
            />
          ))
        : null}
    </div>
  );
}

function ListSelectOption<T>({
  option,
  selected,
  displayValue,
  toggleSelected,
  disabled,
}: {
  option: T;
  selected: boolean;
  displayValue: (value: T) => string;
  toggleSelected: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={clsx(
        "flex justify-between items-center",
        "px-[calc(--spacing(3.5)-1px)] sm:px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)]",
        "border rounded-lg sm:text-sm/6 text-base/6",
        selected ? "bg-green-500/15 border-green-500" : "border-zinc-950/10",
      )}
      onClick={toggleSelected}
      disabled={disabled}
    >
      <span>{displayValue(option)}</span>
      {selected ? <CheckIcon className="size-4 text-green-500" /> : null}
    </button>
  );
}
