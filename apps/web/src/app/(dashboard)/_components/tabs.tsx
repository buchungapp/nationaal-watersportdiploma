import * as Headless from "@headlessui/react";
import type { PropsWithChildren } from "react";

// TODO: style these components, find a way to make them work with URL state

export function TabGroup({ children }: PropsWithChildren) {
  return <Headless.TabGroup>{children}</Headless.TabGroup>;
}

export function TabList({ children }: PropsWithChildren) {
  return <Headless.TabList>{children}</Headless.TabList>;
}

export function Tab({ children }: PropsWithChildren) {
  return <Headless.Tab>{children}</Headless.Tab>;
}

export function TabPanels({ children }: PropsWithChildren) {
  return <Headless.TabPanels>{children}</Headless.TabPanels>;
}

export function TabPanel({ children }: PropsWithChildren) {
  return <Headless.TabPanel>{children}</Headless.TabPanel>;
}
