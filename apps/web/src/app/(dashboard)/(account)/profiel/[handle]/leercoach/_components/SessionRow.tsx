"use client";

import { TrashIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { unstable_rethrow } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteChatAction } from "../actions";

type Props = {
  handle: string;
  chatId: string;
  title: string;
  subtitle: string;
};

// One row in the chat list. Renders as a link to the chat; the delete
// affordance lives inside the row (stopPropagation on click so it
// doesn't navigate). Two-click pattern prevents accidental deletions
// without a full modal: first click on the trash icon reveals the
// explicit "Verwijder / Annuleer" pair; second click soft-deletes.
//
// Visual weight: the trash icon is small + muted in idle state —
// only lights up on hover and (of course) during the confirm flow.
// Keeps the row's visual rhythm about the CONTENT, not the delete.
export function SessionRow({ handle, chatId, title, subtitle }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deleteChatAction({ chatId, handle });
      } catch (err) {
        // Let Next.js redirect/notFound sentinels propagate (no-op
        // for regular errors). Defensive — deleteChatAction doesn't
        // redirect today but might in future.
        unstable_rethrow(err);
        console.error("Failed to delete chat", err);
        setConfirming(false);
      }
    });
  }

  function handleConfirmRequest(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(true);
  }

  function handleCancel(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirming(false);
  }

  // Padding-right grows when the confirm UI is expanded so the two
  // buttons have room without running over the title text.
  const rowPaddingRight = confirming ? "pr-44" : "pr-14";

  return (
    <div className="relative group">
      <Link
        href={`/profiel/${handle}/leercoach/chat/${chatId}`}
        className={`block rounded-xl border border-zinc-200 bg-white p-4 ${rowPaddingRight} transition-colors hover:border-branding-light/40 hover:bg-branding-light/5`}
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-500">{subtitle}</span>
        </div>
      </Link>

      {/* Delete affordance — absolutely positioned so it sits on top of
          the Link without breaking click-anywhere-to-open. In idle
          state it's a small muted trash icon that only foregrounds on
          hover; when confirming, it expands into the explicit pair. */}
      <div className="absolute inset-y-0 right-3 flex items-center gap-2">
        {confirming ? (
          <>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-60"
            >
              {isPending ? "…" : "Verwijder"}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
            >
              Annuleer
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleConfirmRequest}
            aria-label="Verwijder deze sessie"
            title="Verwijderen"
            className="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-[color,background-color,opacity] group-hover:opacity-100 hover:bg-red-50 hover:text-red-600 focus:opacity-100"
          >
            <TrashIcon aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
    </div>
  );
}
