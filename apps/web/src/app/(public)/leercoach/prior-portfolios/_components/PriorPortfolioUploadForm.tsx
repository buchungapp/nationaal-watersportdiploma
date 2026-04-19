"use client";

import { useState, useTransition } from "react";
import {
  type UploadPriorPortfolioResult,
  uploadPriorPortfolioAction,
} from "../actions";

// Client-side upload form. Server does the real work (extract +
// anonymize + ingest); the client just collects file + niveau + label
// and shows progress / result. Anonymization runs synchronously server-
// side so users see a "bezig…" state until the pipeline returns.
export function PriorPortfolioUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [niveauRang, setNiveauRang] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<UploadPriorPortfolioResult | null>(null);

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
        setFile(null);
        setLabel("");
        setNiveauRang("");
        // Reset the file input — React doesn't uncontrol it automatically.
        const input = document.querySelector<HTMLInputElement>(
          'input[name="file"]',
        );
        if (input) input.value = "";
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div className="flex flex-col gap-2">
        <label
          htmlFor="prior-file"
          className="text-sm font-medium text-slate-700"
        >
          PDF-bestand
        </label>
        <input
          id="prior-file"
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
          htmlFor="prior-niveau"
          className="text-sm font-medium text-slate-700"
        >
          Welk niveau was dit portfolio voor?
        </label>
        <select
          id="prior-niveau"
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
        <p className="text-xs text-slate-500">
          Optioneel, maar helpt de leercoach later om verwijzingen in
          context te plaatsen.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="prior-label"
          className="text-sm font-medium text-slate-700"
        >
          Korte naam (optioneel)
        </label>
        <input
          id="prior-label"
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          disabled={isPending}
          placeholder={file ? file.name.replace(/\.pdf$/i, "") : "Bijv. 'mijn I3 portfolio'"}
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
            <>
              <p className="font-semibold">
                {result.alreadyIngested
                  ? "Deze versie stond er al — niets nieuws toegevoegd."
                  : `Succes: ${result.chunkCount} fragmenten opgenomen (${result.pageCount} pagina's).`}
              </p>
              <p className="mt-1 text-xs">
                De tekst is server-side geanonimiseerd. Je leercoach kan er
                nu naar verwijzen tijdens sessies.
              </p>
            </>
          ) : (
            <p>
              <span className="font-semibold">Mislukt:</span> {result.reason}
            </p>
          )}
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!file || isPending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Bezig met verwerken…" : "Upload + anonimiseer"}
        </button>
        {isPending ? (
          <p className="text-xs text-slate-600">
            Kan even duren (PDF-extractie + anonimisering via LLM).
          </p>
        ) : null}
      </div>
    </form>
  );
}
