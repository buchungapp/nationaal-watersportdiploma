"use server";

import { AiCorpus } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import {
  getUserOrThrow,
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import {
  ingestPortfolio,
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
      sourceId: string;
      chunkCount: number;
      pageCount: number;
      alreadyIngested: boolean;
    }
  | { ok: false; reason: string };

/**
 * Accept a portfolio PDF upload, run it through the extract + anonymize
 * + ingest pipeline, and return a summary for the UI.
 *
 * A kwalificatieprofiel is required: it already encodes richting +
 * niveau. Coverage (whole profiel vs. specific kerntaken) is optional
 * metadata — default is the whole profiel.
 *
 * Revalidates both the portfolios management page AND the leercoach
 * session list for this handle so existing tabs reflect the new data.
 * The pipeline is idempotent (source_hash dedup) so re-uploading the
 * same PDF returns the existing row without touching anything.
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

  const handleRaw = formData.get("handle");
  const handle = typeof handleRaw === "string" ? handleRaw : null;

  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  try {
    const result = await ingestPortfolio({
      userId: user.authUserId,
      pdfBytes: bytes,
      profielId,
      richting: resolved.richting,
      niveauRang: resolved.niveauRang,
      coverage,
      label,
    });
    if (handle) {
      revalidatePath(`/profiel/${handle}/portfolios`);
      revalidatePath(`/profiel/${handle}/leercoach`);
      revalidatePath(`/profiel/${handle}`);
    }
    return {
      ok: true,
      sourceId: result.sourceId,
      chunkCount: result.chunkCount,
      pageCount: result.pageCount,
      alreadyIngested: result.alreadyIngested,
    };
  } catch (err) {
    console.error("Portfolio ingest failed", err);
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
 * Soft-delete (revoke) a portfolio source. userId scoping in the core
 * helper prevents cross-user revocations.
 */
export async function revokePortfolioAction(input: {
  sourceId: string;
  handle: string;
}): Promise<void> {
  const user = await getUserOrThrow();
  await AiCorpus.revokeUserPriorSource({
    userId: user.authUserId,
    sourceId: input.sourceId,
  });
  revalidatePath(`/profiel/${input.handle}/portfolios`);
  revalidatePath(`/profiel/${input.handle}/leercoach`);
}
