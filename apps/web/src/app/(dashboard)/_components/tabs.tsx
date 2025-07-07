"use client";

import * as Headless from "@headlessui/react";
import { clsx } from "clsx";

// TODO: style these components, find a way to make them work with URL state

export function TabGroup({ children, ...props }: Headless.TabGroupProps) {
  return <Headless.TabGroup {...props}>{children}</Headless.TabGroup>;
}

export function TabList({ children, ...props }: Headless.TabListProps) {
  return (
    <Headless.TabList
      {...props}
      className={clsx(
        "flex sm:flex-row flex-col gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg w-full",
        props.className,
      )}
    >
      {children}
    </Headless.TabList>
  );
}

export function Tab({ children, ...props }: Headless.TabProps) {
  return (
    <Headless.Tab
      {...props}
      className={clsx(
        props.className,
        "inline-flex items-center justify-center gap-1.5",
        "flex-1 px-3 py-2 rounded-md font-medium text-sm transition-colors group/tab text-left sm:text-center",
        "focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-branding-light",
        "data-selected:bg-white data-selected:text-zinc-900 data-selected:shadow-sm data-selected:dark:bg-zinc-700 data-selected:dark:text-white",
        "text-zinc-600 hover:bg-white/50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-700/50 dark:hover:text-white",
      )}
    >
      {children}
    </Headless.Tab>
  );
}

export function TabPanels({ children, ...props }: Headless.TabPanelsProps) {
  return <Headless.TabPanels {...props}>{children}</Headless.TabPanels>;
}

export function TabPanel({ children, ...props }: Headless.TabPanelProps) {
  return <Headless.TabPanel {...props}>{children}</Headless.TabPanel>;
}
