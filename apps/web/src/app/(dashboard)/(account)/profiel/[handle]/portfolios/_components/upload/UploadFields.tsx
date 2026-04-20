"use client";

// Stateless presentational component: renders the form fields driven by
// state passed in as a prop. Knows nothing about submission or side
// effects — that lives in useUploadPortfolioForm.
//
// File picker: the native <input type="file"> is hidden; a styled
// button + filename display provides the UI. This avoids two things:
//   1. conflicting UI text when DataTransfer-syncing a dropped file
//      fails (browser chrome showed "Geen bestand gekozen" while
//      React state said the file was picked)
//   2. cross-browser variance in the native input's rendering
// React state is the single source of truth for what's selected.

import { parseKerntaakTitel } from "../../../_lib/format-kerntaak";
import type {
  PortfolioRichting,
  UploadPriorPortfolioForm,
} from "./useUploadPortfolioForm";

type Props = {
  form: UploadPriorPortfolioForm;
  /**
   * Unique id prefix so multiple instances of these fields can coexist
   * on a page without label-for collisions.
   */
  idPrefix: string;
};

const RICHTING_LABELS: Record<PortfolioRichting, string> = {
  instructeur: "Instructeur",
  leercoach: "Leercoach",
  pvb_beoordelaar: "PvB-beoordelaar",
};

const RICHTING_OPTIONS: PortfolioRichting[] = [
  "instructeur",
  "leercoach",
  "pvb_beoordelaar",
];

export function UploadFields({ form, idPrefix }: Props) {
  const disabled = form.isPending;

  function handlePickClick() {
    form.fileInputRef.current?.click();
  }

  // Group profielen by richting so the <select> reads as:
  //   Instructeur
  //     Instructeur Zwaardboot — niveau 4
  //     ...
  const profielenByRichting = RICHTING_OPTIONS.map((richting) => ({
    richting,
    profielen: form.profielen
      .filter((p) => p.richting === richting)
      .sort(
        (a, b) =>
          a.niveauRang - b.niveauRang || a.titel.localeCompare(b.titel),
      ),
  })).filter((g) => g.profielen.length > 0);

  const kerntakenSorted =
    form.selectedProfiel?.kerntaken
      .slice()
      .sort((a, b) => a.rang - b.rang) ?? [];

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

      {/* Profiel picker. A kwalificatieprofiel already encodes richting
          + niveau, so this single dropdown captures both. If a kandidaat's
          old portfolio doesn't match a current profiel cleanly, they pick
          the closest active one — coverage (below) lets them narrow to a
          specific kerntaak if the upload only covers part. */}
      <div className="flex flex-col gap-2">
        <label
          htmlFor={`${idPrefix}-profiel`}
          className="text-sm font-medium text-slate-700"
        >
          Voor welk kwalificatieprofiel was dit portfolio?
        </label>
        <select
          id={`${idPrefix}-profiel`}
          value={form.profielId}
          onChange={(e) => form.setProfielId(e.target.value)}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">— kies profiel —</option>
          {profielenByRichting.map(({ richting, profielen }) => (
            <optgroup key={richting} label={RICHTING_LABELS[richting]}>
              {profielen.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titel} — niveau {p.niveauRang}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>

      {/* Coverage picker. Only relevant once a profiel is picked; lets
          the user say "this PDF only covers kerntaak 4.1" when their
          upload doesn't span the whole profiel. Default is "Hele
          profiel" — most uploads are complete portfolios. */}
      {form.selectedProfiel ? (
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-slate-700">
            Wat dekt dit portfolio?
          </span>
          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-blue-300">
              <input
                type="radio"
                name={`${idPrefix}-coverage`}
                checked={form.coverage.type === "full_profiel"}
                onChange={() => form.setCoverage({ type: "full_profiel" })}
                disabled={disabled}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="block font-medium text-slate-900">
                  Hele profiel
                </span>
                <span className="block text-slate-600">
                  De PDF dekt alle kerntaken van dit profiel.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 cursor-pointer hover:border-blue-300">
              <input
                type="radio"
                name={`${idPrefix}-coverage`}
                checked={form.coverage.type === "kerntaken"}
                onChange={() =>
                  form.setCoverage({ type: "kerntaken", kerntaakCodes: [] })
                }
                disabled={disabled}
                className="mt-0.5"
              />
              <span className="text-sm">
                <span className="block font-medium text-slate-900">
                  Alleen specifieke kerntaken
                </span>
                <span className="block text-slate-600">
                  {(() => {
                    const first = kerntakenSorted[0];
                    const code = first
                      ? parseKerntaakTitel(first.titel).code
                      : null;
                    return code
                      ? `Bijvoorbeeld alleen kerntaak ${code}.`
                      : "Kies de kerntaak die deze PDF dekt.";
                  })()}
                </span>
              </span>
            </label>
          </div>

          {form.coverage.type === "kerntaken" ? (
            <div className="ml-6 flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Kies kerntaken
              </p>
              {kerntakenSorted.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Dit profiel heeft geen aparte kerntaken — kies “Hele
                  profiel”.
                </p>
              ) : (
                kerntakenSorted.map((k) => {
                  // `code` is the internal key (stored in the coverage
                  // scope + submitted to the server), kept as the rang
                  // integer for continuity with chat-scope JSON. The
                  // *display* code + label come from the titel ("PvB
                  // 4.1 - Geven van lessen" → code "4.1", label "Geven
                  // van lessen"). rang is ordering-only per NWD domain.
                  const code = String(k.rang);
                  const { code: displayCode, label } = parseKerntaakTitel(
                    k.titel,
                  );
                  const checked =
                    form.coverage.type === "kerntaken" &&
                    form.coverage.kerntaakCodes.includes(code);
                  return (
                    <label
                      key={k.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) =>
                          form.toggleKerntaak(code, e.target.checked)
                        }
                        disabled={disabled}
                        className="mt-0.5"
                      />
                      <span>
                        <span className="font-medium text-slate-900">
                          {displayCode
                            ? `Kerntaak ${displayCode}`
                            : "Kerntaak"}
                        </span>{" "}
                        <span className="text-slate-600">— {label}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          ) : null}
        </div>
      ) : null}

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
