"use client";

// Shared context for the Artefact compound. Mirrors the AiChat
// context shape: `{ state, actions, meta }` so downstream pieces
// consume a uniform interface (state-context-interface rule).

import { createContext, use } from "react";
import type {
  AiChatDropHandler,
  AiChatPasteHandler,
  AiChatSubmitBlock,
} from "~/app/_components/ai-chat";

export type ArtefactRow = {
  artefactId: string;
  label: string;
  artefactType: "pdf" | "docx" | "text" | "image";
  summary: string;
  chunkCount: number;
};

export type PendingArtefactChip = {
  pendingId: string;
  label: string;
  artefactType: ArtefactRow["artefactType"];
};

export type ArtefactState = {
  /** Confirmed artefacten (committed to the server). */
  artefacten: ArtefactRow[];
  /**
   * Chips for uploads still in flight. Rendered with a pulsing
   * placeholder so drag/paste feel immediate; swapped for a real
   * ArtefactRow on server ack.
   */
  pending: PendingArtefactChip[];
  /**
   * Client-side set of artefactIds uploaded in this session that the
   * user hasn't "committed" yet by sending a chat message. The chip
   * strip renders only these — chips disappear on send, matching the
   * ChatGPT/Claude attachment idiom ("these are attached to my NEXT
   * message"). Previously-committed artefacten still live server-side
   * and remain reachable via the leercoach's `listArtefacten` tool;
   * they just don't clutter the composer UI.
   *
   * Initial value is always empty — on page reload the user sees a
   * clean composer, not a pile of prior attachments.
   */
  stagedIds: Set<string>;
  /** Human-readable upload/revoke error to surface in a banner. */
  error: string | null;
  dialogOpen: boolean;
};

export type ArtefactActions = {
  uploadFile: (input: { file: File; labelOverride?: string }) => Promise<void>;
  uploadText: (input: {
    content: string;
    labelOverride?: string;
  }) => Promise<void>;
  revoke: (artefactId: string) => Promise<void>;
  dismissError: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  /**
   * Clear the staged set. Called when the user sends a chat message —
   * at that point the artefacten "belong" to the turn the user just
   * sent, so the composer affordance should reset.
   */
  commitStaged: () => void;
};

export type ArtefactMeta = {
  /** Paste handler to plug into AiChatWindow's handlePaste prop. */
  handlePaste: AiChatPasteHandler;
  /** Drop handler to plug into AiChatWindow's handleDrop prop. */
  handleDrop: AiChatDropHandler;
  /**
   * Derived from `state.pending`: non-null while any artefact is still
   * being processed on the server. Plug into AiChatWindow's
   * `submitBlock` prop to prevent "send ran ahead of upload" races.
   */
  submitBlock: AiChatSubmitBlock;
};

export type ArtefactContextValue = {
  state: ArtefactState;
  actions: ArtefactActions;
  meta: ArtefactMeta;
};

export const ArtefactContext = createContext<ArtefactContextValue | null>(null);

/**
 * Hook read from the Artefact compound. Throws when used outside the
 * provider so children don't silently no-op.
 *
 * Uses React 19's `use()` (react19-no-forwardref rule) instead of
 * `useContext()`.
 */
export function useArtefactContext(): ArtefactContextValue {
  const ctx = use(ArtefactContext);
  if (!ctx) {
    throw new Error(
      "Artefact compound pieces must be used inside <Artefact.Provider>.",
    );
  }
  return ctx;
}

/**
 * Narrow convenience hooks for the one consumer (AiChatWindow) that
 * just wants to forward the interceptors as props.
 */
export function useArtefactPasteHandler(): AiChatPasteHandler {
  return useArtefactContext().meta.handlePaste;
}

export function useArtefactDropHandler(): AiChatDropHandler {
  return useArtefactContext().meta.handleDrop;
}

export function useArtefactSubmitBlock(): AiChatSubmitBlock {
  return useArtefactContext().meta.submitBlock;
}
