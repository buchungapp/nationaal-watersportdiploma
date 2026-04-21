"use server";

import { Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { getUserOrThrow } from "~/lib/nwd";
import { requireLeercoachEnabled } from "./_lib/require-leercoach-enabled";

// Server actions that back the user-facing portfolio editor + history
// sidebar. Each one mirrors a core-model command with auth + revalidate
// glue around it. Kept in a dedicated file (not merged with the main
// `actions.ts`) so the chat and doc surfaces can evolve independently.

/**
 * Save a user-initiated edit as a new portfolio version. Called by the
 * TipTap editor's debounced auto-save + the explicit Cmd+S path.
 *
 * Content-hash dedup happens in the core model — consecutive auto-saves
 * of the same text collapse to one version automatically.
 */
export async function saveUserPortfolioVersionAction(input: {
  portfolioId: string;
  content: string;
  /** Set by Cmd+S; auto-save path omits. */
  label?: string;
  /** Optional user-supplied note ("cleaned up typos in 5.3"). */
  changeNote?: string;
  /** Handle for revalidate path scoping. */
  handle: string;
  /** Chat id for revalidate scoping. */
  chatId: string;
}): Promise<{ versionId: string; created: boolean }> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();
  const result = await Leercoach.Portfolio.saveVersion({
    portfolioId: input.portfolioId,
    userId: user.authUserId,
    content: input.content,
    createdBy: "user",
    label: input.label,
    changeNote: input.changeNote,
  });
  // Only revalidate on a real insert — no-op saves don't need a
  // cache bust.
  if (result.created) {
    revalidatePath(
      `/profiel/${input.handle}/leercoach/chat/${input.chatId}`,
    );
  }
  return result;
}

/**
 * Label a version after the fact. UX use-case: user scrolls history,
 * decides "this is the one I submitted", clicks to label it. Pass
 * label=null to clear a label.
 */
export async function labelPortfolioVersionAction(input: {
  versionId: string;
  label: string | null;
  handle: string;
  chatId: string;
}): Promise<void> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();
  await Leercoach.Portfolio.labelVersion({
    versionId: input.versionId,
    userId: user.authUserId,
    label: input.label,
  });
  revalidatePath(
    `/profiel/${input.handle}/leercoach/chat/${input.chatId}`,
  );
}

/**
 * Revert the portfolio to a historical version. Implemented as
 * "create a new version whose content equals the old one" rather
 * than mutating anything — keeps history honest (the revert itself
 * is visible in the timeline).
 *
 * Bumps current_version_id on the portfolio via saveVersion.
 */
export async function revertPortfolioToVersionAction(input: {
  portfolioId: string;
  targetVersionId: string;
  handle: string;
  chatId: string;
}): Promise<{ versionId: string }> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();
  const target = await Leercoach.Portfolio.getVersionById({
    versionId: input.targetVersionId,
    userId: user.authUserId,
  });
  if (!target) {
    throw new Error("Versie niet gevonden.");
  }
  const { versionId } = await Leercoach.Portfolio.saveVersion({
    portfolioId: input.portfolioId,
    userId: user.authUserId,
    content: target.content,
    createdBy: "user",
    changeNote: `Teruggezet naar een eerdere versie (${new Date(
      target.createdAt,
    ).toLocaleString("nl-NL")}).`,
  });
  revalidatePath(
    `/profiel/${input.handle}/leercoach/chat/${input.chatId}`,
  );
  return { versionId };
}
