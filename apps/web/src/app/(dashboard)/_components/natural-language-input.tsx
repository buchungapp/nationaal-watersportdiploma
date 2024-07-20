"use client";

// Credits to: https://dub.co/blog/smart-datetime-picker

import { dateTime as dateTimeUtils } from "@nawadi/lib";
import React from "react";
import { Input } from "./input";

export default function SmartDatetimePicker({
  name,
  required,
  invalid,
  defaultValue,
}: {
  name: string;
  required?: boolean;
  invalid?: boolean;
  defaultValue?: Date;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dateTime, setDateTime] = React.useState<Date | null>(
    defaultValue ?? null,
  );

  return (
    <>
      <Input
        ref={inputRef}
        type="text"
        placeholder='bv. "over 2 weken" of "morgen 14:00"'
        defaultValue={dateTime ? dateTimeUtils.formatDateTime(dateTime) : ""}
        invalid={invalid}
        onBlur={(e) => {
          // parse the date string when the input field loses focus
          if (e.target.value.length > 0) {
            const parsedDateTime = dateTimeUtils.parseDateTime(e.target.value);
            if (parsedDateTime) {
              setDateTime(parsedDateTime);
              e.target.value = dateTimeUtils.formatDateTime(parsedDateTime);
            }
          }
        }}
      />

      <input
        type="datetime-local"
        step={60 * 15}
        tabIndex={-1}
        required={required}
        name={name}
        value={dateTime ? dateTimeUtils.getDateTimeLocal(dateTime) : ""}
        onChange={(e) => {
          const expiryDate = new Date(e.target.value);
          setDateTime(expiryDate);
          // set the formatted date string in the text input field to keep them in sync
          if (inputRef.current) {
            inputRef.current.value = dateTimeUtils.formatDateTime(expiryDate);
          }
        }}
        // we intentionally make the datetime-local input field with a width of 30px
        // to only show the calendar icon and hide the input field
        className="w-[30px] pr-[10px] h-[36px] border-none bg-transparent text-gray-500 focus:outline-none focus:ring-0 sm:text-sm absolute right-0 bottom-0"
      />
    </>
  );
}
