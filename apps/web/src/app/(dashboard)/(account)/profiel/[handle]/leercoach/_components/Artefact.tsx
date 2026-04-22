"use client";

// Compound component for the per-chat artefact flow.
//
// Follows the same patterns as the AiChat compound:
//   - architecture-compound-components: Provider + children read context
//   - state-context-interface: `{ state, actions, meta }` shape
//   - state-decouple-implementation: only the Provider knows how the
//     upload/revoke state is managed; consumers see the interface
//   - patterns-children-over-render-props: pieces are siblings, not
//     render-props
//   - react19-no-forwardref: ref-less; context via `use()`
//
// Consumer pattern:
//
//   <Artefact.Provider handle={...} chatId={...} initialArtefacten={...}>
//     <Artefact.ErrorBanner />
//     <Artefact.UploadButton />
//     <Artefact.ChipStrip />
//     <Artefact.Dialog />          {/* mounted somewhere in the tree */}
//   </Artefact.Provider>
//
// The handle for wiring AiChatWindow's paste interceptor lives at
// `useArtefactPasteHandler()` — a narrow hook so the one consumer that
// needs it doesn't pull the whole context.

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import {
  ArrowUpTrayIcon,
  DocumentIcon,
  DocumentTextIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { unstable_rethrow } from "next/navigation";
import {
  type ChangeEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  type AiChatDropHandler,
  type AiChatPasteHandler,
  type AiChatSubmitBlock,
  useAiChatContext,
} from "~/app/_components/ai-chat";
import {
  revokeArtefactAction,
  uploadArtefactAction,
} from "../artefact-actions";
import {
  type ArtefactActions,
  ArtefactContext,
  type ArtefactContextValue,
  type ArtefactMeta,
  type ArtefactRow,
  type ArtefactState,
  type PendingArtefactChip,
  useArtefactContext,
} from "./artefact-context";

// ---- Provider ----

type ProviderProps = {
  handle: string;
  chatId: string;
  initialArtefacten: ArtefactRow[];
  children: ReactNode;
};

function Provider({
  handle,
  chatId,
  initialArtefacten,
  children,
}: ProviderProps) {
  const [artefacten, setArtefacten] =
    useState<ArtefactRow[]>(initialArtefacten);
  const [pending, setPending] = useState<PendingArtefactChip[]>([]);
  // Staged = uploaded in this session, not yet committed via message
  // send. ChipStrip renders only these; `commitStaged()` clears the
  // set when the user sends. Initial value is empty so page reloads
  // start with a clean composer even if artefacten already exist in
  // the chat (they're reachable via the leercoach's tool).
  const [stagedIds, setStagedIds] = useState<Set<string>>(() => new Set());
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const dismissError = useCallback(() => setError(null), []);
  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const commitStaged = useCallback(() => setStagedIds(new Set()), []);

  // Shared helper: stage a pending chip, run the server action,
  // swap/remove on ack. Keeps the two upload paths (file + text) from
  // diverging on state-transition logic.
  const runUpload = useCallback(
    async (args: {
      pending: PendingArtefactChip;
      buildFormData: () => FormData;
    }): Promise<void> => {
      setPending((prev) => [...prev, args.pending]);
      setError(null);
      try {
        const result = await uploadArtefactAction(args.buildFormData());
        setPending((prev) =>
          prev.filter((p) => p.pendingId !== args.pending.pendingId),
        );
        if (!result.ok) {
          setError(result.reason);
          return;
        }
        setArtefacten((prev) => {
          // De-dup: server returns the same artefactId for duplicate
          // content (source_hash match) — don't push a second row.
          if (prev.some((a) => a.artefactId === result.artefactId)) {
            return prev;
          }
          return [
            {
              artefactId: result.artefactId,
              label: result.label,
              artefactType: result.artefactType,
              summary: result.summary,
              chunkCount: result.chunkCount,
            },
            ...prev,
          ];
        });
        // Stage the chip so it appears in the composer strip until
        // the user sends a message. De-dup the Set the same way as
        // `artefacten`: a duplicate upload of an already-staged id
        // shouldn't flash anything new.
        setStagedIds((prev) => {
          if (prev.has(result.artefactId)) return prev;
          const next = new Set(prev);
          next.add(result.artefactId);
          return next;
        });
      } catch (err) {
        // Let Next.js sentinels (NEXT_REDIRECT / NEXT_NOT_FOUND)
        // propagate; only intercept real errors for the banner.
        unstable_rethrow(err);
        setPending((prev) =>
          prev.filter((p) => p.pendingId !== args.pending.pendingId),
        );
        setError(err instanceof Error ? err.message : "Uploaden mislukt.");
      }
    },
    [],
  );

  const uploadFile = useCallback<ArtefactActions["uploadFile"]>(
    async ({ file, labelOverride }) => {
      const artefactType = artefactTypeFromFile(file);
      const displayLabel =
        labelOverride ?? file.name.replace(/\.(pdf|docx|png|jpe?g|webp)$/i, "");
      await runUpload({
        pending: {
          pendingId: makePendingId(),
          label: displayLabel,
          artefactType,
        },
        buildFormData: () => {
          const fd = new FormData();
          fd.append("kind", "file");
          fd.append("file", file);
          fd.append("chatId", chatId);
          fd.append("handle", handle);
          if (labelOverride) fd.append("label", labelOverride);
          return fd;
        },
      });
    },
    [chatId, handle, runUpload],
  );

  const uploadText = useCallback<ArtefactActions["uploadText"]>(
    async ({ content, labelOverride }) => {
      const firstLine =
        content.split(/\r?\n/).find((l) => l.trim().length > 0) ??
        "Geplakte tekst";
      const displayLabel =
        labelOverride ??
        (firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine);
      await runUpload({
        pending: {
          pendingId: makePendingId(),
          label: displayLabel,
          artefactType: "text",
        },
        buildFormData: () => {
          const fd = new FormData();
          fd.append("kind", "text");
          fd.append("content", content);
          fd.append("chatId", chatId);
          fd.append("handle", handle);
          if (labelOverride) fd.append("label", labelOverride);
          return fd;
        },
      });
    },
    [chatId, handle, runUpload],
  );

  const revoke = useCallback<ArtefactActions["revoke"]>(
    async (artefactId) => {
      const snapshot = artefacten;
      const stagedSnapshot = stagedIds;
      // Optimistic remove — snap back if the server rejects. Staged
      // set prunes in the same transition so the chip disappears
      // immediately.
      setArtefacten((prev) => prev.filter((a) => a.artefactId !== artefactId));
      setStagedIds((prev) => {
        if (!prev.has(artefactId)) return prev;
        const next = new Set(prev);
        next.delete(artefactId);
        return next;
      });
      try {
        const res = await revokeArtefactAction({
          artefactId,
          chatId,
          handle,
        });
        if (!res.ok) {
          setArtefacten(snapshot);
          setStagedIds(stagedSnapshot);
          setError(res.reason ?? "Verwijderen mislukt.");
        }
      } catch (err) {
        unstable_rethrow(err);
        setArtefacten(snapshot);
        setStagedIds(stagedSnapshot);
        setError(err instanceof Error ? err.message : "Verwijderen mislukt.");
      }
    },
    [artefacten, stagedIds, chatId, handle],
  );

  // Paste handler bound to the AiChat composer's onPaste event.
  // Image-first: OS screenshot pastes take precedence over any
  // accompanying text the app might have added.
  const handlePaste = useCallback<AiChatPasteHandler>(
    async (input) => {
      if (input.kind === "image") {
        const ext = input.file.type.split("/")[1] || "png";
        const renamed = new File(
          [input.file],
          `Geplakte afbeelding ${new Date().toLocaleTimeString("nl-NL")}.${ext}`,
          { type: input.file.type || "image/png" },
        );
        await uploadFile({ file: renamed });
        return true;
      }
      await uploadText({ content: input.content });
      return true;
    },
    [uploadFile, uploadText],
  );

  // Drop handler bound to the AiChat frame's onDrop event. Runs the
  // allowed-type filter in the browser so the user sees an immediate
  // error banner when they drop something we don't support; the
  // server also validates (defence-in-depth). Mixed drops (some valid,
  // some not) ingest the valid files and warn about the skipped ones.
  const handleDrop = useCallback<AiChatDropHandler>(
    async (files) => {
      const accepted: File[] = [];
      const rejected: File[] = [];
      for (const file of files) {
        if (isAcceptedUploadFile(file)) accepted.push(file);
        else rejected.push(file);
      }
      if (rejected.length > 0) {
        setError(
          `Overgeslagen: ${rejected
            .map((f) => f.name)
            .join(", ")} — alleen PDF, DOCX en afbeeldingen ondersteund.`,
        );
      }
      // Kick off all accepted uploads in parallel; each one claims its
      // own pending chip so progress is visible per-file.
      await Promise.all(accepted.map((file) => uploadFile({ file })));
      return true;
    },
    [uploadFile],
  );

  const state: ArtefactState = {
    artefacten,
    pending,
    stagedIds,
    error,
    dialogOpen,
  };
  const actions: ArtefactActions = {
    uploadFile,
    uploadText,
    revoke,
    dismissError,
    openDialog,
    closeDialog,
    commitStaged,
  };
  // Block chat submission while any artefact is still processing. The
  // server-side extract + LLM summary step takes a few seconds per
  // file; letting the user hit send in that window would race the
  // chat turn past the artefact's DB commit, so the leercoach's
  // `listArtefacten` tool would return an empty list and the model
  // would act as if the attachment didn't exist.
  const submitBlock: AiChatSubmitBlock =
    pending.length === 0
      ? null
      : {
          reason:
            pending.length === 1
              ? "Nog bezig met verwerken van je upload…"
              : `Nog bezig met verwerken van ${pending.length} uploads…`,
        };

  const meta: ArtefactMeta = { handlePaste, handleDrop, submitBlock };

  const value = useMemo<ArtefactContextValue>(
    () => ({ state, actions, meta }),
    // biome-ignore lint/correctness/useExhaustiveDependencies: explicit listing is clearer than memoising every field
    [actions, meta, state],
  );

  return <ArtefactContext value={value}>{children}</ArtefactContext>;
}

// ---- ErrorBanner ----

function ErrorBanner() {
  const {
    state: { error },
    actions: { dismissError },
  } = useArtefactContext();
  if (!error) return null;
  return (
    <div
      aria-live="polite"
      className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
    >
      <span>{error}</span>
      <button
        type="button"
        onClick={dismissError}
        aria-label="Sluiten"
        className="text-red-600 hover:text-red-900"
      >
        <XMarkIcon className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}

// ---- UploadButton ----

function UploadButton() {
  const {
    actions: { openDialog },
  } = useArtefactContext();
  return (
    <button
      type="button"
      onClick={openDialog}
      className="inline-flex items-center gap-1 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm transition-colors hover:border-branding-light/40 hover:bg-branding-light/5 hover:text-branding-dark"
    >
      <ArrowUpTrayIcon aria-hidden="true" className="size-3.5" />
      <span>Materiaal toevoegen</span>
    </button>
  );
}

// ---- ChipStrip ----

function ChipStrip() {
  const {
    state: { artefacten, pending, stagedIds },
  } = useArtefactContext();
  // Show only staged artefacten — the ones the user has added since
  // their last message send. Previously-committed artefacten still
  // exist in the chat (and are reachable via the leercoach's
  // `listArtefacten` tool) but don't clutter the composer, matching
  // the ChatGPT/Claude attachment idiom. Pending chips always render
  // regardless of commit state since they represent in-flight uploads.
  const visibleArtefacten = artefacten.filter((a) =>
    stagedIds.has(a.artefactId),
  );
  if (visibleArtefacten.length === 0 && pending.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending.map((p) => (
        <PendingChip key={p.pendingId} pending={p} />
      ))}
      {visibleArtefacten.map((a) => (
        <ArtefactChip key={a.artefactId} artefact={a} />
      ))}
    </div>
  );
}

function PendingChip({ pending }: { pending: PendingArtefactChip }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
      <ArtefactIcon
        type={pending.artefactType}
        className="size-3.5 animate-pulse text-slate-400"
      />
      <span className="max-w-[16rem] truncate">{pending.label}</span>
      <span className="text-slate-400">· verwerken…</span>
    </span>
  );
}

