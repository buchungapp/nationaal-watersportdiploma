"use client";
import { dateTime } from "@nawadi/lib";
import { parseAsIsoDate, useQueryState, useQueryStates } from "nuqs";
import { useTransition } from "react";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Input } from "~/app/(dashboard)/_components/input";
import Spinner from "~/app/_components/spinner";

export function DateSelector({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: Date;
}) {
  const [isLoading, startTransition] = useTransition();
  const [date, setDate] = useQueryState(
    name,
    parseAsIsoDate
      .withDefault(defaultValue ?? new Date())
      .withOptions({ startTransition, shallow: false, throttleMs: 300 }),
  );

  return (
    <div className="relative">
      <Input
        type="date"
        name={name}
        value={dateTime.getDateLocal(date)}
        onChange={(e) => {
          setDate(new Date(e.target.value));
        }}
      />
      {isLoading && (
        <div className="right-9 absolute inset-y-0 flex items-center">
          <Spinner />
        </div>
      )}
    </div>
  );
}

export function FixedDateSelector({
  defaultValueFrom,
  defaultValueTo,
  dateOptions,
}: {
  defaultValueFrom?: Date;
  defaultValueTo?: Date;
  dateOptions: {
    label: string;
    value: {
      from: Date;
      to: Date;
    };
  }[];
}) {
  const [isLoading, startTransition] = useTransition();
  const [date, setDate] = useQueryStates(
    {
      from: parseAsIsoDate.withDefault(defaultValueFrom ?? new Date()),
      to: parseAsIsoDate.withDefault(defaultValueTo ?? new Date()),
    },
    {
      startTransition,
      shallow: false,
      throttleMs: 300,
    },
  );

  return (
    <Dropdown>
      <DropdownButton outline disabled={isLoading}>
        {isLoading ? <Spinner /> : null}
        {dateOptions.find(
          (option) =>
            option.value.from.toISOString() === date.from.toISOString() &&
            option.value.to.toISOString() === date.to.toISOString(),
        )?.label ?? "Kies een periode"}
      </DropdownButton>
      <DropdownMenu anchor="bottom end">
        {dateOptions.map((option) => (
          <DropdownItem
            key={option.label}
            onClick={() => setDate(option.value)}
          >
            <DropdownLabel>{option.label}</DropdownLabel>
          </DropdownItem>
        ))}
      </DropdownMenu>
    </Dropdown>
  );
}
