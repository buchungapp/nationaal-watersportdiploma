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

// Client-side hard ceiling on how long we'll keep the user in the
// "Verwerken…" state. Comfortably above the realistic worst case for
// a portfolio ingest (30-60s typical, up to ~4 minutes for a very
// large PDF), but short enough to give a silently stalled workflow
// a definite UX exit (bugbot finding: without a ceiling, a lost
// QStash webhook would keep the user polling forever with no escape).
// The workflow itself has step-level retries from Upstash, so by the
// time we hit this we're firmly in "something is actually broken"
// territory — surface a failure so the user can retry.
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

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
  // Flipped by a setTimeout when polling exceeds POLL_TIMEOUT_MS —
  // gives the user an escape hatch from a silently-stalled workflow
  // (bugbot finding). Nulling jobId on reset/re-submit clears the
  // timer via the effect cleanup.
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Snapshot of the form values that were actually submitted. Freezes
  // the values `onSuccess` hands to the parent so they can't drift if
  // UI state is mutated between submit and the 'ready' transition
  // (bugbot finding — the ready-effect closed over live `selectedProfiel`
  // + `label`, so any edit during polling would poison the callback).
  const submittedSnapshotRef = useRef<{
    niveauRang: number | null;
    label: string;
  } | null>(null);
  // Latest-wins ref over the caller's `onSuccess`. The ready-effect
  // below only depends on `readySourceId` (to fire exactly once on
  // the terminal transition), so if we closed over `onSuccess`
  // directly a caller that re-creates the callback each render
  // (typical when it closes over `onClose`) could end up firing the
  // stale version (bugbot finding). Synced in render, read in effect
  // at call time — always the freshest reference.
  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

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

  // Start a watchdog the moment a jobId is set. If the workflow
  // finishes (statusData flips to 'ready'/'failed') the useSWR cache
  // returns a terminal state first and the state machine renders the
  // result — this timer fires only in the pathological case where
  // the workflow has gone dark. Cleanup on jobId change (reset /
  // re-submit) clears the pending timer.
  useEffect(() => {
    if (!jobId) return;
    const timer = setTimeout(() => {
      setPollTimedOut(true);
    }, POLL_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [jobId]);

  const reset = useCallback(() => {
    setFile(null);
    setLabel("");
    setProfielId(defaultProfielId ?? "");
    setCoverage({ type: "full_profiel" });
    setConsentShared(false);
    setJobId(null);
    setSubmitError(null);
    setPollTimedOut(false);
    submittedSnapshotRef.current = null;
    // Re-enable polling for the next submission — a previous error
    // on this form shouldn't permanently disable the poll.
    pollDisabledRef.current = false;
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

  // Tracks whether the status endpoint has errored. Needed because
  // SWR's `refreshInterval` callback only receives the latest DATA,
  // not the latest error — without this ref, a persistent fetch
  // failure (e.g. expired auth returning 401 on every poll) would
  // keep `latest` undefined, keep `!latest` true, and keep polling
  // forever in the background even though the UI's failed state is
  // already final (bugbot finding). `shouldRetryOnError: false`
  // only disables SWR's internal backoff retry, NOT the refreshInterval
  // timer. The ref flips on the first error via `onError` and the
  // interval function returns 0, stopping the poll.
  const pollDisabledRef = useRef(false);
  const { data: statusData, error: statusError } = useSWR<StatusResponse>(
    // Key stays bound to jobId alone so any already-cached terminal
    // response survives the polling-stop (bugbot round-11 finding:
    // when the key went null on timeout, a `ready` response arriving
    // in the same React batch was discarded and the user saw the
    // timeout banner despite the server actually succeeding). Polling
    // is stopped via `refreshInterval` + `pollDisabledRef` /
    // `pollTimedOut` — NOT via the key.
    jobId ? `/api/upload-job/${jobId}/status` : null,
    fetchUploadJobStatus as (url: string) => Promise<StatusResponse>,
    {
      refreshInterval: (latest) => {
        if (pollDisabledRef.current) return 0;
        if (pollTimedOut) return 0;
        if (
          !latest ||
          latest.status === "pending" ||
          latest.status === "processing"
        ) {
          return POLL_INTERVAL_MS;
        }
        return 0;
      },
      // Status is a monotonic state machine — re-fetching on focus
      // gains nothing and just adds noise.
      revalidateOnFocus: false,
      // SWR's built-in error retry would mask terminal failures
      // behind extra fetches; we want to surface them immediately.
      shouldRetryOnError: false,
      onError: () => {
        pollDisabledRef.current = true;
      },
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
    // Server truth wins over any client-side heuristic (bugbot
    // round-11 finding: if a `ready` response arrives in the same
    // React batch as the polling watchdog trips, the client-side
    // timeout banner used to mask it — the user saw "timed out" for
    // a job that had actually succeeded). Check terminal statusData
    // BEFORE `pollTimedOut` and BEFORE `statusError` so the cached
    // final value always takes precedence.
    if (statusData?.status === "ready") {
      return { kind: "ready", jobId, sourceId: statusData.sourceId };
    }
    if (statusData?.status === "failed") {
      return {
        kind: "failed",
        jobId,
        errorMessage: statusData.errorMessage,
      };
    }
    if (pollTimedOut) {
      return {
        kind: "failed",
        jobId,
        errorMessage:
          "Verwerken duurt ongewoon lang. De achtergrond­taak is mogelijk nog bezig, maar je kunt dit venster sluiten en later in je portfolio’s kijken.",
      };
    }
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
    // Non-terminal statuses only reach this point — terminal ones
    // (`ready` / `failed`) were handled by the early returns above.
    switch (statusData.status) {
      case "pending":
      case "processing":
        return { kind: statusData.status, jobId };
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
    // Read from the submit-time snapshot, not the current form state —
    // see `submittedSnapshotRef`. Falls back to live values only if the
    // snapshot is missing (shouldn't happen; submit() always sets it).
    const snapshot = submittedSnapshotRef.current;
    // Read via ref so we always call the freshest callback, even if
    // the caller re-creates it each render (see onSuccessRef comment).
    onSuccessRef.current?.({
      jobId,
      sourceId: readySourceId,
      niveauRang: snapshot?.niveauRang ?? selectedProfiel?.niveauRang ?? null,
      label: snapshot?.label ?? label.trim(),
    });
    // Intentionally fire only on the 'ready' transition. The snapshot
    // ref makes the other values deterministic, so we don't need them
    // in deps; we specifically don't want this to re-fire if the user
    // edits label/profielId after the job is ready.
    // biome-ignore lint/correctness/useExhaustiveDependencies: see comment
  }, [readySourceId]);

  function submit() {
    if (!file || !selectedProfiel) return;
    if (coverage.type === "kerntaken" && coverage.kerntaakCodes.length === 0)
      return;

    // Reset any previous failure so re-submits don't show stale state.
    setSubmitError(null);
    setJobId(null);
    setPollTimedOut(false);
    // Re-enable polling — a previous job's error must not permanently
    // disable the fresh submission we're about to fire.
    pollDisabledRef.current = false;

    // Freeze the values we'll hand to onSuccess when the job completes.
    // Fields are disabled during polling (see `isWorkflowRunning`), but
    // this ref makes that a belt-and-braces contract — even if a future
    // caller forgets to respect the disabled state, the callback
    // receives the submitted values, not whatever's in state when the
    // job happens to flip to 'ready'.
    submittedSnapshotRef.current = {
      niveauRang: selectedProfiel.niveauRang,
      label: label.trim(),
    };

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
  // True while *anything* async is happening — the useTransition flag
  // for the server action, OR the SWR-driven polling of a running job.
  // Consumers use this to disable inputs + close affordances so the
  // form values match what we actually sent to the server (bugbot
  // finding: fields remained editable during the 30-60s polling phase).
  const isWorkflowRunning =
    isPending || state.kind === "pending" || state.kind === "processing";
  const canSubmit =
    file !== null &&
    selectedProfiel !== null &&
    coverageComplete &&
    !isWorkflowRunning;

  return {
    // form state
    file,
    label,
    profielId,
    coverage,
    consentShared,
    isPending,
    isWorkflowRunning,
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
