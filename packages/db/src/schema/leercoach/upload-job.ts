import { sql } from "drizzle-orm";
import {
  index,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { leercoachSchema } from "./schema.js";

// Tracks the async lifecycle of a durable ingest job (portfolio upload
// today, artefact upload later). Created by the upload action the
// instant the file arrives in Supabase Storage; updated by the Upstash
// Workflow route as each step completes.
//
// The row persists after completion as an audit trail — the status
// endpoint reads it to tell the client when processing is done, and
// the "download my original" feature (future) reads `blobPath` to
// mint a signed URL.
//
// Lifecycle:
//   1. Action inserts row with status='pending', blobPath set to the
//      just-uploaded Storage path, metadata carrying the form inputs.
//   2. Action triggers the workflow — this row's id becomes the
//      workflow's input payload.
//   3. Workflow step 1 (`extract`) flips status to 'processing'.
//   4. Workflow step 4 (`done`) flips status to 'ready' and sets
//      sourceId to the just-created ai_corpus.source row.
//   5. Any step failure → status='failed' + errorMessage.

export const uploadJobKind = leercoachSchema.enum("upload_job_kind", [
  "portfolio",
  // Future: "artefact" when we migrate the chat-inline upload path.
]);

export const uploadJobStatus = leercoachSchema.enum("upload_job_status", [
  "pending", // Row created; workflow not yet triggered / just triggered.
  "processing", // Workflow has picked up the job and is mid-pipeline.
  "ready", // All steps completed successfully; sourceId is set.
  "failed", // A step permanently failed; errorMessage is set.
]);

export const leercoachUploadJob = leercoachSchema.table(
  "upload_job",
  {
    id: uuid("id")
      .default(sql`extensions.uuid_generate_v4()`)
      .primaryKey()
      .notNull(),
    // Supabase auth.users.id. No FK — auth.users lives in a different
    // schema we don't own. Validated in the application layer.
    userId: uuid("user_id").notNull(),
    kind: uploadJobKind("kind").notNull(),
    status: uploadJobStatus("status").notNull().default("pending"),
    // Path in Supabase Storage to the original uploaded file. The
    // workflow's extract step fetches from here. After completion,
    // this path is copied into ai_corpus.source.original_storage_path
    // so the source row becomes the durable reference.
    blobPath: text("blob_path").notNull(),
    // Human-facing label provided at upload time (e.g. filename or
    // user-supplied title). Carried through to the eventual source
    // row's metadata.
    label: text("label").notNull().default(""),
    // Form inputs captured at upload time: profielId, richting,
    // niveauRang, coverage (scope), consent ("user_only" vs
    // "opt_in_shared"), etc. Intentionally typed as loose jsonb so we
    // can evolve the upload form without a schema migration per field.
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .default({})
      .notNull(),
    // Upstash Workflow run id — returned by client.trigger(), useful
    // for deep-linking into the Upstash console for debugging. Not
    // functionally required.
    workflowRunId: text("workflow_run_id"),
    // Filled in by the final workflow step. The presence of this id
    // doubles as the "did the ingest succeed" signal for the status
    // endpoint (status='ready' → sourceId is non-null).
    sourceId: uuid("source_id"),
    // Populated when status='failed'. Keep the raw error message for
    // ops triage; surface a friendlier version via the status endpoint.
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => [
    // Hot path: a user polling their own pending jobs newest-first.
    index("upload_job_user_created_idx").on(
      table.userId,
      table.createdAt.desc(),
    ),
    // Secondary: find jobs by status (ops dashboards, orphan cleanup).
    index("upload_job_status_idx").on(table.status),
  ],
);
