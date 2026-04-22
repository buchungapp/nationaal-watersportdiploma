"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useRouter } from "next/navigation";
import { UploadFields } from "./upload/UploadFields";
import { UploadResultBanner } from "./upload/UploadResultBanner";
import {
  type ProfielOption,
  type UploadSuccessCtx,
  useUploadPortfolioForm,
} from "./upload/useUploadPortfolioForm";

// Thin composer: wraps the upload form in a @headlessui/react Dialog
// and hands the form hook to the presentational field + banner pieces.
// Per Next.js "compose small focused components" guidance:
//   - useUploadPortfolioForm owns state + submission + native-input sync
//   - UploadFields owns the three fields' markup
//   - UploadResultBanner owns the result treatment
//   - THIS file owns the dialog shell + the submit button + close logic
//
// Two consumers today (UploadPortfolioInline for the in-chat
// affordance; PortfolioDropZone for the management page). Both
// call exactly this component — consistency is guaranteed by sharing
// the same hook + children, not by copying markup.

export type PortfolioUploadDialogProps = {
  /** Person handle for revalidate + cache-tag context. */
  handle: string;
  open: boolean;
  onClose: () => void;
  /**
   * Called after the async workflow completes successfully — caller
   * composes its follow-up (chat auto-send, toast, revalidate). Not
   * called on failure; consumers can read `form.state.kind === "failed"`
   * if they need to react.
   */
  onSuccess?: (ctx: UploadSuccessCtx) => void;
  /** Pre-populate the file input (e.g. from a drag-drop on the caller). */
  preselectedFile?: File | null;
  /** Full list of kwalificatieprofielen for the scope picker. */
  profielen: ProfielOption[];
  /** Pre-select this profielId when the dialog opens (e.g. current chat's profielId). */
  defaultProfielId?: string | null;
};

export function PortfolioUploadDialog({
  handle,
  open,
  onClose,
  onSuccess,
  preselectedFile,
  profielen,
  defaultProfielId,
}: PortfolioUploadDialogProps) {
  const router = useRouter();
  const form = useUploadPortfolioForm({
    open,
    handle,
    profielen,
    defaultProfielId,
    preselectedFile,
    onSuccess: (ctx) => {
      onSuccess?.(ctx);
      // Clear form state after a successful upload. Both consumers
      // (PortfolioUpload.Provider + PortfolioDropZone) keep the dialog
      // always-mounted via the `open` prop pattern, so without an
      // explicit reset the next reopen would show stale banner + the
      // previous file/profiel selection (bugbot finding).
      form.reset();
      // Belt-and-braces cache refresh. The workflow's mark-ready step
      // calls `revalidatePath`, but that runs inside a QStash webhook
      // callback — bugbot flagged this as potentially flaky because
      // Upstash's SDK wraps the request in its own signature/replay
      // handling, which may or may not play nicely with Next.js's
      // internal cache-invalidation plumbing. `router.refresh()` here
      // forces the current route segment to re-fetch on the client's
      // side, so even if the workflow's revalidate silently degraded,
      // the user's immediate view of /profiel/:handle/portfolios is
      // fresh.
      router.refresh();
      onClose();
    },
  });

  // `isWorkflowRunning` lives on the form hook now (true during the
  // useTransition action AND the SWR-driven polling phase). We read
  // it here to gate the close affordance so the onSuccess callback
  // can't be dropped by an early reset.
  const { isWorkflowRunning } = form;

  function handleClose() {
    if (isWorkflowRunning) return;
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
              verenigingen, datums worden eruit gehaald) voordat iets opgeslagen
              wordt. Alleen jij ziet de geanonimiseerde tekst; de digitale
              leercoach gebruikt ’m als context in jouw sessies. Een menselijke
              leercoach, instructeur of beoordelaar heeft géén toegang.
            </p>

            <UploadFields form={form} idPrefix="prior-dialog" />
            <UploadResultBanner state={form.state} />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isWorkflowRunning}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuleer
              </button>
              <button
                type="submit"
                disabled={!form.canSubmit}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isWorkflowRunning
                  ? "Bezig met verwerken…"
                  : "Upload + anonimiseer"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
