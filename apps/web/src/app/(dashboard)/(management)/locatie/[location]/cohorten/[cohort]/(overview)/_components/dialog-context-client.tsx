"use client";

import { usePostHog } from "posthog-js/react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import CreateBulkDialog from "./create-bulk-dialog";
import CreateSingleDialog from "./create-single-dialog";

type DialogStates = "single" | "bulk" | null;

const DialogContext = createContext<{
  isOpen: DialogStates;
  setIsOpen: Dispatch<SetStateAction<DialogStates>>;
} | null>(null);

export function DialogWrapper({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<DialogStates>(null);
  const posthog = usePostHog();
  return (
    <DialogContext.Provider
      value={{
        isOpen,
        setIsOpen: (newValue) => {
          posthog.capture("Add Person To Cohort Dialog Opened", {
            type: newValue,
          });
          setIsOpen(newValue);
        },
      }}
    >
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);

  if (!context) {
    throw new Error("useDialog must be used within a DialogWrapper");
  }

  return context;
}

export function DialogButtons() {
  const { setIsOpen } = useDialog();

  return (
    <>
      <DropdownItem onClick={() => setIsOpen("single")}>
        <DropdownLabel>Enkel</DropdownLabel>
      </DropdownItem>
      <DropdownItem onClick={() => setIsOpen("bulk")}>
        <DropdownLabel>Meerdere (bulk)</DropdownLabel>
      </DropdownItem>
    </>
  );
}

export function DialogsClient(props: { locationId: string; cohortId: string }) {
  const { isOpen, setIsOpen } = useDialog();

  return (
    <>
      <CreateBulkDialog
        {...props}
        isOpen={isOpen === "bulk"}
        setIsOpen={(next) => {
          setIsOpen(next ? "bulk" : null);
        }}
      />
      <CreateSingleDialog
        {...props}
        isOpen={isOpen === "single"}
        setIsOpen={(next) => {
          setIsOpen(next ? "single" : null);
        }}
      />
    </>
  );
}
