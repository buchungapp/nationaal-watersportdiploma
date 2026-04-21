"use client";

// Shared context for the PortfolioUpload compound. Mirrors the
// Artefact compound shape (`{ state, actions, meta }`) for
// consistency.
//
// The dialog + auto-send-on-success behavior is split across two
// components that share this context:
//   - PortfolioUpload.Dialog — renders the file-picker modal, sits
//     at the root of the chat tree
//   - PortfolioUpload.AutoSendBridge — renderless; lives inside
//     AiChatWindow so it can call sendMessage when the dialog
//     fires an upload-success event
//
// Keeping the auto-send logic separate lets Provider live ABOVE
// AiChatWindow (so the "+" menu in the composer can read
// openDialog via useArtefactContext-equivalent), while the
// sendMessage dependency stays inside AiChatWindow.

import { createContext, use } from "react";
import type { UploadPriorPortfolioResult } from "../../portfolios/actions";

export type PortfolioUploadSuccessCtx = {
  result: Extract<UploadPriorPortfolioResult, { ok: true }>;
  niveauRang: number | null;
  label: string;
};

export type PortfolioUploadState = {
  dialogOpen: boolean;
  /**
   * Pending success context awaiting the AutoSendBridge to pick up +
   * fan out to AiChat. Cleared by the bridge after it fires
   * sendMessage. Non-null briefly between dialog success + bridge
   * handling.
   */
  pendingSuccess: PortfolioUploadSuccessCtx | null;
};

export type PortfolioUploadActions = {
  openDialog: () => void;
  closeDialog: () => void;
  /** Dialog invokes this when the upload succeeds. */
  notifySuccess: (ctx: PortfolioUploadSuccessCtx) => void;
  /** Bridge invokes this after it has handled pendingSuccess. */
  clearPendingSuccess: () => void;
};

export type PortfolioUploadContextValue = {
  state: PortfolioUploadState;
  actions: PortfolioUploadActions;
};

export const PortfolioUploadContext =
  createContext<PortfolioUploadContextValue | null>(null);

export function usePortfolioUploadContext(): PortfolioUploadContextValue {
  const ctx = use(PortfolioUploadContext);
  if (!ctx) {
    throw new Error(
      "PortfolioUpload pieces must be used inside <PortfolioUpload.Provider>.",
    );
  }
  return ctx;
}

/** Narrow hook for the + menu: only needs the open action. */
export function usePortfolioUploadLauncher(): () => void {
  return usePortfolioUploadContext().actions.openDialog;
}
