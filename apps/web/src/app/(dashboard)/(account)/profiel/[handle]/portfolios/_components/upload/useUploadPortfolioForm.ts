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
//
// Async lifecycle (new as of durable-ingest PR):
//   - submit() returns fast (~1s) with a jobId from the upload action.
//     The heavy work (PDF extract + LLM anonymisation + chunk + store)
//     runs in an Upstash Workflow in the background.
//   - This hook polls /api/upload-job/:id/status every 2s while the
//     workflow runs; terminal status ('ready' or 'failed') stops polling
//     and fires onSuccess / populates the error state.

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { uploadPortfolioAction } from "../../actions";

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

/**
 * Client-side view of the upload's progression. Maps one-to-one to
 * upload_job.status server-side but adds an implicit "idle" state for
 * the form before anything has been submitted, and a "failed_submit"
 * state for the narrow window where the action itself throws before
 * ever creating a job row. Consumers render the matching UI for each.
 */
export type UploadState =
  | { kind: "idle" }
  | {
      kind: "pending" | "processing";
      jobId: string;
    }
  | {
      kind: "ready";
      jobId: string;
      sourceId: string;
    }
  | {
      kind: "failed";
      jobId: string | null;
      errorMessage: string;
    };

export type UploadSuccessCtx = {
  jobId: string;
  sourceId: string;
  niveauRang: number | null;
  label: string;
};

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
  /**
   * Called when the async workflow completes successfully. Receives
   * the sourceId so callers can deep-link or revalidate. Not called
   * on failure — consumers can read `state.kind === "failed"` from
   * the hook's return.
   */
  onSuccess?: (ctx: UploadSuccessCtx) => void;
};

// Polling cadence for the workflow status endpoint. 2s is fast enough
// that the UI feels responsive for short jobs (<15s) and slow enough
// that a 5-minute worst-case job only hits the endpoint ~150 times.
// The endpoint reads a single indexed row; cost is negligible either
// way.
const POLL_INTERVAL_MS = 2000;

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
  // New: opt-in consent for using the anonymised version to improve
  // the model for other kandidaten. Default OFF — explicit opt-in only.
  const [consentShared, setConsentShared] = useState(false);
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Stable reference so the polling effect's cleanup cancels the
  // correct in-flight fetch when the hook unmounts mid-request.
  const pollAbortRef = useRef<AbortController | null>(null);

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
  // biome-ignore lint/correctness/useExhaustiveDependencies: profielId is intentional; Biome thinks the dep is unnecessary
  useEffect(() => {
    setCoverage({ type: "full_profiel" });
  }, [profielId]);

  const reset = useCallback(() => {
    setFile(null);
    setLabel("");
    setProfielId(defaultProfielId ?? "");
    setCoverage({ type: "full_profiel" });
    setConsentShared(false);
    setState({ kind: "idle" });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
  }, [defaultProfielId]);

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

  // Poll the workflow's status endpoint while the job is in flight.
  // Effect hook re-fires whenever `state.kind` transitions into a
  // polling state; cleanup aborts the in-flight fetch + stops the
  // timer chain if the consumer closes the dialog.
  useEffect(() => {
    if (state.kind !== "pending" && state.kind !== "processing") {
      return;
    }
    const jobId = state.jobId;
    const abort = new AbortController();
    pollAbortRef.current = abort;

    let cancelled = false;
    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/upload-job/${jobId}/status`, {
          signal: abort.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as
          | { status: "pending" | "processing" }
          | { status: "ready"; sourceId: string }
          | { status: "failed"; errorMessage: string };

        if (cancelled) return;
        switch (body.status) {
          case "pending":
          case "processing":
            setState({ kind: body.status, jobId });
            setTimeout(poll, POLL_INTERVAL_MS);
            break;
          case "ready":
            setState({ kind: "ready", jobId, sourceId: body.sourceId });
            onSuccess?.({
              jobId,
              sourceId: body.sourceId,
              niveauRang: selectedProfiel?.niveauRang ?? null,
              label: label.trim(),
            });
            break;
          case "failed":
            setState({
              kind: "failed",
              jobId,
              errorMessage: body.errorMessage,
            });
            break;
        }
      } catch (err) {
        // AbortError fires on cleanup — silent.
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (cancelled) return;
        setState({
          kind: "failed",
          jobId,
          errorMessage:
            err instanceof Error
              ? `Status ophalen mislukt: ${err.message}`
              : "Status ophalen mislukt.",
        });
      }
    };
    // First poll fires immediately — the action's return races ahead
    // of the first workflow step, so the first poll usually sees
    // status='pending' or 'processing' right away, which renders the
    // right UI. No initial delay.
    void poll();

    return () => {
      cancelled = true;
      abort.abort();
    };
    // selectedProfiel + label are captured for the onSuccess callback
    // only; re-running the effect on every label keystroke would
    // cancel+restart polling mid-job. Intentionally omitted from deps.
    // biome-ignore lint/correctness/useExhaustiveDependencies: see above
  }, [state.kind, state.kind === "pending" || state.kind === "processing" ? state.jobId : null, onSuccess]);

  function submit() {
    if (!file || !selectedProfiel) return;
    if (coverage.type === "kerntaken" && coverage.kerntaakCodes.length === 0)
      return;

    setState({ kind: "idle" });
    const formData = new FormData();
    formData.append("file", file);
    formData.append("handle", handle);
    formData.append("profielId", selectedProfiel.id);
    formData.append("coverage", JSON.stringify(coverage));
    formData.append("consentShared", consentShared ? "true" : "false");
    if (label.trim()) formData.append("label", label.trim());

    startTransition(async () => {
      const r = await uploadPortfolioAction(formData);
      if (r.ok) {
        // Kick polling. Transitions isPending off instantly; the
        // polling effect takes over rendering state from here.
        setState({ kind: "pending", jobId: r.jobId });
      } else {
        // The action itself rejected (validation, Storage upload
        // failure, etc.). No jobId to poll — show the error inline.
        setState({
          kind: "failed",
          jobId: null,
          errorMessage: r.reason,
        });
      }
    });
  }

  const coverageComplete =
    coverage.type === "full_profiel" ||
    (coverage.type === "kerntaken" && coverage.kerntaakCodes.length > 0);
  const canSubmit =
    file !== null &&
    selectedProfiel !== null &&
    coverageComplete &&
    !isPending &&
    // Don't let the user submit while a previous upload is still in
    // flight — reset first, or close + reopen the dialog.
    state.kind !== "pending" &&
    state.kind !== "processing";

  return {
    // form state
    file,
    label,
    profielId,
    coverage,
    consentShared,
    isPending,
    canSubmit,
    selectedProfiel,
    profielen,
    // lifecycle state
    state,
    // setters (single field each; presentational components wire these
    // to their inputs directly)
    setFile,
    setLabel,
    setProfielId,
    setCoverage,
    setConsentShared,
    toggleKerntaak,
    // refs
    fileInputRef,
    // actions
    submit,
    reset,
  };
}

export type UploadPriorPortfolioForm = ReturnType<typeof useUploadPortfolioForm>;
