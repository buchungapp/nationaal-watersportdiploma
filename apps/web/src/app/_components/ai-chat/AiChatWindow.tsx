"use client";

import type { ReactNode } from "react";
import { AiChat, type AiChatErrorRetryRenderer } from "./AiChat";
import type {
  AiChatDropHandler,
  AiChatPasteHandler,
  AiChatSlashCommand,
  AiChatSubmitBlock,
  AiChatWindowProps,
} from "./types";

// Convenience wrapper around the AiChat compound: renders the default
// composition (MessageList → ErrorBanner → Starters → children →
// InputForm). Consumers that want a different layout should use the
// compound pieces directly:
//
//   <AiChat.Provider chatId={...} initialMessages={...} apiEndpoint="...">
//     <AiChat.Frame>
//       <AiChat.MessageList />
//       <AiChat.ErrorBanner />
//       <AiChat.Starters />
//       <MyCustomBlock />
//       <AiChat.InputForm />
//     </AiChat.Frame>
//   </AiChat.Provider>
//
// Any consumer UI passed as `children` to AiChatWindow is rendered
// between the starter chips and the input form — the common slot for
// things like an "upload portfolio" button. Per the
// patterns-children-over-render-props rule, custom UI consumes the
// context via useAiChatContext() instead of a render-prop callback.

type Props = Omit<AiChatWindowProps, "slotAboveInput"> & {
  /**
   * Optional custom UI rendered between the starter chips and the
   * input form. Place components that need sendMessage + isLoading
   * here — they grab them from useAiChatContext() directly.
   */
  children?: ReactNode;
  /**
   * Optional paste interceptor — see `AiChatPasteHandler`. When
   * provided, long-text pastes and image pastes route to this
   * handler instead of landing in the textarea. The leercoach uses
   * this to promote pasted content into chat-scoped artefacten.
   */
  handlePaste?: AiChatPasteHandler;
  /**
   * Optional drop interceptor — see `AiChatDropHandler`. When
   * provided, files dragged onto the chat area route here. The
   * browser default (navigate to file) is always suppressed.
   */
  handleDrop?: AiChatDropHandler;
  /**
   * Optional submit gate — see `AiChatSubmitBlock`. When non-null,
   * the submit button is disabled and Enter-to-send is a no-op; the
   * reason shows as the button's tooltip. The leercoach uses this
   * while artefacten are still uploading to keep user messages from
   * racing ahead of the server.
   */
  submitBlock?: AiChatSubmitBlock;
  /**
   * Content rendered ABOVE the MessageList, at the very top of the
   * chat frame. The leercoach uses this for the phase stepper so it
   * sits as a persistent header over the conversation.
   */
  topSlot?: ReactNode;
  /**
   * Content rendered INSIDE the composer's rounded container, above
   * the textarea. Leercoach renders the artefact chip strip here so
   * attached files appear where Claude puts them — inside the
   * composer visual, not as a separate strip above it.
   */
  composerPreSlot?: ReactNode;
  /**
   * Absolute-positioned bottom-left slot inside the composer,
   * mirroring the built-in send button at bottom-right. Leercoach
   * renders the "+" attach menu here.
   */
  composerLeftActions?: ReactNode;
  /**
   * Slash commands for the composer. When non-empty, typing `/` at
   * the start of the textarea opens a keyboard-navigable popover
   * with matching entries. See `AiChatSlashCommand`.
   */
  slashCommands?: AiChatSlashCommand[];
  /**
   * When true, the underlying useChat automatically reconnects to any
   * in-flight stream for this chat on mount (via GET to the URL
   * returned by `cancelEndpoint`). Pairs with a resumable server route
   * — see AiChat.Provider's `resume` prop for the full contract.
   *
   * Default: false.
   */
  resume?: boolean;
  /**
   * Builds the URL for the per-chat resume / cancel endpoint. When
   * present, the Stop button additionally fires DELETE to this URL so
   * the server can abort the LLM stream (survives client disconnect);
   * when `resume` is true it's also used as the reconnect GET.
   *
   * Omit for consumers that don't have a resumable backend.
   */
  cancelEndpoint?: (chatId: string) => string;
  /**
   * Optional override for the retry button inside the error banner.
   * Called with the current error; return non-null to replace the
   * default "Probeer opnieuw" with a domain-specific action (e.g.
   * leercoach's "Comprimeer en probeer opnieuw" when context limit
   * is hit). Return null to let the default retry render.
   */
  errorRetryRenderer?: AiChatErrorRetryRenderer;
};

export function AiChatWindow({
  chatId,
  initialMessages,
  apiEndpoint,
  placeholder,
  starters,
  emptyState,
  onError,
  handlePaste,
  handleDrop,
  submitBlock,
  topSlot,
  composerPreSlot,
  composerLeftActions,
  slashCommands,
  resume,
  cancelEndpoint,
  errorRetryRenderer,
  className,
  children,
}: Props) {
  return (
    <AiChat.Provider
      chatId={chatId}
      initialMessages={initialMessages}
      apiEndpoint={apiEndpoint}
      starters={starters}
      onError={onError}
      handlePaste={handlePaste}
      handleDrop={handleDrop}
      submitBlock={submitBlock}
      resume={resume}
      cancelEndpoint={cancelEndpoint}
    >
      <AiChat.Frame className={className}>
        {topSlot}
        <AiChat.MessageList emptyState={emptyState} />
        <AiChat.ErrorBanner renderRetryAction={errorRetryRenderer} />
        <AiChat.Starters />
        {children}
        <AiChat.InputForm
          placeholder={placeholder}
          topChildren={composerPreSlot}
          leftActions={composerLeftActions}
          slashCommands={slashCommands}
        />
      </AiChat.Frame>
    </AiChat.Provider>
  );
}
