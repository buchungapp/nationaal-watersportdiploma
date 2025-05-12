"use client";
import { parseAsIsoDate, useQueryState } from "nuqs";
import { SmartDatePicker } from "~/app/(dashboard)/_components/natural-language-input";

export function DateSelector({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: Date;
}) {
  const [date, setDate] = useQueryState(name, parseAsIsoDate);

  return (
    <SmartDatePicker
      name={name}
      onChange={setDate}
      defaultValue={defaultValue}
    />
  );
}
