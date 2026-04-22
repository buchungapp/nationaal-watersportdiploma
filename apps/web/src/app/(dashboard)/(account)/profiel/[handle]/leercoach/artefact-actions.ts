"use server";

import { AiCorpus, Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { getUserOrThrow } from "~/lib/nwd";
import { type ArtefactType, ingestArtefact } from "./_lib/artefact-pipeline";
import { requireLeercoachEnabled } from "./_lib/require-leercoach-enabled";

// Server actions for the chat-scoped artefact upload flow. Three
// concerns live here:
//   1. Auth + chat-ownership check (defence-in-depth; the core helpers
//      also filter by userId, but bouncing early saves a round-trip).
//   2. Input normalisation (FormData from three entry points — file
//      picker, drag-drop, paste — all serialise into the same shape).
//   3. Revalidation so the chip strip re-fetches after upload/revoke.

// 15MB cap matches portfolios. Covers 50-page PDFs and long WhatsApp
// screenshots with headroom.
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Pasted-text cap. Server-side ceiling, not a client UX hint — the
// paste-interception threshold is much smaller (1500 chars). This
// simply blocks pathological pastes.
const MAX_TEXT_CHARS = 500_000;

const ALLOWED_MIME_TYPES = new Set<string>([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
  "image/jpeg",
  "image/webp",
]);

export type UploadArtefactResult =
  | {
      ok: true;
      artefactId: string;
      artefactType: ArtefactType;
      label: string;
      summary: string;
      chunkCount: number;
      alreadyIngested: boolean;
    }
  | { ok: false; reason: string };

/**
 * Verify the current user owns the chat. Returns the chat row or null.
 * We intentionally don't use `notFound()` here — the action returns a
 * structured error the client can render as a toast instead.
 */
async function requireChatOwnership(
  chatId: string,
): Promise<{ userId: string } | null> {
  const user = await getUserOrThrow();
  const chat = await Leercoach.Chat.getById({
    chatId,
    userId: user.authUserId,
  });
  if (!chat) return null;
  return { userId: user.authUserId };
}

/**
 * Derive a display label from the filename (or first line of pasted
 * text). Filenames lose their extension; text is truncated to ~40
 * chars. Called when the client didn't provide an explicit label.
 */
function deriveLabel(input: {
  kind: "file" | "text";
  filename?: string;
  content?: string;
}): string {
  if (input.kind === "file" && input.filename) {
    return input.filename.replace(/\.(pdf|docx|png|jpe?g|webp)$/i, "");
  }
  if (input.kind === "text" && input.content) {
    const firstLine =
      input.content.split(/\r?\n/).find((l) => l.trim().length > 0) ?? "";
    const trimmed = firstLine.trim();
    if (trimmed.length === 0) return "Geplakte tekst";
    return trimmed.length > 40 ? `${trimmed.slice(0, 40).trim()}…` : trimmed;
  }
  return "Artefact";
}

/**
 * Entry point for every artefact upload path (file-picker click,
 * drag-drop, paste). FormData fields:
 *   - kind: "file" | "text"
 *   - chatId
 *   - handle (for revalidatePath)
 *   - label?  (user-supplied; we derive one if missing)
 *   - file?   (when kind === "file")
 *   - content? (when kind === "text")
 */
export async function uploadArtefactAction(
  formData: FormData,
): Promise<UploadArtefactResult> {
  await requireLeercoachEnabled();

  const chatIdRaw = formData.get("chatId");
  const chatId = typeof chatIdRaw === "string" ? chatIdRaw : null;
  if (!chatId) {
    return { ok: false, reason: "chatId ontbreekt." };
  }

  const ctx = await requireChatOwnership(chatId);
  if (!ctx) {
    return { ok: false, reason: "Chat niet gevonden." };
  }

  const handleRaw = formData.get("handle");
  const handle = typeof handleRaw === "string" ? handleRaw : null;

  const labelRaw = formData.get("label");
  const userLabel =
    typeof labelRaw === "string" && labelRaw.trim().length > 0
      ? labelRaw.trim()
      : null;

  const kindRaw = formData.get("kind");
  const kind = kindRaw === "text" ? "text" : "file";

  try {
    if (kind === "text") {
      const contentRaw = formData.get("content");
      const content = typeof contentRaw === "string" ? contentRaw : "";
      if (content.trim().length === 0) {
        return { ok: false, reason: "Geen tekst meegestuurd." };
      }
      if (content.length > MAX_TEXT_CHARS) {
        return {
          ok: false,
          reason: `Tekst is te lang (${content.length} tekens). Max ${MAX_TEXT_CHARS}.`,
        };
      }
      const label = userLabel ?? deriveLabel({ kind: "text", content });
      const result = await ingestArtefact({
        userId: ctx.userId,
        chatId,
        kind: "text",
        content,
        label,
      });
      if (handle) {
        revalidatePath(`/profiel/${handle}/leercoach/chat/${chatId}`);
      }
      return {
        ok: true,
        artefactId: result.artefactId,
        artefactType: result.artefactType,
        label,
        summary: result.summary,
        chunkCount: result.chunkCount,
        alreadyIngested: result.alreadyIngested,
      };
    }

    // kind === "file"
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

    const mime = file.type || "";
    // Some browsers report empty or generic types — fall back to
    // filename extension.
    const fileName = file.name.toLowerCase();
    const effectiveMime = (() => {
      if (ALLOWED_MIME_TYPES.has(mime)) return mime;
      if (fileName.endsWith(".pdf")) return "application/pdf";
      if (fileName.endsWith(".docx"))
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (fileName.endsWith(".png")) return "image/png";
      if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg"))
        return "image/jpeg";
      if (fileName.endsWith(".webp")) return "image/webp";
      return "";
    })();
    if (!ALLOWED_MIME_TYPES.has(effectiveMime)) {
      return {
        ok: false,
        reason:
          "Alleen PDF, DOCX en afbeeldingen (PNG, JPG, WEBP) ondersteund.",
      };
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const label =
      userLabel ?? deriveLabel({ kind: "file", filename: file.name });

    const pipelineInput =
      effectiveMime === "application/pdf"
        ? ({ kind: "pdf", bytes, userId: ctx.userId, chatId, label } as const)
        : effectiveMime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? ({
              kind: "docx",
              bytes,
              userId: ctx.userId,
              chatId,
              label,
            } as const)
          : ({
              kind: "image",
              bytes,
              mimeType: effectiveMime,
              userId: ctx.userId,
              chatId,
              label,
            } as const);

    const result = await ingestArtefact(pipelineInput);

    if (handle) {
      revalidatePath(`/profiel/${handle}/leercoach/chat/${chatId}`);
    }

    return {
      ok: true,
      artefactId: result.artefactId,
      artefactType: result.artefactType,
      label,
      summary: result.summary,
      chunkCount: result.chunkCount,
      alreadyIngested: result.alreadyIngested,
    };
  } catch (err) {
    // Let Next.js sentinels (NEXT_REDIRECT / NEXT_NOT_FOUND thrown by
    // getUserOrThrow, notFound, redirect, etc.) propagate — the try
    // block still calls into nwd helpers that may redirect on expired
    // sessions.
    unstable_rethrow(err);
    console.error("Artefact ingest failed", err);
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
 * Soft-delete an artefact. Revalidates the chat page so the chip
 * disappears on next render.
 */
export async function revokeArtefactAction(input: {
  artefactId: string;
  chatId: string;
  handle: string;
}): Promise<{ ok: boolean; reason?: string }> {
  await requireLeercoachEnabled();
  const ctx = await requireChatOwnership(input.chatId);
  if (!ctx) {
    return { ok: false, reason: "Chat niet gevonden." };
  }
  await AiCorpus.revokeArtefact({
    artefactId: input.artefactId,
    userId: ctx.userId,
  });
  revalidatePath(`/profiel/${input.handle}/leercoach/chat/${input.chatId}`);
  return { ok: true };
}
