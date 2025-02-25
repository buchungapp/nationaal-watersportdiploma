"use client";
import {
  type PropsWithChildren,
  createContext,
  useContext,
  useState,
} from "react";

interface DialogContextValue {
  openDialog: string | null;
  setOpenDialog: (openDialog: string | null) => void;
}

const DialogContext = createContext<DialogContextValue>(
  {} as DialogContextValue,
);

export function DialogProvider({ children }: PropsWithChildren) {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  return (
    <DialogContext.Provider value={{ openDialog, setOpenDialog }}>
      {children}
    </DialogContext.Provider>
  );
}

export function useDialog(name: string) {
  const context = useContext(DialogContext);
  if (context === undefined) {
    throw new Error("useDialog must be used within a DialogProvider");
  }

  function open() {
    context.setOpenDialog(name);
  }

  function close() {
    context.setOpenDialog(null);
  }

  return {
    isOpen: context.openDialog === name,
    open,
    close,
  };
}
