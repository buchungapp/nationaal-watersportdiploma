"use client";

import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { DropdownItem } from "~/app/(dashboard)/_components/dropdown";
import CreateBulkDialog from "./create-bulk-dialog";
import CreateSingleDialog from "./create-single-dialog";

const DialogContext = createContext<{
  isOpen: "single" | "bulk" | null;
  setIsOpen: Dispatch<SetStateAction<"single" | "bulk" | null>>;
}>({
  isOpen: null,
  setIsOpen: () => {},
});

export function DialogWrapper({ children }: PropsWithChildren) {
  const [isOpen, setIsOpen] = useState<"single" | "bulk" | null>(null);

  return (
    <DialogContext.Provider value={{ isOpen, setIsOpen }}>
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

export function Dialogs(props: {
  countries: { code: string; name: string }[];
  locationId: string;
}) {
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
