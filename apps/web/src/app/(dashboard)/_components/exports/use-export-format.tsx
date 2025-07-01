"use client";
import { type ReactNode, createContext, useContext, useState } from "react";
import type { ExportFormat } from "~/lib/export";

/* Hook */
function useExportFormatInternal() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>("xlsx");

  return {
    selectedFormat,
    setSelectedFormat,
  };
}

/* Context */
interface ExportFormatContextType {
  selectedFormat: ExportFormat;
  setSelectedFormat: (format: ExportFormat) => void;
}

const ExportFormatContext = createContext<ExportFormatContextType | null>(null);

interface ExportFormatProviderProps {
  children: ReactNode;
}

export function ExportFormatProvider({ children }: ExportFormatProviderProps) {
  const exportFormat = useExportFormatInternal();

  return (
    <ExportFormatContext.Provider value={exportFormat}>
      {children}
    </ExportFormatContext.Provider>
  );
}

export function useExportFormat() {
  const context = useContext(ExportFormatContext);
  if (!context) {
    throw new Error(
      "useExportFormat must be used within an ExportFormatProvider",
    );
  }
  return context;
}
