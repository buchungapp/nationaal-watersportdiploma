"use server";

import { AiCorpus, Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import {
  getUserOrThrow,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import {
  deletePortfolioOriginal,
  uploadPortfolioOriginal,
} from "~/lib/portfolio-storage";
import { triggerIngestPortfolio } from "~/lib/workflow-client";
import {
  type CoverageScope,
  type PortfolioRichting,
} from "./_lib/portfolio-pipeline";

const ALLOWED_RICHTINGEN = [
  "instructeur",
  "leercoach",
  "pvb_beoordelaar",
] as const satisfies readonly PortfolioRichting[];

/**
 * Resolve a profielId to the metadata the pipeline needs: richting,
 * niveauRang, and the set of valid kerntaakCodes (used to validate the
 * user-supplied coverage scope before we accept it).
 */
async function resolveProfielScope(profielId: string): Promise<{
  richting: PortfolioRichting;
  niveauRang: number;
  validKerntaakCodes: Set<string>;
} | null> {
  const niveaus = await listKssNiveaus();
  for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    const match = profielen.find((p) => p.id === profielId);
    if (!match) continue;
    if (!(ALLOWED_RICHTINGEN as readonly string[]).includes(match.richting)) {
      return null;
    }
    return {
      richting: match.richting as PortfolioRichting,
      niveauRang: niveau.rang,
      validKerntaakCodes: new Set(
        match.kerntaken.map((k) => String(k.rang ?? 0)),
      ),
    };
  }
  return null;
}

/**
 * Parse the client-supplied `coverage` JSON blob. Anything malformed
 * collapses to `full_profiel` — uploads should succeed even if the
 * client sends nothing (e.g. future CLI ingest paths).
 *
 * `kerntaakCodes` are cross-checked against the profiel's actual
 * kerntaken so we never persist coverage that references a kerntaak
 * not in this profiel.
 */
function parseCoverage(
  raw: FormDataEntryValue | null,
  validCodes: Set<string>,
): CoverageScope {
  if (typeof raw !== "string" || raw.length === 0) {
    return { type: "full_profiel" };
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { type: "full_profiel" };
  }
  if (
    !parsed ||
    typeof parsed !== "object" ||
    !("type" in parsed) ||
    typeof (parsed as { type: unknown }).type !== "string"
  ) {
    return { type: "full_profiel" };
  }
  const typed = parsed as { type: string; kerntaakCodes?: unknown };
  if (typed.type === "full_profiel") return { type: "full_profiel" };
  if (
    typed.type === "kerntaken" &&
    Array.isArray(typed.kerntaakCodes) &&
    typed.kerntaakCodes.every((c) => typeof c === "string")
  ) {
    const sanitised = (typed.kerntaakCodes as string[]).filter((c) =>
      validCodes.has(c),
    );
    if (sanitised.length === 0) return { type: "full_profiel" };
    return { type: "kerntaken", kerntaakCodes: sanitised };
  }
  return { type: "full_profiel" };
}

// Max upload size. PDF portfolios in our corpus run up to ~30K words /
// 100+ pages, which compresses to roughly 8MB. 15MB gives us headroom
// without letting someone accidentally upload a GB video as a "PDF".
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type UploadPriorPortfolioResult =
  | {
      ok: true;
      /**
       * Handle the client polls for completion. See
       * /api/upload-job/[id]/status.
       */
      jobId: string;
      /**
       * Always "pending" on success — the actual work runs async in
       * the Upstash Workflow. Included for clarity at the call site.
       */
      status: "pending";
    }
  | { ok: false; reason: string };

/**
 * Accept a portfolio PDF upload. Stashes the raw bytes in Supabase
 * Storage, creates an upload_job row for status tracking, and fires
 * an Upstash Workflow that runs the extract + anonymise + ingest
 * pipeline durably in the background.
 *
 * Returns fast (~1s) with a jobId the client uses to poll status.
 * Previous behaviour ran the entire pipeline inside the action — the
 * LLM anonymisation step regularly exceeded Vercel's 30s timeout and
 * tore down unrelated server actions on the same route. See
 * apps/web/src/app/api/workflow/ingest-portfolio/route.ts for the
 * new pipeline shape.
 *
 * The original PDF is preserved in the `portfolio-uploads` bucket
 * indefinitely — users retain access to their raw upload via a
 * signed-URL flow (follow-up UI). The anonymised version is what
 * gets chunked + stored in ai_corpus; `consentShared=true` at upload
 * time marks it as opt_in_shared so we can use it to improve the
 * model for other kandidaten.
 */
export async function uploadPortfolioAction(
  formData: FormData,
): Promise<UploadPriorPortfolioResult> {
  // getUserOrThrow redirects to /login when unauthenticated — inside
  // the (dashboard) tree we never see an anon request in practice, but
  // defensive.
  const user = await getUserOrThrow();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, reason: "Geen bestand meegestuurd." };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      reason: `Bestand is te groot (${Math.round(file.size / 1024 / 1024)}MB). Max 15MB.`,
    };
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, reason: "Alleen PDF-bestanden ondersteund." };
  }

  const profielIdRaw = formData.get("profielId");
  const profielId =
    typeof profielIdRaw === "string" && profielIdRaw.length > 0
      ? profielIdRaw
      : null;
  if (!profielId) {
    return { ok: false, reason: "Kies een kwalificatieprofiel." };
  }
  const resolved = await resolveProfielScope(profielId);
  if (!resolved) {
    return { ok: false, reason: "Profiel niet gevonden." };
  }

  const coverage = parseCoverage(
    formData.get("coverage"),
    resolved.validKerntaakCodes,
  );

  const labelRaw = formData.get("label");
  const label =
    typeof labelRaw === "string" && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : file.name.replace(/\.pdf$/i, "");

  // Opt-in consent for using the anonymised version to improve the
  // digital leercoach model for other kandidaten. Default off —
  // user's original + anonymised version are user_only unless they
  // explicitly tick the box.
  const consentRaw = formData.get("consentShared");
  const consentShared = consentRaw === "true" || consentRaw === "on";

  const handleRaw = formData.get("handle");
  const handle = typeof handleRaw === "string" ? handleRaw : null;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Step 1: stash the raw bytes durably. No deletion after ingest —
  // we preserve originals for the user's own retrieval.
  let blobPath: string;
  try {
    const stashed = await uploadPortfolioOriginal({
      userId: user.authUserId,
      bytes,
      filename: file.name,
    });
    blobPath = stashed.path;
  } catch (err) {
    console.error("Portfolio Storage upload failed", err);
    return {
      ok: false,
      reason:
        err instanceof Error
          ? `Uploaden mislukt: ${err.message}`
          : "Uploaden mislukt.",
    };
  }

  // Step 2: create the upload_job row. This is the pollable handle
  // the client uses to track completion. If the insert fails, we
  // must clean up the blob we just uploaded — otherwise the Storage
  // bucket accumulates orphans that no job row references and no
  // revoke flow can reach (bugbot finding).
  let jobId: string;
  try {
    const created = await Leercoach.UploadJob.create({
      userId: user.authUserId,
      kind: "portfolio",
      blobPath,
      label,
      metadata: {
        profielId,
        richting: resolved.richting,
        niveauRang: resolved.niveauRang,
        coverage,
        consentShared,
      },
    });
    jobId = created.jobId;
  } catch (err) {
    console.error("Portfolio upload_job create failed", err);
    // Best-effort cleanup — we don't want a cleanup failure to mask
    // the original error from the user, so swallow any throw here.
    try {
      await deletePortfolioOriginal(blobPath);
    } catch (cleanupErr) {
      console.error(
        `Failed to clean up orphaned Storage blob at ${blobPath}`,
        cleanupErr,
      );
    }
    return {
      ok: false,
      reason:
        err instanceof Error
          ? `Uploaden mislukt: ${err.message}`
          : "Uploaden mislukt.",
    };
  }

  // Step 3: fire the workflow. On failure (QStash outage), flip the
  // job to 'failed' so the UI can surface it. We still return ok:true
  // with jobId so the client lands on the polling UI which then shows
  // the error — better than a jarring inline error after the upload
  // already "happened".
  //
  // Two distinct try-blocks on purpose (bugbot finding): a shared
  // catch would treat "trigger succeeded, updateStatus failed" as
  // "workflow failed", flipping the row to 'failed' even though
  // QStash is actively processing the job. The workflow would then
  // write 'ready' at its own pace, but by then the client's SWR
  // polling has already seen 'failed' and stopped — the user sees a
  // false-failure banner for an upload that actually succeeded.
  let workflowRunId: string | null = null;
  try {
    const triggered = await triggerIngestPortfolio(jobId);
    workflowRunId = triggered.workflowRunId;
  } catch (err) {
    console.error("Failed to trigger ingest-portfolio workflow", err);
    // Trigger genuinely failed — no workflow is running — so marking
    // the row as 'failed' is the correct outcome. Inner try around
    // updateStatus so a DB hiccup on the mark-failed path doesn't
    // propagate unhandled (bugbot finding).
    try {
      await Leercoach.UploadJob.updateStatus({
        jobId,
        status: "failed",
        errorMessage:
          err instanceof Error ? err.message : "Workflow trigger failed",
      });
    } catch (markErr) {
      console.error(
        `Failed to mark upload_job ${jobId} as failed after workflow trigger failure`,
        markErr,
      );
    }
  }

  // Trigger succeeded — record the workflowRunId for debugging + flip
  // the row to 'pending' so the UI moves out of its creation state.
  // A failure here must NOT touch the row's status: the workflow is
  // already in flight and will write 'ready'/'failed' on its own.
  if (workflowRunId !== null) {
    try {
      await Leercoach.UploadJob.updateStatus({
        jobId,
        status: "pending",
        workflowRunId,
      });
    } catch (markErr) {
      console.error(
        `Failed to record workflowRunId for upload_job ${jobId}; workflow is running but the row still shows no runId.`,
        markErr,
      );
    }
  }

  if (handle) {
    revalidatePath(`/profiel/${handle}/portfolios`);
  }

  return { ok: true, jobId, status: "pending" };
}

