"use client";

// Stateless presentational component: renders the three form fields
// driven by state passed in as a prop. Knows nothing about submission
// or side effects — that lives in useUploadPriorPortfolioForm. This
// split keeps the render layer small + trivially re-usable, per the
// Next.js "compose small focused components" guidance.

import type { UploadPriorPortfolioForm } from "./useUploadPriorPortfolioForm";

type Props = {
  form: UploadPriorPortfolioForm;
  /**
   * Unique id prefix so multiple instances of these fields can coexist
   * on a page (e.g. inline form + dialog form open at once) without
   * label-for collisions.
   */
  idPrefix: string;
};

export function UploadFields({ form, idPrefix }: Props) {
  const disabled = form.isPending;

  return (
    <>
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${idPrefix}-file`}
          className="text-sm font-medium text-slate-700"
        >
          PDF-bestand
        </label>
        <input
          ref={form.fileInputRef}
          id={`${idPrefix}-file`}
          name="file"
          type="file"
          accept="application/pdf,.pdf"
          required
          disabled={disabled}
          onChange={(e) => form.setFile(e.target.files?.[0] ?? null)}
          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-blue-700 disabled:opacity-50"
        />
        {form.file ? (
          <p className="text-xs text-slate-500">
            Gekozen: <span className="font-medium">{form.file.name}</span> (
            {Math.round(form.file.size / 1024)} KB)
          </p>
        ) : (
          <p className="text-xs text-slate-500">Max 15 MB.</p>
        )}
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
