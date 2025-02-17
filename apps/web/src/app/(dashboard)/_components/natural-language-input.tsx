"use client";

// Credits to: https://dub.co/blog/smart-datetime-picker

import { CalendarDaysIcon } from "@heroicons/react/16/solid";
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
  const dateRef = React.useRef<HTMLInputElement>(null);
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

      <button
        onClick={() => {
          dateRef.current?.showPicker();
          dateRef.current?.focus();
        }}
        type="button"
        className="bg-white text-slate-500 rounded-xs p-1.5 sm:text-sm absolute right-1 bottom-[6px] sm:bottom-[4px]"
      >
        <CalendarDaysIcon className="size-5 sm:size-4" />
      </button>

      <input
        type="datetime-local"
        ref={dateRef}
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
        // we intentionally make the datetime-local input field with a width of 0px
        // to hide the input field
        className="w-[0px] opacity-0 overflow-hidden border-none bg-transparent text-slate-500 focus:outline-hidden focus:ring-0 sm:text-sm absolute right-1 bottom-[6px] sm:bottom-[2px] mr-[10px]"
      />
    </>
  );
}
