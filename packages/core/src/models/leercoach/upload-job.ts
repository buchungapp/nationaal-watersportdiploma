import { schema as s } from "@nawadi/db";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { useQuery, withTransaction } from "../../contexts/index.js";
import {
  uuidSchema,
  withZod,
  wrapCommand,
  wrapQuery,
} from "../../utils/index.js";

// Tracks the lifecycle of a durable ingest run (portfolio upload
// today; artefact upload when we migrate it). The row is the client's
// pollable handle on async processing: they poll by id, we return the
// current status + (on success) the resulting ai_corpus.source id.

export const uploadJobKindSchema = z.enum(["portfolio"]);
export type UploadJobKind = z.infer<typeof uploadJobKindSchema>;

export const uploadJobStatusSchema = z.enum([
  "pending",
  "processing",
  "ready",
  "failed",
]);
export type UploadJobStatus = z.infer<typeof uploadJobStatusSchema>;

// ---- Create ----
//
// Called by the upload server action the moment bytes are in Supabase
// Storage. The workflow trigger fires right after; the returned id is
// what the client uses to poll status + what the workflow route
// receives as its input payload.

export const createUploadJobInput = z.object({
  userId: uuidSchema,
  kind: uploadJobKindSchema,
  blobPath: z.string().min(1),
  label: z.string().default(""),
  /**
   * Opaque bag of form inputs (profielId, scope, consent, etc.).
   * Typed loosely so the upload form can evolve without a schema
   * migration per field; the workflow route validates shape at read.
   */
  metadata: z.record(z.string(), z.unknown()).default({}),
});

export const createUploadJobOutput = z.object({
  jobId: uuidSchema,
});

export const create = wrapCommand(
  "leercoach.uploadJob.create",
  withZod(createUploadJobInput, createUploadJobOutput, async (input) => {
    return withTransaction(async (tx) => {
      const inserted = await tx
        .insert(s.leercoachUploadJob)
        .values({
          userId: input.userId,
          kind: input.kind,
          blobPath: input.blobPath,
          label: input.label,
          metadata: input.metadata,
        })
        .returning({ id: s.leercoachUploadJob.id })
        .then((r) => r[0]);
      if (!inserted) {
        throw new Error("Insert leercoach.upload_job returned no rows");
      }
      return { jobId: inserted.id };
    });
  }),
);

// ---- Read: single job, user-scoped ----

export const getUploadJobByIdInput = z.object({
  jobId: uuidSchema,
  userId: uuidSchema,
});

export const getUploadJobByIdOutput = z
  .object({
    jobId: uuidSchema,
    userId: uuidSchema,
    kind: uploadJobKindSchema,
    status: uploadJobStatusSchema,
    blobPath: z.string(),
    label: z.string(),
    metadata: z.record(z.string(), z.unknown()),
    workflowRunId: z.string().nullable(),
    sourceId: uuidSchema.nullable(),
    errorMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
    completedAt: z.string().nullable(),
  })
  .nullable();

/**
 * Fetch one upload job, scoped to the requesting user. Returns null
 * when the job doesn't exist OR belongs to a different user — never
 * throws on mismatch so callers can't probe existence across users.
 */
export const getById = wrapQuery(
  "leercoach.uploadJob.getById",
  withZod(getUploadJobByIdInput, getUploadJobByIdOutput, async (input) => {
    const query = useQuery();
    const row = await query
      .select()
      .from(s.leercoachUploadJob)
      .where(
        and(
          eq(s.leercoachUploadJob.id, input.jobId),
          eq(s.leercoachUploadJob.userId, input.userId),
        ),
      )
      .limit(1)
      .then((r) => r[0]);

    if (!row) return null;
    return {
      jobId: row.id,
      userId: row.userId,
      kind: row.kind,
      status: row.status,
      blobPath: row.blobPath,
      label: row.label,
      metadata: row.metadata,
      workflowRunId: row.workflowRunId,
      sourceId: row.sourceId,
      errorMessage: row.errorMessage,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
    };
  }),
);

