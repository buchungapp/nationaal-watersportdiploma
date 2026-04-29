"use client";

import { usePostHog } from "posthog-js/react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import {
  DropdownItem,
  DropdownLabel,
} from "~/app/(dashboard)/_components/dropdown";
import CreateBulkDialog from "./create-bulk-dialog";
import CreateBulkDialogLegacy from "./create-bulk-dialog-legacy";
import CreateSingleDialog from "./create-single-dialog";

const DialogContext = createContext<{
  isOpen: "single" | "bulk" | null;
  setIsOpen: Dispatch<SetStateAction<"single" | "bulk" | null>>;
} | null>(null);

export function DialogWrapper({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<"single" | "bulk" | null>(null);
  const posthog = usePostHog();
  return (
    <DialogContext.Provider
      value={{
        isOpen,
        setIsOpen: (newValue) => {
          posthog.capture("Create Person Dialog Opened", { type: newValue });
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

export function DialogsClient(props: {
  countries: { code: string; name: string }[];
  locationId: string;
  // When the operator-identity-workflow flag is on, render the new
  // dedup-aware bulk dialog. When off, fall back to the legacy
  // stateful flow that ships every row straight through to
  // createPersonsAction. Decided server-side; no client-side fetch.
  useNewBulkImport: boolean;
}) {
  const { isOpen, setIsOpen } = useDialog();
  const { useNewBulkImport, ...sharedProps } = props;

  return (
    <>
      {useNewBulkImport ? (
        <CreateBulkDialog
          {...sharedProps}
          isOpen={isOpen === "bulk"}
          setIsOpen={(next) => {
            setIsOpen(next ? "bulk" : null);
          }}
        />
      ) : (
        <CreateBulkDialogLegacy
          {...sharedProps}
          isOpen={isOpen === "bulk"}
          setIsOpen={(next) => {
            setIsOpen(next ? "bulk" : null);
          }}
        />
      )}
      <CreateSingleDialog
        {...sharedProps}
        isOpen={isOpen === "single"}
        close={() => {
          setIsOpen(null);
        }}
        showDedupHint={useNewBulkImport}
      />
    </>
  );
}
