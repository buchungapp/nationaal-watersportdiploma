"use client";

import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxInput as HeadlessComboboxInput,
  ComboboxOption as HeadlessComboboxOption,
  ComboboxOptions as HeadlessComboboxOptions,
  type ComboboxInputProps as HeadlessComboboxInputProps,
  type ComboboxOptionProps as HeadlessComboboxOptionProps,
  type ComboboxOptionsProps as HeadlessComboboxOptionsProps,
  type ComboboxProps as HeadlessComboboxProps,
} from "@headlessui/react";
import clsx from "clsx";
import type { Fragment } from "react";
import { useEffect, useState } from "react";

/****************************************************************
 * TODO: this combobox is temporary used should be from catalyst
 ****************************************************************/

export function Combobox<T>({
  className,
  placeholder,
  autoFocus,
  "aria-label": ariaLabel,
  children: options,
  onChange: theirOnChange,
  value: theirValue,
  displayValue,
  setQuery,
  invalid,
  ...props
}: {
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  children?: HeadlessComboboxOptionsProps["children"];
  setQuery?: (query: string) => void;
  invalid?: boolean;
} & Omit<HeadlessComboboxProps<T | null, false, typeof Fragment>, "multiple"> &
  Pick<HeadlessComboboxInputProps<typeof Fragment, T | null>, "displayValue">) {
  const [value, setValue] = useState<T | null>(theirValue ?? null);

  useEffect(() => {
    setValue(theirValue ?? null);
  }, [theirValue]);

  return (
    <HeadlessCombobox
      {...props}
      value={value}
      immediate
      onChange={(value) => {
        setQuery && setQuery("");
        setValue(value);
        theirOnChange?.(value);
      }}
      onClose={() => setQuery && setQuery("")}
      multiple={false}
    >
      <div
        className={clsx([
          className,

          // Basic layout
          "group mt-3 relative block w-full",

          // Background color + shadow applied to inset pseudo element, so shadow blends with border in light mode
          "before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow",

          // Background color is moved to control and shadow is removed in dark mode so hide `before` pseudo
          "dark:before:hidden",

          // Hide default focus styles
          "focus:outline-none",

          // Focus ring
          "after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent sm:after:data-[focus]:ring-2 sm:after:data-[focus]:ring-blue-500",

          // Disabled state
          "data-[disabled]:opacity-50 before:data-[disabled]:bg-zinc-950/5 before:data-[disabled]:shadow-none",
        ])}
      >
        <HeadlessComboboxInput
          autoFocus={autoFocus}
          data-slot="control"
          aria-label={ariaLabel}
          {...(invalid && { "data-invalid": true })}
          displayValue={displayValue}
          placeholder={placeholder}
          onChange={(e) => setQuery && setQuery(e.target.value)}
          onBlur={() => setQuery && setQuery("")}
          className={clsx([
            // Basic layout
            "relative block w-full appearance-none rounded-lg py-[calc(theme(spacing[2.5])-1px)] sm:py-[calc(theme(spacing[1.5])-1px)]",

            // Set minimum height for when no value is selected
            "min-h-11 sm:min-h-9",

            // Horizontal padding
            "pl-[calc(theme(spacing[3.5])-1px)] pr-[calc(theme(spacing.7)-1px)] sm:pl-[calc(theme(spacing.3)-1px)]",

            // Typography
            "text-left text-base/6 text-zinc-950 placeholder:text-zinc-500 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",

            // Border
            "border border-zinc-950/10 group-data-[active]:border-zinc-950/20 group-data-[hover]:border-zinc-950/20 dark:border-white/10 dark:group-data-[active]:border-white/20 dark:group-data-[hover]:border-white/20",

            // Background color
            "bg-transparent dark:bg-white/5",

            // Invalid state
            "group-data-[invalid]:border-red-500 group-data-[invalid]:group-data-[hover]:border-red-500 group-data-[invalid]:dark:border-red-600 group-data-[invalid]:data-[hover]:dark:border-red-600",

            // Disabled state
            "group-data-[disabled]:border-zinc-950/20 group-data-[disabled]:opacity-100 group-data-[disabled]:dark:border-white/15 group-data-[disabled]:dark:bg-white/[2.5%] dark:data-[hover]:group-data-[disabled]:border-white/15",
          ])}
        />
        <HeadlessComboboxButton
          className={
            "absolute inset-y-0 right-0 flex items-center rounded-r-md px-2 focus:outline-none"
          }
        >
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
            <svg
              className="size-5 stroke-zinc-500 group-data-[disabled]:stroke-zinc-600 sm:size-4 dark:stroke-zinc-400 forced-colors:stroke-[CanvasText]"
              viewBox="0 0 16 16"
              aria-hidden="true"
              fill="none"
            >
              <path
                d="M5.75 10.75L8 13L10.25 10.75"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M10.25 5.25L8 3L5.75 5.25"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </HeadlessComboboxButton>

        <HeadlessComboboxOptions
          as="div"
          anchor={{
            to: "bottom start",
            gap: "var(--anchor-gap)",
            offset: "var(--anchor-offset)",
            padding: "var(--anchor-padding)",
          }}
          className={clsx(
            // Anchor positioning
            "[--anchor-offset:-1.625rem] [--anchor-padding:theme(spacing.4)] sm:[--anchor-offset:-1.375rem]",

            // Base styles
            "isolate w-max min-w-[calc(var(--button-width)+var(--input-width)+1.75rem)] empty:invisible border-0 select-none scroll-py-1 rounded-xl p-1",

            // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
            "outline outline-1 outline-transparent focus:outline-none",

            // Handle scrolling when menu won't fit in viewport
            "overflow-y-scroll overscroll-contain",

            // Popover background
            "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

            // Shadows
            "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",

            // Transitions
            "transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0",
          )}
        >
          {options}
        </HeadlessComboboxOptions>
      </div>
    </HeadlessCombobox>
  );
}

