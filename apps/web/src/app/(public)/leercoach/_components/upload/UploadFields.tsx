"use client";

// Stateless presentational component: renders the three form fields
// driven by state passed in as a prop. Knows nothing about submission
// or side effects — that lives in useUploadPriorPortfolioForm.
//
// File picker: the native <input type="file"> is hidden; a styled
// button + filename display provides the UI. This avoids two things:
//   1. conflicting UI text when DataTransfer-syncing a dropped file
//      fails (browser chrome showed "Geen bestand gekozen" while
//      React state said the file was picked)
//   2. cross-browser variance in the native input's rendering
// React state is the single source of truth for what's selected.

import type { UploadPriorPortfolioForm } from "./useUploadPriorPortfolioForm";

type Props = {
  form: UploadPriorPortfolioForm;
  /**
   * Unique id prefix so multiple instances of these fields can coexist
   * on a page without label-for collisions.
   */
  idPrefix: string;
};

export function UploadFields({ form, idPrefix }: Props) {
  const disabled = form.isPending;

  function handlePickClick() {
    form.fileInputRef.current?.click();
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">PDF-bestand</span>

        {/* Hidden native input — we drive it via a styled button below
            so the UI doesn't vary by browser and doesn't show conflicting
            text when a dropped file is already in React state. */}
        <input
          ref={form.fileInputRef}
          id={`${idPrefix}-file`}
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          disabled={disabled}
          onChange={(e) => form.setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handlePickClick}
            disabled={disabled}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {form.file ? "Ander bestand kiezen" : "Bestand kiezen"}
          </button>
          {form.file ? (
            <span className="text-sm text-slate-700">
              <span className="font-medium">{form.file.name}</span>{" "}
              <span className="text-slate-500">
                ({Math.round(form.file.size / 1024)} KB)
              </span>
            </span>
          ) : (
            <span className="text-sm text-slate-500">Nog geen bestand</span>
          )}
        </div>
        <p className="text-xs text-slate-500">PDF · max 15 MB</p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${idPrefix}-niveau`}
          className="text-sm font-medium text-slate-700"
        >
          Voor welk niveau was dit portfolio?
        </label>
        <select
          id={`${idPrefix}-niveau`}
          value={form.niveauRang}
          onChange={(e) => form.setNiveauRang(e.target.value)}
          disabled={disabled}
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
          htmlFor={`${idPrefix}-label`}
          className="text-sm font-medium text-slate-700"
        >
          Korte naam (optioneel)
        </label>
        <input
          id={`${idPrefix}-label`}
          type="text"
          value={form.label}
          onChange={(e) => form.setLabel(e.target.value)}
          disabled={disabled}
          placeholder={form.file ? form.file.name.replace(/\.pdf$/i, "") : ""}
          maxLength={80}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
    </>
  );
}
