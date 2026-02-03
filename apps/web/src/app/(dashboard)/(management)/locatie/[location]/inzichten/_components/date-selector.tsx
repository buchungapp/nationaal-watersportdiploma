"use client";
import { parseAsString, useQueryState, useQueryStates } from "nuqs";
import { useTransition } from "react";
import Spinner from "~/app/_components/spinner";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "~/app/(dashboard)/_components/dropdown";
import { Input } from "~/app/(dashboard)/_components/input";

export function DateSelector({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue: string;
}) {
  const [isLoading, startTransition] = useTransition();
  const [date, setDate] = useQueryState(
    name,
    parseAsString
      .withDefault(defaultValue)
      .withOptions({ startTransition, shallow: false, throttleMs: 300 }),
  );

  return (
    <div className="relative">
      <Input
        type="date"
        name={name}
        value={date}
        onChange={(e) => {
          setDate(e.target.value);
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
  defaultValueFrom: string;
  defaultValueTo: string;
  dateOptions: {
    label: string;
    value: {
      from: string;
      to: string;
    };
  }[];
}) {
  const [isLoading, startTransition] = useTransition();
  const [date, setDate] = useQueryStates(
    {
      from: parseAsString.withDefault(defaultValueFrom),
      to: parseAsString.withDefault(defaultValueTo),
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
            option.value.from === date.from && option.value.to === date.to,
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
