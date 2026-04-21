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
//   - SWR drives the status polling. The key flips from null → the
//     status URL the instant jobId is set, and `refreshInterval`
//     returns 2000 until the row reaches a terminal status, at which
//     point it returns 0 and SWR stops fetching. UI state is derived
//     purely from SWR's cache + submitError — no setState-in-effect
//     shenanigans, no AbortController plumbing, no setTimeout chains.
//     When the dialog unmounts, SWR's own cleanup cancels in-flight
//     requests.

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { uploadPortfolioAction } from "../../actions";

// Local fetcher specifically for the upload-job status endpoint.
// The shared `~/lib/swr` jsonFetcher doesn't check `res.ok`, so
// 401/404/500 bodies (typically `{ error: "..." }`) would slip
// through as `data` instead of throwing — which SWR routes into
// `data` and our downstream state-derivation `switch` would miss,
// crashing the component with `state.kind` undefined (bugbot
// finding). Throwing here puts non-2xx responses on SWR's `error`
// channel and the state-derivation renders the "failed" branch
// correctly.
async function fetchUploadJobStatus(url: string): Promise<unknown> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    let detail: string | null = null;
    try {
      const body = (await res.json()) as { error?: string };
      detail = typeof body.error === "string" ? body.error : null;
    } catch {
      // Body wasn't JSON — fall back to the HTTP status line.
    }
    throw new Error(
      detail ??
        `Status ophalen mislukt (HTTP ${res.status} ${res.statusText}).`,
    );
  }
  return res.json();
}

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
  // Two separate failure surfaces so we can distinguish:
  //   - submitError: the action itself rejected (validation, Storage
  //     upload failure) BEFORE creating a job. No jobId to poll.
  //   - jobId + SWR error / job.status='failed': the job exists and
  //     polling says it failed. UI can offer "retry" specifically.
  const [jobId, setJobId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
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
    setJobId(null);
    setSubmitError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // SWR's polling stops automatically when its key goes null (the
    // jobId reset above). No manual cleanup needed.
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

  // SWR drives the polling. When jobId is null the key is null → no
  // fetch. When jobId is set, SWR polls on the returned interval
  // function; once status hits a terminal state (ready/failed) the
  // interval goes to 0 and SWR stops polling. Unmount / dialog close
  // stops it too (SWR handles its own cleanup — no AbortController
  // plumbing, no setTimeout chain).
  type StatusResponse =
    | { status: "pending" | "processing" }
    | { status: "ready"; sourceId: string }
    | { status: "failed"; errorMessage: string };

  const { data: statusData, error: statusError } = useSWR<StatusResponse>(
    jobId ? `/api/upload-job/${jobId}/status` : null,
    fetchUploadJobStatus as (url: string) => Promise<StatusResponse>,
    {
      refreshInterval: (latest) =>
        !latest || latest.status === "pending" || latest.status === "processing"
          ? POLL_INTERVAL_MS
          : 0,
      // Status is a monotonic state machine — re-fetching on focus
      // gains nothing and just adds noise.
      revalidateOnFocus: false,
      // SWR's built-in error retry would mask terminal failures
      // behind extra fetches; we want to surface them immediately.
      shouldRetryOnError: false,
    },
  );

  // Derive the UI state machine from the three independent signals:
  //   - submitError: action threw before a job was created
  //   - jobId + statusData/statusError: async job exists and we're
  //     polling its status
  // This replaces the old setState-in-effect pattern — now state is
  // purely derived, which means it can never drift from the source
  // of truth (SWR's cache) and there's no manual reconciliation
  // needed on every poll tick.
  const state: UploadState = (() => {
    if (submitError) {
      return { kind: "failed", jobId: null, errorMessage: submitError };
    }
    if (!jobId) return { kind: "idle" };
    if (statusError) {
      return {
        kind: "failed",
        jobId,
        errorMessage:
          statusError instanceof Error
            ? `Status ophalen mislukt: ${statusError.message}`
            : "Status ophalen mislukt.",
      };
    }
    if (!statusData) {
      // jobId is set but the first poll hasn't returned yet. Treat
      // as 'pending' so the UI already shows the spinner.
      return { kind: "pending", jobId };
    }
    switch (statusData.status) {
      case "pending":
      case "processing":
        return { kind: statusData.status, jobId };
      case "ready":
        return { kind: "ready", jobId, sourceId: statusData.sourceId };
      case "failed":
        return { kind: "failed", jobId, errorMessage: statusData.errorMessage };
      default:
        // Defensive: if the server ever returns an unexpected shape
        // (e.g. a schema drift we didn't anticipate), don't let the
        // IIFE return `undefined` and crash the component tree —
        // surface it as a failure the user can at least see.
        return {
          kind: "failed",
          jobId,
          errorMessage: "Onverwacht statusantwoord van de server.",
        };
    }
  })();

  // Notify parent on terminal success. The effect fires exactly when
  // the derived state transitions into 'ready' (source id is
  // immutable per job, so the dep list never re-fires mid-session).
  // This is a legitimate "sync to external system" useEffect —
  // notifying the parent of a state change, not orchestrating the
  // fetch itself.
  const readySourceId = state.kind === "ready" ? state.sourceId : null;
  useEffect(() => {
    if (!readySourceId || !jobId) return;
    onSuccess?.({
      jobId,
      sourceId: readySourceId,
      niveauRang: selectedProfiel?.niveauRang ?? null,
      label: label.trim(),
    });
    // selectedProfiel + label + jobId are captured at the transition
    // render; they're stable during polling (form isn't re-editable
    // after submit), so omitting them from deps is correct — we only
    // want this to fire on the ready transition.
    // biome-ignore lint/correctness/useExhaustiveDependencies: see comment
  }, [readySourceId]);

  function submit() {
    if (!file || !selectedProfiel) return;
    if (coverage.type === "kerntaken" && coverage.kerntaakCodes.length === 0)
      return;

    // Reset any previous failure so re-submits don't show stale state.
    setSubmitError(null);
    setJobId(null);

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
        // Setting jobId flips SWR's key from null → a real URL, which
        // triggers the first fetch and the refreshInterval function.
        // From here the derived `state` takes over driving the UI.
        setJobId(r.jobId);
      } else {
        setSubmitError(r.reason);
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
