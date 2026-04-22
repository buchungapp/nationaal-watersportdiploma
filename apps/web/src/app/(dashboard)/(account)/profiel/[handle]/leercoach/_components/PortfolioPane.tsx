"use client";

import {
  ArrowUturnLeftIcon,
  ClockIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";
import { useState, useTransition } from "react";
import { SimpleMarkdown } from "~/app/_components/ai-chat";
import {
  labelPortfolioVersionAction,
  revertPortfolioToVersionAction,
} from "../portfolio-actions";
import { PortfolioEditor } from "./PortfolioEditor";

// Right-hand pane of the side-by-side chat+doc layout. Two tabs:
//   - Bewerken: the TipTap editor on the current version
//   - Geschiedenis: list of all versions, click to preview, revert
//
// v2 changes vs v1:
//   - No more "Portfolio / Klaar" sub-header — save status lives as a
//     floating pill inside the editor (see PortfolioEditor).
//   - Pane itself is chrome-less (no border / rounded / shadow). The
//     parent panel in ChatShell owns the card; this pane is just a
//     tonal-tinted column inside that card.
//   - History preview renders markdown via SimpleMarkdown instead of
//     a raw <pre>, so historical versions look like documents not
//     like code.

export type PortfolioVersionSummary = {
  versionId: string;
  createdBy: "coach" | "user" | "imported";
  label: string | null;
  changeNote: string | null;
  createdAt: string;
  contentLength: number;
};

type Props = {
  portfolioId: string;
  currentVersionId: string | null;
  currentContent: string;
  versions: PortfolioVersionSummary[];
  handle: string;
  chatId: string;
};

type Tab = "edit" | "history";

export function PortfolioPane({
  portfolioId,
  currentVersionId,
  currentContent,
  versions,
  handle,
  chatId,
}: Props) {
  const [tab, setTab] = useState<Tab>("edit");
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Slim tab strip — the only chrome the pane carries. Save
          status moves to a floating pill inside the editor
          (bottom-right), so we don't need a sub-header row here. */}
      <nav
        aria-label="Portfolio paneel"
        className="flex shrink-0 items-center gap-1 border-b border-slate-200 bg-stone-50 px-2 py-1"
      >
        <TabButton
          active={tab === "edit"}
          onClick={() => {
            setTab("edit");
            setPreviewVersionId(null);
          }}
          icon={<DocumentTextIcon className="size-3.5" aria-hidden="true" />}
        >
          Bewerken
        </TabButton>
        <TabButton
          active={tab === "history"}
          onClick={() => setTab("history")}
          icon={<ClockIcon className="size-3.5" aria-hidden="true" />}
        >
          Geschiedenis
          <span className="ml-1 inline-flex items-center rounded-full bg-slate-200/70 px-1.5 text-[10px] font-semibold text-slate-600">
            {versions.length}
          </span>
        </TabButton>
      </nav>
      <div className="flex flex-1 overflow-hidden">
        {tab === "edit" ? (
          <div className="flex-1 overflow-hidden">
            <PortfolioEditor
              portfolioId={portfolioId}
              initialContent={currentContent}
              initialVersionId={currentVersionId}
              handle={handle}
              chatId={chatId}
            />
          </div>
        ) : (
          <HistoryView
            portfolioId={portfolioId}
            versions={versions}
            currentVersionId={currentVersionId}
            previewVersionId={previewVersionId}
            onPreview={setPreviewVersionId}
            handle={handle}
            chatId={chatId}
          />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
          : "text-slate-500 hover:bg-white/60 hover:text-slate-900"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

// ---- History view ----
//
// Left column: chronological list, newest first. Current version is
// marked with a blue left-accent bar. Click any row to open a
// read-only preview on the right (rendered markdown, not raw pre).
// Revert creates a new version whose content matches the selected
// one — does not destroy history.

function HistoryView({
  portfolioId,
  versions,
  currentVersionId,
  previewVersionId,
  onPreview,
  handle,
  chatId,
}: {
  portfolioId: string;
  versions: PortfolioVersionSummary[];
  currentVersionId: string | null;
  previewVersionId: string | null;
  onPreview: (id: string) => void;
  handle: string;
  chatId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  function selectPreview(versionId: string) {
    onPreview(versionId);
    setPreviewContent(null);
    setPreviewError(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/leercoach/portfolio/${portfolioId}/version/${versionId}`,
        );
        if (!res.ok) {
          setPreviewError(`HTTP ${res.status}`);
          return;
        }
        const body = (await res.json()) as { content?: string };
        setPreviewContent(body.content ?? "");
      } catch (err) {
        setPreviewError(
          err instanceof Error ? err.message : "Kon versie niet laden.",
        );
      }
    });
  }

  function revert(targetVersionId: string) {
    if (
      !window.confirm(
        "Weet je zeker dat je deze versie wilt terugzetten? Er wordt een nieuwe versie aangemaakt gebaseerd op deze.",
      )
    ) {
      return;
    }
    startTransition(async () => {
      try {
        await revertPortfolioToVersionAction({
          portfolioId,
          targetVersionId,
          handle,
          chatId,
        });
        onPreview(targetVersionId);
      } catch (err) {
        setPreviewError(
          err instanceof Error ? err.message : "Terugzetten mislukt.",
        );
      }
    });
  }

  function label(versionId: string, currentLabel: string | null) {
    const next = window.prompt(
      "Label voor deze versie (leeg om te verwijderen):",
      currentLabel ?? "",
    );
    if (next === null) return;
    const normalized = next.trim();
    startTransition(async () => {
      try {
        await labelPortfolioVersionAction({
          versionId,
          label: normalized.length > 0 ? normalized : null,
          handle,
          chatId,
        });
      } catch (err) {
        setPreviewError(
          err instanceof Error ? err.message : "Label opslaan mislukt.",
        );
      }
    });
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
        Nog geen versies. Zodra de coach of jij een draft opslaat, verschijnen
        ze hier.
      </div>
    );
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      <ul className="flex w-56 shrink-0 flex-col overflow-y-auto border-r border-slate-200 bg-stone-50">
        {versions.map((v, i) => {
          const isCurrent = v.versionId === currentVersionId;
          const isPreview = v.versionId === previewVersionId;
          const n = versions.length - i;
          return (
            <li key={v.versionId} className="relative">
              {/* Left-accent bar for the current version — tighter
                  than a standalone "huidig" pill, reads as "this is
                  where you are now" at a glance. */}
              {isCurrent ? (
                <span
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 w-0.5 bg-blue-500"
                />
              ) : null}
              <button
                type="button"
                onClick={() => selectPreview(v.versionId)}
                className={`flex w-full flex-col gap-0.5 border-b border-slate-200 px-3 py-2 text-left text-xs transition-colors ${
                  isPreview
                    ? "bg-white text-slate-900"
                    : "text-slate-700 hover:bg-white/60"
                }`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-semibold">v{n}</span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(v.createdAt).toLocaleString("nl-NL", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex flex-wrap items-baseline gap-1">
                  <AuthorBadge createdBy={v.createdBy} />
                  {v.label ? (
                    <span
                      className="inline-flex max-w-full items-center truncate rounded-full bg-amber-50 px-1.5 text-[10px] font-medium text-amber-800"
                      title={v.label}
                    >
                      {v.label}
                    </span>
                  ) : null}
                </div>
                {v.changeNote ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {v.changeNote}
                  </p>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        {previewVersionId ? (
          <>
            <div className="flex shrink-0 items-center justify-end gap-1 border-b border-slate-200 bg-stone-50 px-3 py-1.5">
              {(() => {
                const current = versions.find(
                  (v) => v.versionId === previewVersionId,
                );
                if (!current) return null;
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => label(current.versionId, current.label)}
                      disabled={isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      {current.label ? "Label wijzigen" : "Label toevoegen"}
                    </button>
                    {current.versionId !== currentVersionId ? (
                      <button
                        type="button"
                        onClick={() => revert(current.versionId)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900 disabled:opacity-50"
                      >
                        <ArrowUturnLeftIcon
                          aria-hidden="true"
                          className="size-3"
                        />
                        Terugzetten
                      </button>
                    ) : null}
                  </>
                );
              })()}
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6">
              {previewError ? (
                <p className="text-sm text-red-700">{previewError}</p>
              ) : previewContent === null ? (
                <p className="text-sm text-slate-500">Versie laden…</p>
              ) : (
                // Render via SimpleMarkdown so historical versions
                // display as documents (headings, lists, blockquotes
                // all styled) rather than raw monospace text. Wrap
                // in the same narrow-column + prose styling as the
                // live editor for visual continuity between
                // "editing" and "reading."
                <div className="mx-auto max-w-[72ch] [&>div]:prose [&>div]:prose-slate [&>div]:max-w-none">
                  <SimpleMarkdown text={previewContent} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center p-8 text-sm text-slate-500">
            Klik op een versie in de lijst om te bekijken.
          </div>
        )}
      </div>
    </div>
  );
}

function AuthorBadge({
  createdBy,
}: {
  createdBy: "coach" | "user" | "imported";
}) {
  const tone =
    createdBy === "coach"
      ? "bg-emerald-50 text-emerald-800"
      : createdBy === "user"
        ? "bg-slate-100 text-slate-700"
        : "bg-violet-50 text-violet-800";
  const label =
    createdBy === "coach"
      ? "coach"
      : createdBy === "user"
        ? "kandidaat"
        : "geïmporteerd";
  return (
    <span
      className={`inline-flex items-center rounded-full px-1.5 text-[10px] font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