function ArtefactChip({ artefact }: { artefact: ArtefactRow }) {
  const {
    actions: { revoke },
  } = useArtefactContext();
  const [confirming, setConfirming] = useState(false);
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700 shadow-sm"
      title={artefact.summary || undefined}
    >
      <ArtefactIcon
        type={artefact.artefactType}
        className="size-3.5 text-slate-500"
      />
      <span className="max-w-[16rem] truncate font-medium text-slate-900">
        {artefact.label}
      </span>
      <span className="text-slate-400">·</span>
      <span className="text-slate-500">{artefact.chunkCount} fragm.</span>
      {confirming ? (
        <>
          <button
            type="button"
            onClick={() => revoke(artefact.artefactId)}
            className="rounded px-1 text-[11px] font-semibold text-red-700 hover:bg-red-50"
          >
            verwijder
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            aria-label="Annuleer verwijderen"
            className="text-slate-500 hover:text-slate-900"
          >
            <XMarkIcon className="size-3.5" aria-hidden="true" />
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          aria-label={`Verwijder ${artefact.label}`}
          className="ml-0.5 text-slate-400 hover:text-red-600"
        >
          <XMarkIcon className="size-3.5" aria-hidden="true" />
        </button>
      )}
    </span>
  );
}

function ArtefactIcon({
  type,
  className,
}: {
  type: ArtefactRow["artefactType"];
  className?: string;
}) {
  if (type === "image")
    return <PhotoIcon aria-hidden="true" className={className} />;
  if (type === "pdf" || type === "docx")
    return <DocumentIcon aria-hidden="true" className={className} />;
  return <DocumentTextIcon aria-hidden="true" className={className} />;
}

