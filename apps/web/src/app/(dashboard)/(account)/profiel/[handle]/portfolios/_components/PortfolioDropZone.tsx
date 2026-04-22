"use client";

import { useState } from "react";
import { PortfolioUploadDialog } from "./PortfolioUploadDialog";
import type { ProfielOption } from "./upload/useUploadPortfolioForm";

// Drop-zone + click-to-upload affordance on the management page.
// Opens the shared PortfolioUploadDialog with a dropped/selected
// file pre-populated so the user only has to pick a profiel + confirm.
//
// This is the SECONDARY upload entry point. Primary is in-chat via
// UploadPortfolioInline; this page is for users who want to
// manage their existing uploads or upload without starting a chat.

type Props = {
  handle: string;
  profielen: ProfielOption[];
  /** True when the user has at least one prior uploaded; we show a slim banner instead of a big dashed zone. */
  hasExistingUploads: boolean;
};

export function PortfolioDropZone({
  handle,
  profielen,
  hasExistingUploads,
}: Props) {
  const [dragActive, setDragActive] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [preselectedFile, setPreselectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | File[]) {
    setError(null);
    const arr = Array.from(files);
    if (arr.length === 0) return;
    // Only first file — if they dropped multiple, take the first PDF.
    const file =
      arr.find((f) => f.name.toLowerCase().endsWith(".pdf")) ?? arr[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setError("Alleen PDF-bestanden ondersteund.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError(
        `Bestand is te groot (${Math.round(file.size / 1024 / 1024)}MB). Max 15MB.`,
      );
      return;
    }
    setPreselectedFile(file);
    setDialogOpen(true);
  }

  function openPickerDirectly() {
    // Synthesize a hidden file input click so the native picker opens
    // without us rendering a separate <input>.
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf,.pdf";
    input.onchange = () => {
      if (input.files) handleFiles(input.files);
    };
    input.click();
  }

  return (
    <>
      {hasExistingUploads ? (
        <BannerDropZone
          dragActive={dragActive}
          setDragActive={setDragActive}
          onFiles={handleFiles}
          onClick={openPickerDirectly}
        />
      ) : (
        <EmptyDropZone
          dragActive={dragActive}
          setDragActive={setDragActive}
          onFiles={handleFiles}
          onClick={openPickerDirectly}
        />
      )}

      {error ? (
        <p className="mt-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <PortfolioUploadDialog
        handle={handle}
        profielen={profielen}
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setPreselectedFile(null);
        }}
        preselectedFile={preselectedFile}
      />
    </>
  );
}

type ZoneProps = {
  dragActive: boolean;
  setDragActive: (v: boolean) => void;
  onFiles: (files: FileList | File[]) => void;
  onClick: () => void;
};

function EmptyDropZone({
  dragActive,
  setDragActive,
  onFiles,
  onClick,
}: ZoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer?.files) onFiles(e.dataTransfer.files);
      }}
      className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
        dragActive
          ? "border-blue-400 bg-blue-50 text-blue-900"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
      }`}
    >
      <span className="text-3xl" aria-hidden="true">
        📎
      </span>
      <p className="font-semibold text-slate-900">
        Sleep hier een PDF, of klik om te kiezen
      </p>
      <p className="text-sm text-slate-600">
        Heb je een eerder PvB-portfolio liggen? Upload hem hier en je leercoach
        kan er tijdens sessies naar verwijzen.
      </p>
      <p className="text-xs text-slate-500">
        PDF · max 15 MB · wordt server-side geanonimiseerd voor opslag
      </p>
    </button>
  );
}

function BannerDropZone({
  dragActive,
  setDragActive,
  onFiles,
  onClick,
}: ZoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragEnter={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setDragActive(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer?.files) onFiles(e.dataTransfer.files);
      }}
      className={`flex w-full items-center gap-3 rounded-xl border-2 border-dashed p-4 text-left transition-colors ${
        dragActive
          ? "border-blue-400 bg-blue-50 text-blue-900"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/50"
      }`}
    >
      <span className="text-2xl" aria-hidden="true">
        📎
      </span>
      <div className="flex flex-col">
        <span className="font-semibold text-slate-900">
          Extra portfolio toevoegen
        </span>
        <span className="text-xs text-slate-600">
          Sleep een PDF hierop of klik om te kiezen.
        </span>
      </div>
    </button>
  );
}
