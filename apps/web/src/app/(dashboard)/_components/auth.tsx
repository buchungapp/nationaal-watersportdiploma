"use client";

import type { PropsWithChildren } from "react";
import { logout } from "~/app/_actions/auth";
import { DropdownItem } from "./dropdown";

export function LogOutDropdownItem({ children }: PropsWithChildren) {
  return <DropdownItem onClick={async () => logout()}>{children}</DropdownItem>;
}
