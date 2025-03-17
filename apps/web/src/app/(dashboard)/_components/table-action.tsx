import { XMarkIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import type { PropsWithChildren } from "react";
import { Button } from "./button";
import { Dropdown, DropdownButton, DropdownMenu } from "./dropdown";

export function TableSelection<T>({
  selectedRows,
  clearRowSelection,
  children,
}: PropsWithChildren<{
  selectedRows: number;
  clearRowSelection: () => void;
}>) {
  return (
    <div
      className={clsx(
        "bottom-14 fixed inset-x-0 flex items-center space-x-2 bg-white dark:bg-slate-950 shadow-md mx-auto p-2 border border-slate-200 dark:border-slate-800 rounded-lg w-fit",
        selectedRows > 0 ? "" : "hidden",
      )}
    >
      <p className="text-sm select-none">
        <span className="bg-branding-light/10 px-2 py-1.5 rounded-sm font-medium tabular-nums text-branding-dark">
          {selectedRows}
        </span>
        <span className="ml-2 font-medium text-slate-900 dark:text-slate-50">
          geselecteerd
        </span>
      </p>
      <div className="flex items-center space-x-4">
        <Button plain onClick={clearRowSelection}>
          <XMarkIcon />
        </Button>
        {children}
      </div>
    </div>
  );
}

export function TableSelectionButton({
  children,
  label = "Bulk actie",
}: PropsWithChildren<{ label?: string }>) {
  return (
    <Dropdown>
      <DropdownButton aria-label={label}>{label}</DropdownButton>
      <DropdownMenu anchor="top">{children}</DropdownMenu>
    </Dropdown>
  );
}