export function ComboboxOption<T>({
  children,
  className,
  ...props
}: { children?: React.ReactNode } & HeadlessComboboxOptionProps<"div", T>) {
  const sharedClasses = clsx(
    // Base
    "flex min-w-0 items-center",

    // Icons
    "[&>[data-slot=icon]]:size-5 [&>[data-slot=icon]]:shrink-0 [&>[data-slot=icon]]:text-zinc-500 [&>[data-slot=icon]]:group-data-[focus]/option:text-white sm:[&>[data-slot=icon]]:size-4 forced-colors:[&>[data-slot=icon]]:text-[CanvasText] forced-colors:[&>[data-slot=icon]]:group-data-[focus]/option:text-[Canvas]",

    // Avatars
    "[&>[data-slot=avatar]]:size-6 sm:[&>[data-slot=avatar]]:size-5",
  );

  return (
    <HeadlessComboboxOption
      as="div"
      {...props}
      className={clsx(
        // Basic layout
        "group/option w-full grid cursor-default grid-cols-[theme(spacing.5),1fr] items-baseline gap-x-2 rounded-lg py-2.5 pl-2 pr-3.5 sm:grid-cols-[theme(spacing.4),1fr] sm:py-1.5 sm:pl-1.5 sm:pr-3",
        // Typography
        "text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white forced-colors:text-[CanvasText]",

        // Focus
        "outline-none data-[focus]:bg-blue-500 data-[focus]:text-white",

        // Forced colors mode
        "forced-color-adjust-none forced-colors:data-[focus]:bg-[Highlight] forced-colors:data-[focus]:text-[HighlightText]",

        // Disabled
        "data-[disabled]:opacity-50",
      )}
    >
      <svg
        className="relative hidden size-5 self-center stroke-current group-data-[selected]/option:inline sm:size-4"
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M4 8.5l3 3L12 4"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={clsx(className, sharedClasses, "col-start-2")}>
        {children}
      </span>
    </HeadlessComboboxOption>
  );
}

export function ComboboxLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={clsx(
        className,
        "ml-2.5 truncate first:ml-0 sm:ml-2 sm:first:ml-0",
      )}
      {...props}
    />
  );
}

export function ComboboxDescription({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<"span">) {
  return (
    <span
      className={clsx(
        className,
        "flex flex-1 overflow-hidden text-zinc-500 before:w-2 before:min-w-0 before:shrink group-data-[focus]/option:text-white dark:text-zinc-400",
      )}
      {...props}
    >
      <span className="flex-1 truncate">{children}</span>
    </span>
  );
}