/**
 * Soft-delete (revoke) a portfolio source AND delete the original
 * PDF from Supabase Storage. userId scoping in the core helper
 * prevents cross-user revocations.
 *
 * Why both: the user's right to erasure (GDPR) covers both the
 * anonymised-but-retrievable source row AND the raw bytes. Leaving
 * the Storage object behind after revoke would be a compliance gap.
 * Storage delete is best-effort (idempotent, swallows "not found");
 * the source revoke is the authoritative user-visible action.
 */
export async function revokePortfolioAction(input: {
  sourceId: string;
  handle: string;
}): Promise<void> {
  const user = await getUserOrThrow();

  // Look up the source first to grab its originalStoragePath before
  // revoking. We want the Storage delete to happen only when the DB
  // operation would succeed.
  const source = await AiCorpus.getUserPriorSourceById({
    userId: user.authUserId,
    sourceId: input.sourceId,
  });

  await AiCorpus.revokeUserPriorSource({
    userId: user.authUserId,
    sourceId: input.sourceId,
  });

  // Best-effort cleanup of the raw bytes. A Storage failure doesn't
  // roll back the revoke — a stale blob on its own is inert (nothing
  // references it now that the source row is revoked), and the
  // follow-up Storage lifecycle / cleanup can pick it up.
  if (source?.originalStoragePath) {
    try {
      await deletePortfolioOriginal(source.originalStoragePath);
    } catch (err) {
      console.error(
        `[revokePortfolio] failed to delete Storage blob for source=${input.sourceId}`,
        err,
      );
    }
  }

  revalidatePath(`/profiel/${input.handle}/portfolios`);
  revalidatePath(`/profiel/${input.handle}/leercoach`);
}
