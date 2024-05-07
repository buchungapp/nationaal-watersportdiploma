"use client";

import {
  Popover as HeadlessPopover,
  PopoverButton as HeadlessPopoverButton,
  PopoverPanel as HeadlessPopoverPanel,
  Transition as HeadlessTransition,
  type PopoverPanelProps as HeadlessPopoverPanelProps,
  type PopoverProps as HeadlessPopoverProps,
} from "@headlessui/react";
import clsx from "clsx";
import React, { Fragment } from "react";
import { Button } from "./button";

export { HeadlessPopoverButton };

/****************************************************************
 * TODO: this popover is temporary used should be from catalyst
 ****************************************************************/

export function Popover(props: HeadlessPopoverProps) {
  return <HeadlessPopover {...props} />;
}

export function PopoverButton<T extends React.ElementType = typeof Button>(
  props: React.ComponentProps<typeof HeadlessPopoverButton<T>>,
) {
  return <HeadlessPopoverButton as={Button} {...props} />;
}

export function PopoverPanel({
  anchor = "bottom",
  ...props
}: HeadlessPopoverPanelProps) {
  return (
    <HeadlessTransition
      as={Fragment}
      leave="duration-100 ease-in"
      leaveTo="opacity-0"
    >
      <HeadlessPopoverPanel
        {...props}
        anchor={anchor}
        className={clsx(
          props.className,

          // Anchor positioning
          "[--anchor-gap:theme(spacing.2)] [--anchor-padding:theme(spacing.3)] data-[anchor~=end]:[--anchor-offset:4px] data-[anchor~=start]:[--anchor-offset:-4px]",

          // Base styles
          "isolate w-max rounded-xl p-1",

          // Invisible border that is only visible in `forced-colors` mode for accessibility purposes
          "outline outline-1 outline-transparent focus:outline-none",

          // Handle scrolling when menu won't fit in viewport
          "overflow-y-auto",

          // Popover background
          "bg-white/75 backdrop-blur-xl dark:bg-zinc-800/75",

          // Shadows
          "shadow-lg ring-1 ring-zinc-950/10 dark:ring-inset dark:ring-white/10",
        )}
      />
    </HeadlessTransition>
  );
}
