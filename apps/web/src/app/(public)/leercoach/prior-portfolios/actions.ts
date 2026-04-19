"use server";

import { AiCorpus } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { createClient } from "~/lib/supabase/server";
import { ingestPriorPortfolio } from "../_lib/prior-portfolio-pipeline";

// Max upload size. PDF portfolios in our corpus run up to ~30K words /
// 100+ pages, which compresses to roughly 8MB. 15MB gives us headroom
// without letting someone accidentally upload a GB video as a "PDF".
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export type UploadPriorPortfolioResult =
  | {
      ok: true;
      sourceId: string;
      chunkCount: number;
      pageCount: number;
      alreadyIngested: boolean;
    }
  | { ok: false; reason: string };

/**
 * Accept a prior-portfolio PDF upload, run it through the
 * extract + anonymize + ingest pipeline, and return a summary for the
 * UI. The pipeline is idempotent (source_hash dedup) so re-uploads
 * return the existing row without touching anything.
 *
 * Anonymization happens server-side before anything lands in ai_corpus,
 * so raw PII never touches our DB.
 */
export async function uploadPriorPortfolioAction(
  formData: FormData,
): Promise<UploadPriorPortfolioResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, reason: "Niet ingelogd." };
  }

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
    return {
      ok: false,
      reason: "Alleen PDF-bestanden ondersteund.",
    };
  }

  const niveauRaw = formData.get("niveauRang");
  const niveauHint =
    typeof niveauRaw === "string" && /^\d+$/.test(niveauRaw)
      ? Number(niveauRaw)
      : null;

  const labelRaw = formData.get("label");
  const label =
    typeof labelRaw === "string" && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : file.name.replace(/\.pdf$/i, "");

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  try {
    const result = await ingestPriorPortfolio({
      userId: user.id,
      pdfBytes: bytes,
      niveauHint,
      label,
    });
    revalidatePath("/leercoach/prior-portfolios");
    revalidatePath("/leercoach");
    return {
      ok: true,
      sourceId: result.sourceId,
      chunkCount: result.chunkCount,
      pageCount: result.pageCount,
      alreadyIngested: result.alreadyIngested,
    };
  } catch (err) {
    console.error("Prior-portfolio ingest failed", err);
    return {
      ok: false,
      reason:
        err instanceof Error
          ? `Verwerken mislukt: ${err.message}`
          : "Verwerken mislukt.",
    };
  }
}

/**
 * Soft-delete (revoke) a prior-portfolio source. userId scoping in the
 * core helper prevents cross-user revocations.
 */
export async function revokePriorPortfolioAction(input: {
  sourceId: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Niet ingelogd.");
  }
  await AiCorpus.revokeUserPriorSource({
    userId: user.id,
    sourceId: input.sourceId,
  });
  revalidatePath("/leercoach/prior-portfolios");
  revalidatePath("/leercoach");
}
