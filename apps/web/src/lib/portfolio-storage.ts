import "server-only";
import { createHash } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { invariant } from "~/utils/invariant";

// Helpers around the `portfolio-uploads` Supabase Storage bucket.
//
// Two concerns:
//
//   1. **Writing originals at upload time** — the action reads the
//      request's bytes, hashes them for dedup, and stashes them in
//      the bucket under `{userId}/{hash}.pdf`. This path is durable:
//      kept on disk so the user can retrieve their original later,
//      NOT deleted after anonymisation.
//
//   2. **Reading originals inside the workflow** — the extract step
//      needs the raw bytes; it fetches by path. This runs on the
//      server, not in the user's session, so we use the service-role
//      client that bypasses RLS. Users only ever hit the bucket via
//      the signed-URL retrieval flow (future) or the action's write.
//
// The bucket is **private** — no public reads. All user-facing
// access goes through signed URLs minted server-side with short
// expiries. For now we only write + workflow-read; signed-URL
// retrieval is a follow-up UI.

export const PORTFOLIO_UPLOADS_BUCKET = "portfolio-uploads";

/**
 * Service-role Supabase client for server-side bucket operations
 * that need to bypass RLS. Separate from the per-request `createClient`
 * used in server actions — that one runs under the user's JWT and
 * respects RLS. Used here because:
 *
 *   - The workflow route runs without a Supabase session (QStash
 *     calls our webhook, no user cookies). Must use service-role.
 *   - The write path in the action happens under the user's session
 *     too, but we prefer a consistent server-side client for the
 *     whole Storage surface. RLS on the bucket enforces write-scope
 *     via the policy we set in Supabase (writes only under
 *     `{auth.uid()}/*`); the service-role client respects that
 *     policy's semantics at write time by passing explicit `userId`.
 */
function getServiceClient() {
  invariant(process.env.NEXT_PUBLIC_SUPABASE_URL);
  invariant(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Upload the raw bytes of a portfolio PDF and return the durable
 * storage path. Hashes the content so repeat uploads by the same
 * user dedup to the same object — a second upload of identical
 * bytes is a no-op (Supabase's upsert semantic).
 *
 * Path shape: `{userId}/{sha256[0..16]}.pdf`
 *
 * The short hash prefix keeps paths readable in dashboards while
 * giving ~2^64 collision space per user — comfortable for any
 * individual user's upload history.
 */
export async function uploadPortfolioOriginal(input: {
  userId: string;
  bytes: Uint8Array;
  filename?: string;
}): Promise<{ path: string; hash: string }> {
  const hash = createHash("sha256").update(input.bytes).digest("hex");
  // Preserve the extension from filename when supplied; default to
  // .pdf since the upload flow only accepts PDFs for portfolios.
  const ext = input.filename?.match(/\.([a-zA-Z0-9]+)$/)?.[1]?.toLowerCase() ??
    "pdf";
  const path = `${input.userId}/${hash.slice(0, 16)}.${ext}`;

  const supabase = getServiceClient();
  const { error } = await supabase.storage
    .from(PORTFOLIO_UPLOADS_BUCKET)
    .upload(path, input.bytes, {
      contentType: "application/pdf",
      upsert: true, // Idempotent re-upload: same hash → same path → overwrite (no-op).
    });

  if (error) {
    throw new Error(`Failed to upload portfolio to Storage: ${error.message}`);
  }

  return { path, hash };
}

/**
 * Fetch the raw bytes of an uploaded portfolio by its storage path.
 * Called from inside the workflow's extract step, which runs without
 * a Supabase session, so we use the service-role client.
 */
export async function downloadPortfolioOriginal(
  path: string,
): Promise<Uint8Array> {
  const supabase = getServiceClient();
  const { data, error } = await supabase.storage
    .from(PORTFOLIO_UPLOADS_BUCKET)
    .download(path);
  if (error) {
    throw new Error(
      `Failed to download portfolio from Storage (path=${path}): ${error.message}`,
    );
  }
  const ab = await data.arrayBuffer();
  return new Uint8Array(ab);
}

/**
 * Delete the original from Storage. Called by the revoke flow so the
 * user's right to erasure (GDPR) is honoured end-to-end: revoking
 * removes both the searchable anonymised chunks AND the raw bytes.
 * Idempotent — missing object is treated as success.
 */
export async function deletePortfolioOriginal(path: string): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase.storage
    .from(PORTFOLIO_UPLOADS_BUCKET)
    .remove([path]);
  // Supabase returns an error object if the key doesn't exist — which
  // for revoke is fine. Only re-throw on unexpected failure modes.
  if (error && !/not found/i.test(error.message)) {
    throw new Error(
      `Failed to delete portfolio from Storage (path=${path}): ${error.message}`,
    );
  }
}
