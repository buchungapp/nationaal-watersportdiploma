"use client";

// User-facing TipTap editor for the portfolio document. The coach also
// writes into the same underlying version stream (via the saveDraft
// tool), so this component isn't the only writer — it's just the one
// the kandidaat drives with their keyboard.
//
// Design contract:
//   - Markdown is the source of truth in the DB. TipTap's `@tiptap/
//     markdown` extension handles the round-trip: we pass markdown in,
//     read markdown out via `editor.getMarkdown()`. No JSON doc in the
//     DB; keeps exports, diffs, and cross-tool use simple.
//   - Auto-save on idle (2s after last keystroke). Content-hash dedup
//     inside saveVersion means typing-then-undo won't produce spurious
//     rows; the server drops no-op saves.
//   - Cmd+S is the "label this" path — opens a tiny prompt, saves
//     with the label. A labeled save is still just a normal version
//     row with `label` set.
//   - When a new version arrives from the server (coach saved, or
//     another tab edited), the page re-renders with a new
//     `initialVersionId`. That resets the editor content — but only
//     if the user isn't in the middle of their own edit burst. We
//     guard with a ref that tracks "has the user touched the editor
//     since last sync?".
//
// v2 changes vs v1:
//   - No own top header row. Save status is a floating pill in the
//     bottom-right corner (like Google Docs) that auto-fades when
//     idle, so the editor surface is maximal prose real estate.
//   - Narrow reading column: content constrained to ~72ch with
//     generous horizontal gutters. Long portfolio drafts become
//     readable without chasing long lines edge-to-edge.
//   - Prose typography tuned for Dutch body text: left-aligned (not
//     justified — Dutch handles justification poorly, producing
//     wide inter-word gaps), line-height 1.65, tighter heading
//     scale.
//   - First-child margin reset so the doc opens flush with the pane
//     top instead of a stack of default-margin padding.

import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { Markdown } from "@tiptap/markdown";
import { EditorContent, useEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveUserPortfolioVersionAction } from "../portfolio-actions";

// Auto-save fires after 2s of keyboard idle. Typical typing cadence
// is 150-200ms between keystrokes; 2s gives the user a natural
// "took my hands off" signal without waiting so long that an
// accidental tab-close loses work.
const AUTO_SAVE_DEBOUNCE_MS = 2_000;

// How long the "Opgeslagen" acknowledgement stays visible before
// fading back to the resting state. 2.5s matches Google Docs — long
// enough to register, short enough not to linger.
const SAVED_ACK_MS = 2_500;

type SaveStatus =
  | { kind: "idle" }
  | { kind: "dirty" }
  | { kind: "saving" }
  | { kind: "saved"; at: number }
  | { kind: "error"; message: string };

type Props = {
  portfolioId: string;
  /** Markdown of the current latest version, or empty string for a fresh doc. */
  initialContent: string;
  /**
   * Identifies which version `initialContent` came from. When this
   * changes from outside (coach saves a new version) the editor
   * re-syncs IF the user hasn't touched it since the last sync.
   */
  initialVersionId: string | null;
  handle: string;
  chatId: string;
};

