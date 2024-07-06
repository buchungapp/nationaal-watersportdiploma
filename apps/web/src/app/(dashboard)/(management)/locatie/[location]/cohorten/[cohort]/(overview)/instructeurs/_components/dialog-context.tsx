"use client";

import { usePostHog } from "posthog-js/react";
import type { Dispatch, PropsWithChildren, SetStateAction } from "react";
import { createContext, useContext, useState } from "react";
import { DropdownItem } from "~/app/(dashboard)/_components/dropdown";
// import CreateBulkDialog from "./create-bulk-dialog";
// import CreateSingleDialog from "./create-single-dialog";

type DialogStates = "single" | "bulk" | null;

const DialogContext = createContext<{
  isOpen: DialogStates;
  setIsOpen: Dispatch<SetStateAction<DialogStates>>;
}>({
  isOpen: null,
  //   eslint-disable-next-line @typescript-eslint/no-empty-function
  setIsOpen: () => {},
});

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
  return useContext(DialogContext);
}

export function DialogButtons() {
  const { setIsOpen } = useDialog();

  return (
    <>
      <DropdownItem onClick={() => setIsOpen("single")}>Enkel</DropdownItem>
      <DropdownItem onClick={() => setIsOpen("bulk")}>
        Meerdere (bulk)
      </DropdownItem>
    </>
  );
}

export function Dialogs(props: { locationId: string; cohortId: string }) {
  const { isOpen, setIsOpen } = useDialog();

  return (
    <>
      {/* <CreateBulkDialog
        {...props}
        isOpen={isOpen === "bulk"}
        setIsOpen={(next) => {
          setIsOpen(next ? "bulk" : null);
        }}
      /> */}
      {/* <CreateSingleDialog
        {...props}
        isOpen={isOpen === "single"}
        setIsOpen={(next) => {
          setIsOpen(next ? "single" : null);
        }}
      /> */}
    </>
  );
}
