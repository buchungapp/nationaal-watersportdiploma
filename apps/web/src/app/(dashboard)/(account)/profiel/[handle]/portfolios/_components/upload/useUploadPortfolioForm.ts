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
//
// Scope model:
//   - profielId: required. A kwalificatieprofiel already encodes
//     richting + niveau, so there's no separate richting-only escape.
//     If a kandidaat's old portfolio doesn't map to a current profielId,
//     they pick the closest active profiel.
//   - coverage: optional narrowing WITHIN the profiel. A kandidaat can
//     say "this PDF only covers kerntaak 4.1" when their upload is a
//     single-kerntaak document. Default is the whole profiel.

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  type UploadPriorPortfolioResult,
  uploadPortfolioAction,
} from "../../actions";

export type UploadPriorPortfolioForm = ReturnType<
  typeof useUploadPortfolioForm
>;

export type PortfolioRichting = "instructeur" | "leercoach" | "pvb_beoordelaar";

export type ProfielOption = {
  id: string;
  titel: string;
  richting: PortfolioRichting;
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
};

/**
 * Which slice of the selected profiel this upload covers. Shape mirrors
 * `ChatScope` so the two surfaces feel consistent, but uploads never go
 * below "kerntaken" granularity — werkproces-level tagging would be
 * over-engineering for a document-level upload.
 */
export type CoverageScope =
  | { type: "full_profiel" }
  | { type: "kerntaken"; kerntaakCodes: string[] };

export type UseUploadPriorPortfolioFormOptions = {
  /** Open state — controls the "seed preselectedFile" effect timing. */
  open: boolean;
  /** Person handle threaded to the server action for revalidate. */
  handle: string;
  /** Full list of kwalificatieprofielen (richting + niveau) for the picker. */
  profielen: ProfielOption[];
  /**
   * Pre-select this profiel when the dialog opens. Set by the in-chat
   * 📎 upload affordance to the current chat's profielId so the most
   * common path ("I'm uploading the portfolio for this very chat's
   * profiel") is pre-filled and the kandidaat only has to confirm.
   */
  defaultProfielId?: string | null;
  /** Seed the file input from a drag-drop event on a parent component. */
  preselectedFile?: File | null;
  /** Called after a successful upload, with the server result. */
  onSuccess?: (ctx: {
    result: Extract<UploadPriorPortfolioResult, { ok: true }>;
    niveauRang: number | null;
    label: string;
  }) => void;
};

export function useUploadPortfolioForm({
  open,
  handle,
  profielen,
  defaultProfielId,
  preselectedFile,
  onSuccess,
}: UseUploadPriorPortfolioFormOptions) {
  const [file, setFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [profielId, setProfielId] = useState<string>("");
  const [coverage, setCoverage] = useState<CoverageScope>({
    type: "full_profiel",
  });
  const [result, setResult] = useState<UploadPriorPortfolioResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Seed React state from a preselected file (drop-zone path). The
  // native <input type="file"> is hidden in the fields component, so
  // we don't need to sync its `files` property — React state is the
  // single source of truth for both the visible UI and submission.
  useEffect(() => {
    if (open && preselectedFile) {
      setFile(preselectedFile);
    }
  }, [open, preselectedFile]);

  // Seed the profielId picker from the caller's default (typically the
  // current chat's profielId when opened from the in-chat 📎 button).
  // Only applies the first time the dialog opens; afterwards the user's
  // own choice wins.
  useEffect(() => {
    if (open && defaultProfielId && !profielId) {
      setProfielId(defaultProfielId);
    }
  }, [open, defaultProfielId, profielId]);

  const selectedProfiel = useMemo(
    () => profielen.find((p) => p.id === profielId) ?? null,
    [profielen, profielId],
  );

  // Whenever the profiel changes, reset coverage — kerntaakCodes
  // carry numeric strings tied to the previous profiel's kerntaken
  // and must not bleed across profielen.
  useEffect(() => {
    setCoverage({ type: "full_profiel" });
  }, []);

  function reset() {
    setFile(null);
    setLabel("");
    setProfielId(defaultProfielId ?? "");
    setCoverage({ type: "full_profiel" });
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function toggleKerntaak(code: string, checked: boolean) {
    setCoverage((prev) => {
      const current =
        prev.type === "kerntaken" ? prev.kerntaakCodes : ([] as string[]);
      const next = checked
        ? [...new Set([...current, code])]
        : current.filter((c) => c !== code);
      return { type: "kerntaken", kerntaakCodes: next };
    });
  }

  function submit() {
    if (!file || !selectedProfiel) return;
    // Client-side coverage validation: if the user switched to
    // "kerntaken" but selected zero, block submit. Server validates
    // again.
    if (coverage.type === "kerntaken" && coverage.kerntaakCodes.length === 0)
      return;

    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("handle", handle);
    formData.append("profielId", selectedProfiel.id);
    formData.append("coverage", JSON.stringify(coverage));
    if (label.trim()) formData.append("label", label.trim());

    startTransition(async () => {
      const r = await uploadPortfolioAction(formData);
      setResult(r);
      if (r.ok) {
        const effectiveNiveau = selectedProfiel.niveauRang;
        // Brief pause so the success banner is visible before callers
        // tear down (e.g. close the dialog + send a chat message).
        setTimeout(() => {
          onSuccess?.({
            result: r,
            niveauRang: effectiveNiveau,
            label: label.trim(),
          });
          reset();
        }, 700);
      }
    });
  }

  const coverageComplete =
    coverage.type === "full_profiel" ||
    (coverage.type === "kerntaken" && coverage.kerntaakCodes.length > 0);
  const canSubmit =
    file !== null && selectedProfiel !== null && coverageComplete && !isPending;

  return {
    // state
    file,
    label,
    profielId,
    coverage,
    result,
    isPending,
    canSubmit,
    selectedProfiel,
    profielen,
    // setters (single field each; presentational components wire these
    // to their inputs directly)
    setFile,
    setLabel,
    setProfielId,
    setCoverage,
    toggleKerntaak,
    // refs
    fileInputRef,
    // actions
    submit,
    reset,
  };
}
