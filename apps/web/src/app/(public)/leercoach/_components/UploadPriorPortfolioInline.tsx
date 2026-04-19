"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { useState, useTransition } from "react";
import {
  type UploadPriorPortfolioResult,
  uploadPriorPortfolioAction,
} from "../prior-portfolios/actions";

// Inline upload affordance rendered inside the chat (via AiChatWindow's
// slotAboveInput prop). Opens a lightweight dialog with the upload form,
// runs the extract + anonymize + ingest pipeline server-side, and on
// success auto-sends a confirmation message into the chat so the
// leercoach knows the portfolio is now available.
//
// Server action is shared with /leercoach/prior-portfolios (the list-
// management surface) — same pipeline, same validation.

type Props = {
  disabled?: boolean;
  onAfterUpload: (confirmationMessage: string) => void;
};

export function UploadPriorPortfolioInline({
  disabled,
  onAfterUpload,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 text-xs text-slate-600">
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span aria-hidden="true">📎</span>
          <span>Eerder portfolio uploaden</span>
        </button>
        <span className="text-slate-500">
          — geanonimiseerd opgeslagen, alleen jouw leercoach ziet het.
        </span>
      </div>

      <UploadDialog
        open={open}
        onClose={() => setOpen(false)}
        onAfterUpload={(msg) => {
          setOpen(false);
          onAfterUpload(msg);
        }}
      />
    </>
  );
}

function UploadDialog({
  open,
  onClose,
  onAfterUpload,
}: {
  open: boolean;
  onClose: () => void;
  onAfterUpload: (msg: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [niveauRang, setNiveauRang] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadPriorPortfolioResult | null>(null);

  function resetAndClose() {
    setFile(null);
    setLabel("");
    setNiveauRang("");
    setResult(null);
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        const niveauLabel = niveauRang
          ? `niveau-${niveauRang} `
          : "";
        const message = r.alreadyIngested
          ? `Ik heb mijn ${niveauLabel}portfolio geüpload — maar ik zie dat dezelfde versie er al stond, dus niets nieuws toegevoegd.`
          : `Ik heb zojuist mijn ${niveauLabel}portfolio geüpload (${r.pageCount} pagina's, ${r.chunkCount} fragmenten). Neem even de tijd om erin te kijken, dan kunnen we daarna bespreken hoe we dit gebruiken.`;
        // Brief pause so the user sees the success state before the
        // dialog closes + message fires.
        setTimeout(() => {
          onAfterUpload(message);
        }, 700);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isPending) resetAndClose();
      }}
      className="relative z-50"
    >
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4 p-6"
          >
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Eerder portfolio uploaden
            </DialogTitle>
            <p className="text-sm text-slate-600">
              De PDF wordt server-side geanonimiseerd (namen, locaties,
              verenigingen, datums worden eruit gehaald) voordat iets
              opgeslagen wordt. Alleen jouw leercoach ziet de inhoud.
            </p>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="inline-prior-file"
                className="text-sm font-medium text-slate-700"
              >
                PDF-bestand
              </label>
              <input
                id="inline-prior-file"
                name="file"
                type="file"
                accept="application/pdf,.pdf"
                required
                disabled={isPending}
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">Max 15 MB.</p>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="inline-prior-niveau"
                className="text-sm font-medium text-slate-700"
              >
                Voor welk niveau was dit portfolio?
              </label>
              <select
                id="inline-prior-niveau"
                value={niveauRang}
                onChange={(e) => setNiveauRang(e.target.value)}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">— kies niveau —</option>
                <option value="2">Niveau 2</option>
                <option value="3">Niveau 3</option>
                <option value="4">Niveau 4</option>
                <option value="5">Niveau 5</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="inline-prior-label"
                className="text-sm font-medium text-slate-700"
              >
                Korte naam (optioneel)
              </label>
              <input
                id="inline-prior-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isPending}
                placeholder={file ? file.name.replace(/\.pdf$/i, "") : ""}
                maxLength={80}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            {result ? (
              <div
                className={`rounded-lg border p-3 text-sm ${
                  result.ok
                    ? "border-green-300 bg-green-50 text-green-900"
                    : "border-red-300 bg-red-50 text-red-900"
                }`}
              >
                {result.ok ? (
                  <p className="font-semibold">
                    {result.alreadyIngested
                      ? "Deze versie stond er al."
                      : `Succes: ${result.chunkCount} fragmenten opgenomen.`}
                  </p>
                ) : (
                  <p>
                    <span className="font-semibold">Mislukt:</span>{" "}
                    {result.reason}
                  </p>
                )}
              </div>
            ) : null}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetAndClose}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuleer
              </button>
              <button
                type="submit"
                disabled={!file || isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Bezig met verwerken…" : "Upload + anonimiseer"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