// ---- Read: by id, no user scoping ----
//
// The workflow route runs in an unauthenticated context — QStash
// calls our webhook with a signed payload containing the jobId, and
// we need to load the job to drive the pipeline. No userId filter
// here, but the webhook is gated by QStash's signing-key verification
// upstream, so the call itself is authenticated as "this queue only".
export const getByIdAsWorkflow = wrapQuery(
  "leercoach.uploadJob.getByIdAsWorkflow",
  withZod(
    z.object({ jobId: uuidSchema }),
    getUploadJobByIdOutput,
    async (input) => {
      const query = useQuery();
      const row = await query
        .select()
        .from(s.leercoachUploadJob)
        .where(eq(s.leercoachUploadJob.id, input.jobId))
        .limit(1)
        .then((r) => r[0]);
      if (!row) return null;
      return {
        jobId: row.id,
        userId: row.userId,
        kind: row.kind,
        status: row.status,
        blobPath: row.blobPath,
        label: row.label,
        metadata: row.metadata,
        workflowRunId: row.workflowRunId,
        sourceId: row.sourceId,
        errorMessage: row.errorMessage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      };
    },
  ),
);

// ---- Update status + workflow-run bookkeeping ----
//
// Called from inside the workflow route at every meaningful
// transition: step 1 → "processing", final step → "ready" (+ sourceId),
// any step failure → "failed" (+ errorMessage). Writes are small and
// non-transactional by design — workflow steps are idempotent, so a
// redo of the same transition is a no-op.

export const updateUploadJobStatusInput = z.object({
  jobId: uuidSchema,
  status: uploadJobStatusSchema,
  workflowRunId: z.string().optional(),
  sourceId: uuidSchema.optional(),
  errorMessage: z.string().max(2000).optional(),
});

export const updateStatus = wrapCommand(
  "leercoach.uploadJob.updateStatus",
  withZod(updateUploadJobStatusInput, z.void(), async (input) => {
    return withTransaction(async (tx) => {
      const patch: {
        status: typeof input.status;
        updatedAt: string;
        workflowRunId?: string;
        sourceId?: string;
        errorMessage?: string | null;
        completedAt?: string;
      } = {
        status: input.status,
        updatedAt: new Date().toISOString(),
      };
      if (input.workflowRunId !== undefined) {
        patch.workflowRunId = input.workflowRunId;
      }
      if (input.sourceId !== undefined) patch.sourceId = input.sourceId;
      // Clear previous error on success; set it on failure.
      if (input.status === "failed") {
        patch.errorMessage = input.errorMessage ?? null;
      } else if (input.status === "ready") {
        patch.errorMessage = null;
        patch.completedAt = new Date().toISOString();
      }

      await tx
        .update(s.leercoachUploadJob)
        .set(patch)
        .where(eq(s.leercoachUploadJob.id, input.jobId));
    });
  }),
);

// ---- List recent jobs for a user ----
//
// Nice-to-have for a "my uploads" dashboard; not wired into the UI
// yet. Included here so the surface is complete when the time comes.

export const listUploadJobsByUserIdInput = z.object({
  userId: uuidSchema,
  limit: z.number().int().min(1).max(100).default(20),
});

export const listByUserId = wrapQuery(
  "leercoach.uploadJob.listByUserId",
  withZod(
    listUploadJobsByUserIdInput,
    z.array(getUploadJobByIdOutput.unwrap()),
    async (input) => {
      const query = useQuery();
      const rows = await query
        .select()
        .from(s.leercoachUploadJob)
        .where(eq(s.leercoachUploadJob.userId, input.userId))
        .orderBy(desc(s.leercoachUploadJob.createdAt))
        .limit(input.limit);
      return rows.map((row) => ({
        jobId: row.id,
        userId: row.userId,
        kind: row.kind,
        status: row.status,
        blobPath: row.blobPath,
        label: row.label,
        metadata: row.metadata,
        workflowRunId: row.workflowRunId,
        sourceId: row.sourceId,
        errorMessage: row.errorMessage,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        completedAt: row.completedAt,
      }));
    },
  ),
);
