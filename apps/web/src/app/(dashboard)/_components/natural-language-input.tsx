"use client";

// Credits to: https://dub.co/blog/smart-datetime-picker

import { CalendarDaysIcon } from "@heroicons/react/16/solid";
import { dateTime as dateTimeUtils } from "@nawadi/lib";
import React from "react";
import { Input } from "./input";

export function SmartDatetimePicker({
  name,
  required,
  invalid,
  defaultValue,
  onChange,
}: {
  name: string;
  required?: boolean;
  invalid?: boolean;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
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
            const parsedDateTime = dateTimeUtils.parseDateTimeLanguage(
              e.target.value,
            );
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
        className="right-1 bottom-[6px] sm:bottom-[4px] absolute bg-white p-1.5 rounded-xs text-slate-500 sm:text-sm"
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

          onChange?.(expiryDate);
        }}
        // we intentionally make the datetime-local input field with a width of 1px
        // to hide the input field, but allow for browser form validation
        className="bottom-[6px] sm:bottom-[2px] left-1/2 absolute bg-transparent opacity-0 border-none focus:outline-hidden focus:ring-0 w-[1px] overflow-hidden text-slate-500 sm:text-sm"
      />
    </>
  );
}

export function SmartDatePicker({
  name,
  required,
  invalid,
  defaultValue,
  onChange,
}: {
  name: string;
  required?: boolean;
  invalid?: boolean;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
}) {
  const dateRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [invalidInput, setInvalidInput] = React.useState(false);
  const [dateTime, setDateTime] = React.useState<Date | null>(
    defaultValue ?? null,
  );

  return (
    <>
      <Input
        ref={inputRef}
        type="text"
        placeholder='bv. "over 2 weken" of "morgen"'
        defaultValue={dateTime ? dateTimeUtils.formatDate(dateTime) : ""}
        invalid={invalid || invalidInput}
        onBlur={(e) => {
          // parse the date string when the input field loses focus
          if (e.target.value.length > 0) {
            const parsedDateTime = dateTimeUtils.stripTime(
              dateTimeUtils.parseDateTimeLanguage(e.target.value),
            );

            setInvalidInput(!parsedDateTime);
            if (parsedDateTime) {
              setDateTime(parsedDateTime);
              e.target.value = dateTimeUtils.formatDate(parsedDateTime);
            } else {
              setDateTime(null);
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
        className="right-1 bottom-[6px] sm:bottom-[4px] absolute bg-white p-1.5 rounded-xs text-slate-500 sm:text-sm"
      >
        <CalendarDaysIcon className="size-5 sm:size-4" />
      </button>

      <input
        type="date"
        ref={dateRef}
        step={1}
        tabIndex={-1}
        required={required}
        name={name}
        value={dateTime ? dateTimeUtils.getDateLocal(dateTime) : ""}
        onChange={(e) => {
          const expiryDate = new Date(e.target.value);
          setDateTime(expiryDate);
          // set the formatted date string in the text input field to keep them in sync
          if (inputRef.current) {
            inputRef.current.value = dateTimeUtils.formatDate(expiryDate);
          }

          onChange?.(expiryDate);
        }}
        // we intentionally make the datetime-local input field with a width of 1px
        // to hide the input field, but allow for browser form validation
        className="bottom-[6px] sm:bottom-[2px] left-1/2 absolute bg-transparent opacity-0 border-none focus:outline-hidden focus:ring-0 w-[1px] overflow-hidden text-slate-500 sm:text-sm"
      />
    </>
  );
}

export function SmartTimePicker({
  name,
  required,
  invalid,
  defaultValue,
  onChange,
}: {
  name: string;
  required?: boolean;
  invalid?: boolean;
  defaultValue?: Date;
  onChange?: (date: Date) => void;
}) {
  const dateRef = React.useRef<HTMLInputElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [invalidInput, setInvalidInput] = React.useState(false);
  const [dateTime, setDateTime] = React.useState<Date | null>(
    defaultValue ?? null,
  );

  return (
    <>
      <Input
        ref={inputRef}
        type="text"
        placeholder='bv. "nu" of "over 2 uur"'
        defaultValue={dateTime ? dateTimeUtils.formatTime(dateTime) : ""}
        invalid={invalid || invalidInput}
        onBlur={(e) => {
          // parse the date string when the input field loses focus
          if (e.target.value.length > 0) {
            const parsedDateTime = dateTimeUtils.stripDate(
              dateTimeUtils.parseDateTimeLanguage(e.target.value),
            );

            setInvalidInput(!parsedDateTime);
            if (parsedDateTime) {
              setDateTime(parsedDateTime);
              e.target.value = dateTimeUtils.formatTime(parsedDateTime);
            } else {
              setDateTime(null);
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
        className="right-1 bottom-[6px] sm:bottom-[4px] absolute bg-white p-1.5 rounded-xs text-slate-500 sm:text-sm"
      >
        <CalendarDaysIcon className="size-5 sm:size-4" />
      </button>

      <input
        type="time"
        ref={dateRef}
        step={1}
        tabIndex={-1}
        required={required}
        name={name}
        value={dateTime ? dateTimeUtils.getTimeLocal(dateTime) : ""}
        onChange={(e) => {
          const expiryDate = new Date(
            dateTimeUtils.parseTimeString(e.target.value),
          );
          setDateTime(expiryDate);
          // set the formatted date string in the text input field to keep them in sync
          if (inputRef.current) {
            inputRef.current.value = dateTimeUtils.formatTime(expiryDate);
          }

          onChange?.(expiryDate);
        }}
        // we intentionally make the datetime-local input field with a width of 1px
        // to hide the input field, but allow for browser form validation
        className="bottom-[6px] sm:bottom-[2px] left-1/2 absolute bg-transparent opacity-0 border-none focus:outline-hidden focus:ring-0 w-[1px] overflow-hidden text-slate-500 sm:text-sm"
      />
    </>
  );
}