// ---- CommitOnSend ----
//
// Renderless bridge between the AiChat and Artefact contexts. Must be
// mounted inside BOTH providers (typically as a child of AiChatWindow
// which sits inside Artefact.Provider). On every new user-role message
// it calls `commitStaged()` so the chip strip clears — same UX idiom
// as ChatGPT/Claude where attachments belong to the message they
// were sent with.

function CommitOnSend() {
  const {
    state: { messages },
  } = useAiChatContext();
  const {
    actions: { commitStaged },
  } = useArtefactContext();
  const userMessageCount = messages.filter((m) => m.role === "user").length;
  const prev = useRef(userMessageCount);
  useEffect(() => {
    if (userMessageCount > prev.current) {
      commitStaged();
    }
    prev.current = userMessageCount;
  }, [userMessageCount, commitStaged]);
  return null;
}

// ---- UploadDialog ----
//
// Mount anywhere under <Artefact.Provider>. Reads `dialogOpen` from
// state; invokes `uploadFile` on submit. Deliberately self-contained
// so consumers don't need to own the open/close toggle.

function UploadDialog() {
  const {
    state: { dialogOpen },
    actions: { closeDialog, uploadFile },
  } = useArtefactContext();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [label, setLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const labelInputId = useId();

  function reset() {
    setSelectedFile(null);
    setLabel("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleClose() {
    if (isPending) return;
    reset();
    closeDialog();
  }

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    setSelectedFile(e.target.files?.[0] ?? null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) return;
    const labelOverride = label.trim().length > 0 ? label.trim() : undefined;
    startTransition(async () => {
      await uploadFile({ file: selectedFile, labelOverride });
      reset();
      closeDialog();
    });
  }

  return (
    <Dialog open={dialogOpen} onClose={handleClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-slate-900/50" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Materiaal toevoegen
            </DialogTitle>
            <p className="text-sm text-slate-600">
              Upload een document (PDF, DOCX) of afbeelding (PNG, JPG, WEBP) dat
              je in deze sessie wil gebruiken. Alleen jij en de digitale
              leercoach zien ’m — andere gebruikers krijgen nooit toegang.
            </p>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={fileInputId}
                className="text-sm font-medium text-slate-700"
              >
                Bestand
              </label>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx,image/png,image/jpeg,image/webp"
                onChange={onFileChange}
                disabled={isPending}
                className="text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-50"
              />
              {selectedFile ? (
                <p className="text-xs text-slate-500">
                  {selectedFile.name} · {Math.round(selectedFile.size / 1024)}{" "}
                  KB
                </p>
              ) : (
                <p className="text-xs text-slate-500">Max 15 MB.</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor={labelInputId}
                className="text-sm font-medium text-slate-700"
              >
                Korte naam (optioneel)
              </label>
              <input
                id={labelInputId}
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                disabled={isPending}
                placeholder={
                  selectedFile
                    ? selectedFile.name.replace(
                        /\.(pdf|docx|png|jpe?g|webp)$/i,
                        "",
                      )
                    : ""
                }
                maxLength={80}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isPending}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Annuleer
              </button>
              <button
                type="submit"
                disabled={!selectedFile || isPending}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPending ? "Verwerken…" : "Upload"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

// ---- Helpers ----

function makePendingId(): string {
  return `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function artefactTypeFromFile(file: File): "pdf" | "docx" | "image" | "text" {
  const mime = file.type;
  const name = file.name.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return "docx";
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp)$/.test(name))
    return "image";
  return "text";
}

/**
 * Pre-filter for drag-drop: does the File look like something the
 * server will accept? Browser check only — the server re-validates.
 * A quick local filter matters because letting garbage drops create
 * pending chips that immediately fail makes the UI noisier than
 * necessary.
 */
function isAcceptedUploadFile(file: File): boolean {
  const mime = file.type;
  const name = file.name.toLowerCase();
  if (mime === "application/pdf" || name.endsWith(".pdf")) return true;
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  )
    return true;
  if (
    mime === "image/png" ||
    mime === "image/jpeg" ||
    mime === "image/webp" ||
    /\.(png|jpe?g|webp)$/.test(name)
  )
    return true;
  return false;
}

// ---- Compound export ----

export const Artefact = {
  Provider,
  ErrorBanner,
  UploadButton,
  ChipStrip,
  UploadDialog,
  CommitOnSend,
};