export function PortfolioEditor({
  portfolioId,
  initialContent,
  initialVersionId,
  handle,
  chatId,
}: Props) {
  const [status, setStatus] = useState<SaveStatus>({ kind: "idle" });

  const userTouchedRef = useRef(false);
  const latestContentRef = useRef(initialContent);
  const lastSyncedVersionIdRef = useRef(initialVersionId);

  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    immediatelyRender: false,
    content: initialContent,
    contentType: "markdown",
    editorProps: {
      attributes: {
        // Prose classes applied to the actual ProseMirror root.
        // `prose-slate` gives the palette; `max-w-none` disables the
        // default max-width so we can control the reading column
        // width from the outer wrapper (which centers via mx-auto).
        // Specific overrides for Dutch readability:
        //   - `text-left` explicitly (default anyway but cancel any
        //     ancestor text-justify that might leak in).
        //   - Tighter heading hierarchy (prose's default can feel
        //     shouty in a narrow pane).
        //   - First-child margin-reset — ProseMirror + prose adds a
        //     top margin to the first block; kill it so the doc
        //     starts flush with the scroll area.
        class: [
          "prose prose-slate max-w-none focus:outline-none",
          "text-left",
          "leading-[1.65]",
          "prose-headings:font-semibold prose-headings:tracking-tight prose-headings:leading-[1.3]",
          "prose-h1:text-2xl prose-h1:mt-8 prose-h1:mb-4",
          "prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3",
          "prose-h3:text-lg prose-h3:mt-5 prose-h3:mb-2",
          "prose-p:my-3",
          "prose-ul:my-3 prose-ol:my-3",
          "prose-li:my-1",
          "prose-blockquote:my-4 prose-blockquote:border-slate-300",
          "[&>*:first-child]:mt-0",
          "min-h-[400px]",
        ].join(" "),
      },
    },
    onUpdate: ({ editor }) => {
      userTouchedRef.current = true;
      const markdown = editor.getMarkdown();
      latestContentRef.current = markdown;
      if (
        markdown === initialContent &&
        initialVersionId === lastSyncedVersionIdRef.current
      ) {
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({ kind: "dirty" });
      scheduleAutoSave();
    },
  });

  const triggerSave = useCallback(
    async (options?: { label?: string; changeNote?: string }) => {
      const content = latestContentRef.current;
      if (!content || !content.trim()) return;
      setStatus({ kind: "saving" });
      try {
        const result = await saveUserPortfolioVersionAction({
          portfolioId,
          content,
          label: options?.label,
          changeNote: options?.changeNote,
          handle,
          chatId,
        });
        userTouchedRef.current = false;
        lastSyncedVersionIdRef.current = result.versionId;
        setStatus({ kind: "saved", at: Date.now() });
      } catch (err) {
        setStatus({
          kind: "error",
          message: err instanceof Error ? err.message : "Opslaan mislukt.",
        });
      }
    },
    [portfolioId, handle, chatId],
  );

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleAutoSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void triggerSave();
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [triggerSave]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  // Auto-fade of the "saved" acknowledgement. After SAVED_ACK_MS of a
  // saved state with no further edits, drop back to idle so the pill
  // disappears. Done via timer rather than CSS transition so dirty
  // events can interrupt cleanly.
  useEffect(() => {
    if (status.kind !== "saved") return;
    const t = setTimeout(() => {
      setStatus((current) =>
        current.kind === "saved" ? { kind: "idle" } : current,
      );
    }, SAVED_ACK_MS);
    return () => clearTimeout(t);
  }, [status]);

  // External sync: when props bring in a NEW initialVersionId (e.g.
  // coach just saved v4), replace the editor content IF the user
  // hasn't typed since the last sync.
  useEffect(() => {
    if (!editor) return;
    if (initialVersionId === lastSyncedVersionIdRef.current) return;
    if (userTouchedRef.current) return;
    editor.commands.setContent(initialContent, {
      contentType: "markdown",
    });
    lastSyncedVersionIdRef.current = initialVersionId;
  }, [editor, initialContent, initialVersionId]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const isSave = (e.metaKey || e.ctrlKey) && e.key === "s";
      if (!isSave) return;
      e.preventDefault();
      const label = window.prompt(
        "Label voor deze versie? (leeg laten voor een gewone versie)",
        "",
      );
      void triggerSave({ label: label?.trim() || undefined });
    },
    [triggerSave],
  );

  return (
    <div className="relative flex h-full flex-col bg-stone-50">
      {/* biome-ignore lint/a11y/noStaticElementInteractions: scroll container; captures Ctrl/Cmd+S to save (TipTap is inside) */}
      <div
        onKeyDown={handleKeyDown}
        className="flex-1 overflow-y-auto overscroll-contain"
      >
        {/* Narrow reading column. ~72ch is the typography-research
            sweet spot for long-form body text; anything wider makes
            lines hard to track at the end. Generous `py-8` top-
            bottom so the first and last blocks breathe against the
            scroll edges. */}
        <div className="mx-auto max-w-[72ch] px-6 py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
      {/* Floating save pill, bottom-right. Auto-fades when the
          editor is idle (no dirty state, no recent save). Visible
          states: dirty (amber), saving (blue pulse), saved-just-now
          (green ack), error (red). aria-live so screen readers
          pick up transitions without the visual polling. */}
      <SaveIndicator status={status} />
    </div>
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status.kind === "idle") return null;

  let tone = "";
  let label = "";
  let icon: React.ReactNode = null;

  switch (status.kind) {
    case "dirty":
      tone = "border-amber-300 bg-amber-50 text-amber-900";
      label = "Niet opgeslagen…";
      break;
    case "saving":
      tone = "border-blue-300 bg-blue-50 text-blue-900";
      label = "Opslaan…";
      break;
    case "saved":
      tone = "border-emerald-300 bg-emerald-50 text-emerald-900";
      label = "Opgeslagen";
      icon = <CheckCircleIcon className="size-3.5" aria-hidden="true" />;
      break;
    case "error":
      tone = "border-red-300 bg-red-50 text-red-900";
      label = "Opslaan mislukt";
      break;
  }

  return (
    <div
      // Floating position; `pointer-events-none` on the container so
      // a dormant pill never blocks clicks on doc content behind it.
      // Inner pill restores pointer events for its own tooltip via
      // the title attribute on hover.
      aria-live="polite"
      className="pointer-events-none absolute bottom-4 right-4 z-10"
    >
      <div
        className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm transition-opacity ${tone}`}
        title={status.kind === "error" ? status.message : undefined}
      >
        {icon}
        <span>{label}</span>
      </div>
    </div>
  );
}
