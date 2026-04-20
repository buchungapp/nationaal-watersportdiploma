"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import type { UploadPriorPortfolioResult } from "../prior-portfolios/actions";
import { UploadFields } from "./upload/UploadFields";
import { UploadResultBanner } from "./upload/UploadResultBanner";
import { useUploadPriorPortfolioForm } from "./upload/useUploadPriorPortfolioForm";

// Thin composer: wraps the upload form in a @headlessui/react Dialog
// and hands the form hook to the presentational field + banner pieces.
// Per Next.js "compose small focused components" guidance:
//   - useUploadPriorPortfolioForm owns state + submission + native-input sync
//   - UploadFields owns the three fields' markup
//   - UploadResultBanner owns the result treatment
//   - THIS file owns the dialog shell + the submit button + close logic
//
// Two consumers today (UploadPriorPortfolioInline for the in-chat
// affordance; PriorPortfolioDropZone for the management page). Both
// call exactly this component — consistency is guaranteed by sharing
// the same hook + children, not by copying markup.

export type PriorPortfolioUploadDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Called after a successful upload — caller composes its follow-up (chat auto-send, toast, revalidate). */
  onSuccess?: (ctx: {
    result: Extract<UploadPriorPortfolioResult, { ok: true }>;
    niveauRang: number | null;
    label: string;
  }) => void;
  /** Pre-populate the file input (e.g. from a drag-drop on the caller). */
  preselectedFile?: File | null;
};

export function PriorPortfolioUploadDialog({
  open,
  onClose,
  onSuccess,
  preselectedFile,
}: PriorPortfolioUploadDialogProps) {
  const form = useUploadPriorPortfolioForm({
    open,
    preselectedFile,
    onSuccess: (ctx) => {
      onSuccess?.(ctx);
      onClose();
    },
  });

  function handleClose() {
    if (form.isPending) return;
    form.reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    form.submit();
  }

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Eerder portfolio uploaden
            </DialogTitle>
            <p className="text-sm text-slate-600">
              De PDF wordt server-side geanonimiseerd (namen, locaties,
              verenigingen, datums worden eruit gehaald) voordat iets
              opgeslagen wordt. Alleen jouw leercoach ziet de inhoud.
            </p>

            <UploadFields form={form} idPrefix="prior-dialog" />
            <UploadResultBanner result={form.result} />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={form.isPending}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuleer
              </button>
              <button
                type="submit"
                disabled={!form.canSubmit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {form.isPending ? "Bezig met verwerken…" : "Upload + anonimiseer"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
