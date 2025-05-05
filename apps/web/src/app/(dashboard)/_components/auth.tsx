"use client";

import { useAction } from "next-safe-action/hooks";
import type { PropsWithChildren } from "react";
import { toast } from "sonner";
import { logoutAction } from "~/actions/auth/logout-action";
import { DropdownItem } from "./dropdown";

export function LogOutDropdownItem({ children }: PropsWithChildren) {
  const { execute } = useAction(logoutAction, {
    onError: () => {
      toast.error("Er is iets misgegaan bij het afmelden.");
    },
  });

  return <DropdownItem onClick={() => execute()}>{children}</DropdownItem>;
}
