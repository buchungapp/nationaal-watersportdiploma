"use client";

// Compound for the "eerder portfolio uploaden" flow from inside a
// chat. Replaces the old monolithic UploadPortfolioInline, which
// mixed a button, a dialog, and a sendMessage side-effect into one
// component.
//
// Why a compound: the trigger (the "+" menu item inside the
// composer) needs to open the dialog, and the dialog needs to fire
// `sendMessage` on success. Those two concerns live at different
// depths in the tree — the menu is inside InputForm (deep inside
// AiChatWindow), and the state needs to exist above InputForm so the
// menu can read it. Splitting into Provider + Dialog + AutoSendBridge
// lets each piece sit at the right depth while sharing state.
//
// Usage:
//   <PortfolioUpload.Provider handle profielen currentProfielId>
//     <AiChatWindow ...>
//       <PortfolioUpload.AutoSendBridge />   {/* inside AiChat ctx */}
//       ...
//     </AiChatWindow>
//     <PortfolioUpload.Dialog />             {/* anywhere under Provider */}
//   </PortfolioUpload.Provider>

import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAiChatContext } from "~/app/_components/ai-chat";
import { PortfolioUploadDialog } from "../../portfolios/_components/PortfolioUploadDialog";
import type { ProfielOption } from "../../portfolios/_components/upload/useUploadPortfolioForm";
import {
  type PortfolioUploadActions,
  PortfolioUploadContext,
  type PortfolioUploadContextValue,
  type PortfolioUploadState,
  type PortfolioUploadSuccessCtx,
  usePortfolioUploadContext,
} from "./portfolio-upload-context";

type ProviderProps = {
  handle: string;
  profielen: ProfielOption[];
  /**
   * Pre-selected profiel in the upload dialog's picker. Null for
   * vraag-sessies — the dialog falls back to the first profiel in
   * the list (the hook already handles null).
   */
  currentProfielId: string | null;
  children: ReactNode;
};

function Provider({
  handle,
  profielen,
  currentProfielId,
  children,
}: ProviderProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingSuccess, setPendingSuccess] =
    useState<PortfolioUploadSuccessCtx | null>(null);

  const openDialog = useCallback(() => setDialogOpen(true), []);
  const closeDialog = useCallback(() => setDialogOpen(false), []);
  const notifySuccess = useCallback(
    (ctx: PortfolioUploadSuccessCtx) => setPendingSuccess(ctx),
    [],
  );
  const clearPendingSuccess = useCallback(() => setPendingSuccess(null), []);

  const state: PortfolioUploadState = { dialogOpen, pendingSuccess };
  const actions: PortfolioUploadActions = {
    openDialog,
    closeDialog,
    notifySuccess,
    clearPendingSuccess,
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: track field values, not { state, actions } object identity
  const value = useMemo<PortfolioUploadContextValue>(
    () => ({ state, actions }),
    [
      dialogOpen,
      pendingSuccess,
      openDialog,
      closeDialog,
      notifySuccess,
      clearPendingSuccess,
    ],
  );

  return (
    <PortfolioUploadContext value={value}>
      {children}
      {/* Dialog mounted here so it has access to context;
          consumer doesn't need to render it separately. */}
      <PortfolioUploadDialog
        handle={handle}
        profielen={profielen}
        defaultProfielId={currentProfielId}
        open={dialogOpen}
        onClose={closeDialog}
        onSuccess={notifySuccess}
      />
    </PortfolioUploadContext>
  );
}

/**
 * Renderless bridge between the PortfolioUpload context and the
 * AiChat context. Must be mounted INSIDE AiChatWindow (so
 * useAiChatContext resolves).
 *
 * When the dialog marks a pending success, this effect fires
 * sendMessage with a confirmation prompt the leercoach interprets
 * as "the kandidaat just uploaded a portfolio, acknowledge it".
 * Then clears the pending flag so subsequent reads stay silent.
 */
function AutoSendBridge() {
  const {
    state: { pendingSuccess },
    actions: { clearPendingSuccess },
  } = usePortfolioUploadContext();
  const {
    actions: { sendMessage },
  } = useAiChatContext();

  useEffect(() => {
    if (!pendingSuccess) return;
    const { niveauRang } = pendingSuccess;
    const niveauLabel = niveauRang ? `niveau-${niveauRang} ` : "";
    // Single message shape since the async workflow doesn't surface
    // "already ingested" vs "fresh" to the client — the dedup check
    // lives inside the workflow's ingest step. If we ever want to
    // re-introduce that distinction, extend the status endpoint to
    // return a { freshInsert: boolean } flag from the source insert.
    const message = `Ik heb zojuist mijn ${niveauLabel}portfolio geüpload. Neem even de tijd om erin te kijken, dan kunnen we daarna bespreken hoe we dit gebruiken.`;
    sendMessage({ text: message });
    clearPendingSuccess();
  }, [pendingSuccess, sendMessage, clearPendingSuccess]);

  return null;
}

export const PortfolioUpload = {
  Provider,
  AutoSendBridge,
};
