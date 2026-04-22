import "server-only";
import { Client } from "@upstash/workflow";
import { BASE_URL } from "~/constants";

// Thin wrapper around @upstash/workflow's Client for triggering
// workflows from server actions.
//
// Env vars expected (see .env.example):
//   - QSTASH_TOKEN                  — API token (dev CLI or prod)
//   - QSTASH_URL                    — base URL of the QStash server
//                                     (http://127.0.0.1:8080 in dev,
//                                      https://qstash.upstash.io in prod)
//   - QSTASH_CURRENT_SIGNING_KEY    — verifies incoming webhook payloads
//   - QSTASH_NEXT_SIGNING_KEY       — key rotation handover
//
// The SDK auto-reads QSTASH_TOKEN + QSTASH_URL when you omit them at
// construction; we pass them explicitly so the code is self-documenting
// at the grep level.

function getClient(): Client {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    throw new Error(
      "QSTASH_TOKEN is required to trigger workflows. Run `pnpm dev:qstash` " +
        "in a sidecar terminal for local dev, or set the prod token in " +
        "Vercel env.",
    );
  }
  return new Client({
    token,
    baseUrl: process.env.QSTASH_URL,
  });
}

/**
 * Trigger the portfolio-ingest workflow with the given jobId. The
 * workflow route at `/api/workflow/ingest-portfolio` picks up the
 * payload, loads the upload_job row, and runs the 6-step pipeline.
 *
 * The workflow writes its own `workflowRunId` onto the upload_job
 * row from within its `mark-processing` step (via
 * `context.workflowRunId`). The caller intentionally does not stash
 * the runId from the trigger response itself — an action-side write
 * would race the workflow's state machine and could regress a
 * 'processing'/'ready' row back to 'pending'.
 *
 * Failure of this trigger call is rare (QStash outage) but surfaces
 * as a thrown error the caller must handle — the upload_job row
 * already exists at this point, and the action flips its status to
 * 'failed' on error so the UI shows a retry affordance.
 */
export async function triggerIngestPortfolio(jobId: string): Promise<void> {
  const client = getClient();
  const webhookUrl = new URL(
    "/api/workflow/ingest-portfolio",
    BASE_URL,
  ).toString();

  await client.trigger({
    url: webhookUrl,
    body: { jobId },
    // Retry count for the initial invocation. Step-level retries are
    // handled by the workflow SDK itself — this is only the "first
    // call to the webhook failed" retry.
    retries: 3,
  });
}
