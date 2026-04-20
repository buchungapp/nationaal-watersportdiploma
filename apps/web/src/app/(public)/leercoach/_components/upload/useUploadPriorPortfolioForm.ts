"use client";

// Hook: all state + side effects for the prior-portfolio upload form.
//
// Kept separate from the render layer so:
//   - the dialog, a future inline form, or an imperative call-site can
//     consume the same state machine
//   - state mutations + side effects are testable without mounting JSX
//   - the render components are small and purely presentational
//
// Follows the Next.js composition-patterns guidance: custom hooks for
// reusable logic, `"use client"` only where interactive state lives.

import { useEffect, useRef, useState, useTransition } from "react";
import {
  type UploadPriorPortfolioResult,
  uploadPriorPortfolioAction,
} from "../../prior-portfolios/actions";

export type UploadPriorPortfolioForm = ReturnType<
  typeof useUploadPriorPortfolioForm
>;

export type UseUploadPriorPortfolioFormOptions = {
  /** Open state — controls the "seed preselectedFile" effect timing. */
  open: boolean;
  /** Seed the file input from a drag-drop event on a parent component. */
  preselectedFile?: File | null;
  /** Called after a successful upload, with the server result. */
  onSuccess?: (ctx: {
    result: Extract<UploadPriorPortfolioResult, { ok: true }>;
    niveauRang: number | null;
    label: string;
  }) => void;
};

export function useUploadPriorPortfolioForm({
  open,
  preselectedFile,
  onSuccess,
}: UseUploadPriorPortfolioFormOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [niveauRang, setNiveauRang] = useState<string>("");
  const [result, setResult] = useState<UploadPriorPortfolioResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When the dialog opens with a preselected file (drop-zone path),
  // sync both React state AND the native <input type="file"> via
  // DataTransfer. Without the native sync, the browser's `required`
  // validation sees an empty FileList on submit and shows a "Geen
  // bestand gekozen" tooltip even though React state is correct.
  useEffect(() => {
    if (open && preselectedFile) {
      setFile(preselectedFile);
      if (fileInputRef.current) {
        try {
          const dt = new DataTransfer();
          dt.items.add(preselectedFile);
          fileInputRef.current.files = dt.files;
        } catch {
          // DataTransfer can throw in jsdom or very old browsers.
          // React state is the source of truth for submission; native
          // validation falls back to a manual re-pick in that case.
        }
      }
    }
  }, [open, preselectedFile]);

  function reset() {
    setFile(null);
    setLabel("");
    setNiveauRang("");
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function submit() {
    if (!file) return;
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    if (label.trim()) formData.append("label", label.trim());
    if (niveauRang) formData.append("niveauRang", niveauRang);
    startTransition(async () => {
      const r = await uploadPriorPortfolioAction(formData);
      setResult(r);
      if (r.ok) {
        const niveauAsNumber = niveauRang ? Number(niveauRang) : null;
        // Brief pause so the success banner is visible before callers
        // tear down (e.g. close the dialog + send a chat message).
        setTimeout(() => {
          onSuccess?.({
            result: r,
            niveauRang: niveauAsNumber,
            label: label.trim(),
          });
          reset();
        }, 700);
      }
    });
  }

  const canSubmit = file !== null && !isPending;

  return {
    // state
    file,
    label,
    niveauRang,
    result,
    isPending,
    canSubmit,
    // setters (single field each; presentational components wire these
    // to their inputs directly)
    setFile,
    setLabel,
    setNiveauRang,
    // refs
    fileInputRef,
    // actions
    submit,
    reset,
  };
}
