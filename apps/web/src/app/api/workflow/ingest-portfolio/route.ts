import { AiCorpus, Leercoach } from "@nawadi/core";
import { serve } from "@upstash/workflow/nextjs";
import { createHash } from "node:crypto";
import { anonymizeText } from "~/app/(dashboard)/(account)/profiel/[handle]/portfolios/_lib/portfolio-pipeline";
import { extractPdfText, splitIntoChunks } from "~/app/(dashboard)/(account)/profiel/[handle]/_lib/extract";
import {
  downloadPortfolioOriginal,
} from "~/lib/portfolio-storage";

// Durable portfolio-ingest pipeline.
//
// Trigger: uploadPortfolioAction (server action) calls
// workflow.trigger() with `{ jobId }` after stashing the raw PDF
// bytes in Supabase Storage + creating the upload_job row.
//
// Why Upstash Workflow + upload_job vs. doing the work inline in the
// action:
//
//   - The LLM anonymisation step regularly runs 30-60s on a real
//     portfolio. Vercel's serverless timeout (30s default, 300s max)
//     forces us to either bloat maxDuration or break the work up.
//   - Break-the-work-up isn't safe without durability: a lambda
//     cold-start, network blip, or deploy mid-job drops all progress.
//   - Upstash Workflow gives us durable state machine for free:
//     each 'step' below becomes an isolated HTTP callback; step
//     outputs are persisted in QStash's event log; retries + skew
//     protection are automatic.
//
// Pipeline shape (mirrors the old synchronous ingestPortfolio):
//
//   1. load-job         — fetch upload_job row, detect replay of a
//                          completed run, short-circuit if so
//   2. mark-processing  — flip upload_job.status to 'processing'
//   3. extract          — fetch bytes from Storage, run unpdf
//   4. anonymise        — LLM scrub of names/locations/verenigingen
//   5. ingest           — dedup, chunk, upsert into ai_corpus; link
//                          source.original_storage_path to the blob
//   6. mark-ready       — flip upload_job.status to 'ready', set
//                          upload_job.sourceId
//
// Retries: each step is retried automatically by @upstash/workflow
// on transient failure. If a step's retries exhaust, the workflow
// fails permanently and our failureFunction flips upload_job to
// 'failed' with the error message — the UI's polling hook then
// surfaces a human-readable error to the user.
//
// Idempotency: steps re-read upload_job by id at the start. A replay
// of an already-completed job short-circuits (status check) rather
// than double-inserting into ai_corpus.

type Payload = {
  jobId: string;
};

type ExtractOutput = {
  rawText: string;
  pageCount: number;
  charCount: number;
};

type AnonymiseOutput = {
  anonymizedText: string;
  redactedEntities: Awaited<
    ReturnType<typeof anonymizeText>
  >["redactedEntities"];
};

type IngestOutput = {
  sourceId: string;
};

