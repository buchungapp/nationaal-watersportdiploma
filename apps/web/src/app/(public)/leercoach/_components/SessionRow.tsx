"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteChatAction } from "../actions";

type Props = {
  chatId: string;
  title: string;
  subtitle: string;
};

// One row in the chat list. Renders as a link to the chat; the delete
// button lives inside the row (stopPropagation on click so it doesn't
// navigate). Two-click pattern prevents accidental deletions without
// a full modal: first click reveals "Weet je zeker?" and the actual
// delete button; second click soft-deletes the chat.
export function SessionRow({ chatId, title, subtitle }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      try {
        await deleteChatAction({ chatId });
      } catch (err) {
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

  return (
    <div className="relative">
      <Link
        href={`/leercoach/chat/${chatId}`}
        className="block rounded-xl border border-slate-200 bg-white p-4 pr-32 transition-colors hover:border-blue-300 hover:bg-blue-50"
      >
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{title}</span>
          <span className="text-xs text-slate-500">{subtitle}</span>
        </div>
      </Link>

      {/* Delete UI lives in an absolutely-positioned overlay so it sits
          on top of the Link without breaking the click-anywhere-to-open
          default. */}
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
            className="rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700"
          >
            Verwijder
          </button>
        )}
      </div>
    </div>
  );
}
