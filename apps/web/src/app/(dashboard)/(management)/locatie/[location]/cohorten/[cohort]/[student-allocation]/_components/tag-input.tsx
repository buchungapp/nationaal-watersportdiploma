"use client";

import { Fragment, useState } from "react";

import {
  Combobox as HeadlessCombobox,
  ComboboxButton as HeadlessComboboxButton,
  ComboboxInput as HeadlessComboboxInput,
  ComboboxOptions as HeadlessComboboxOptions,
  Transition as HeadlessTransition,
} from "@headlessui/react";
import clsx from "clsx";

export function AllocationTags() {
  // states
  const [selectedTags, setSelectedTags] = useState([]);
  const [query, setQuery] = useState("");

  return (
    <HeadlessCombobox
      value={selectedTags}
      onChange={setSelectedTags}
      onClose={() => setQuery("")}
      multiple={true}
    >
      <div
        className={clsx([
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
          data-slot="control"
          aria-label="Tags"
          onChange={(event) => setQuery(event.target.value)}
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

        <HeadlessTransition
          as={Fragment}
          leave="transition-opacity duration-100 ease-in pointer-events-none"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
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
              "isolate w-max min-w-[calc(var(--button-width)+var(--input-width)+1.75rem)] empty:hidden select-none scroll-py-1 rounded-xl p-1",

              // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
              "outline outline-1 outline-transparent focus:outline-none",

              // Handle scrolling when menu won't fit in viewport
              "overflow-y-scroll overscroll-contain",

              // Popover background
              "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

              // Shadows
              "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",
            )}
          >
            {null}
          </HeadlessComboboxOptions>
        </HeadlessTransition>
      </div>
    </HeadlessCombobox>
  );
}