export const { POST } = serve<Payload>(
  async (context) => {
    const { jobId } = context.requestPayload;

    // Step 1: load job and detect replay. Validates the job exists
    // before we spend compute on it. Returns an `alreadyReady` flag
    // so a replay of a completed job short-circuits below without
    // throwing — the previous implementation threw to signal replay,
    // which tripped the workflow's `failureFunction` and corrupted
    // the job's status from 'ready' back to 'failed' (bugbot finding).
    const job = await context.run("load-job", async () => {
      const found = await Leercoach.UploadJob.getByIdAsWorkflow({ jobId });
      if (!found) {
        throw new Error(
          `upload_job ${jobId} not found — aborting workflow.`,
        );
      }
      return {
        alreadyReady: found.status === "ready",
        userId: found.userId,
        blobPath: found.blobPath,
        label: found.label,
        metadata: found.metadata,
      };
    });
    // Replay short-circuit: the job is already marked ready in the DB,
    // so there is nothing left to do. Returning here leaves the row
    // untouched (no flip back to 'failed' via failureFunction).
    if (job.alreadyReady) return;

    // Step 2: mark processing + record our own workflowRunId. The
    // server action used to write the runId from its side right after
    // `triggerIngestPortfolio`, but that raced with this very step —
    // a slow action / fast workflow would regress 'processing' back
    // to 'pending', and the client's SWR poll would chase a status
    // the workflow had already moved past. Writing it here, in
    // lockstep with the 'processing' transition, eliminates the race
    // (bugbot finding).
    await context.run("mark-processing", async () => {
      await Leercoach.UploadJob.updateStatus({
        jobId,
        status: "processing",
        workflowRunId: context.workflowRunId,
      });
    });

    // Step 3: fetch bytes + extract text. unpdf runs in Node
    // serverless cleanly — no canvas / DOMMatrix quirks — but we
    // still isolate it in its own step because it can run several
    // seconds for large PDFs and we want clean retry semantics if
    // Storage hiccups.
    const extracted = await context.run<ExtractOutput>("extract", async () => {
      const bytes = await downloadPortfolioOriginal(job.blobPath);
      const { rawText, pageCount, charCount } = await extractPdfText(bytes);
      return { rawText, pageCount, charCount };
    });

    // Step 4: LLM anonymisation. This is the long pole — regularly
    // 30-60s for a real portfolio. Having it in its own step means a
    // retry on provider flakiness doesn't re-run extract, and the
    // full-blown timeout ceiling applies per-step, not to the whole
    // workflow.
    const anonymised = await context.run<AnonymiseOutput>(
      "anonymise",
      async () => {
        return await anonymizeText(extracted.rawText, {
          userId: job.userId,
        });
      },
    );

    // Step 5: chunk + upsert into ai_corpus. Same logic as the old
    // inline ingestPortfolio, just running in a durable context.
    // source.original_storage_path records the raw blob so we can
    // offer the user a "download my original" affordance later.
    const ingested = await context.run<IngestOutput>("ingest", async () => {
      const metadata = job.metadata as Record<string, unknown>;
      const profielId =
        typeof metadata.profielId === "string" ? metadata.profielId : null;
      const richting =
        typeof metadata.richting === "string"
          ? (metadata.richting as
              | "instructeur"
              | "leercoach"
              | "pvb_beoordelaar")
          : null;
      const niveauRang =
        typeof metadata.niveauRang === "number" ? metadata.niveauRang : null;
      const coverage =
        metadata.coverage && typeof metadata.coverage === "object"
          ? (metadata.coverage as Record<string, unknown>)
          : null;
      const consentShared = metadata.consentShared === true;

      const chunks = splitIntoChunks(anonymised.anonymizedText);
      const sourceHash = createHash("sha256")
        .update(anonymised.anonymizedText)
        .digest("hex");
      const sourceIdentifier = `user:${job.userId}:${sourceHash.slice(0, 12)}`;

      const result = await AiCorpus.upsertSourceWithChunks({
        source: {
          domain: "pvb_portfolio",
          sourceIdentifier,
          sourceHash,
          content: anonymised.anonymizedText,
          // user_only by default; opt_in_shared when the user ticks
          // the "help improve our models" checkbox at upload.
          consentLevel: consentShared ? "opt_in_shared" : "user_only",
          contributedByUserId: job.userId,
          profielId,
          richting,
          niveauRang,
          chatId: null,
          originalStoragePath: job.blobPath,
          metadata: {
            label: job.label,
            coverage,
            redactedEntities: anonymised.redactedEntities,
            pageCount: extracted.pageCount,
            uploadedAt: new Date().toISOString(),
          },
          charCount: anonymised.anonymizedText.length,
          pageCount: extracted.pageCount,
        },
        chunks: chunks.map((c) => ({
          content: c.content,
          wordCount: c.wordCount,
          qualityScore: null,
          criteriumId: null,
          werkprocesId: null,
          metadata: {},
        })),
      });
      return { sourceId: result.sourceId };
    });

    // Step 6: mark job as ready + wire the sourceId so the status
    // endpoint can return it. Separate step so a bug in the ingest
    // step's DB write doesn't conflate with the UI-facing "done"
    // signal — the upload_job's status change is the atomic commit
    // point for "this upload succeeded".
    await context.run("mark-ready", async () => {
      await Leercoach.UploadJob.updateStatus({
        jobId,
        status: "ready",
        sourceId: ingested.sourceId,
      });
    });
  },
  {
    // When a step exhausts its retries, this handler fires once and
    // marks the job as failed so the client's status polling can
    // surface a human-readable error. No throw inside — any throw
    // would put us back in retry hell.
    failureFunction: async ({ failStatus, failResponse, context }) => {
      const payload = context.requestPayload as Payload | undefined;
      if (!payload?.jobId) return;
      try {
        // Defensive re-read: even though the main handler now
        // short-circuits on a replay instead of throwing, we still
        // guard against any future path that could fire this
        // callback for a job the DB already marks 'ready' (e.g. a
        // late callback racing a successful run). Flipping 'ready'
        // → 'failed' would corrupt a known-good result.
        const current = await Leercoach.UploadJob.getByIdAsWorkflow({
          jobId: payload.jobId,
        });
        if (current?.status === "ready") {
          console.warn(
            `[workflow/ingest-portfolio] failureFunction fired for already-ready job ${payload.jobId}; skipping status flip.`,
          );
          return;
        }
        await Leercoach.UploadJob.updateStatus({
          jobId: payload.jobId,
          status: "failed",
          errorMessage:
            typeof failResponse === "string"
              ? failResponse.slice(0, 2000)
              : `Workflow failed with status ${failStatus}`,
        });
      } catch (markErr) {
        console.error(
          `[workflow/ingest-portfolio] failureFunction markFailed threw (jobId=${payload.jobId})`,
          markErr,
        );
      }
    },
  },
);
