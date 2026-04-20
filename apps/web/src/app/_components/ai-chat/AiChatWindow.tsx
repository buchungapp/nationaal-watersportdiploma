"use client";

import type { ReactNode } from "react";
import { AiChat } from "./AiChat";
import type {
  AiChatDropHandler,
  AiChatPasteHandler,
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
    >
      <AiChat.Frame className={className}>
        <AiChat.MessageList emptyState={emptyState} />
        <AiChat.ErrorBanner />
        <AiChat.Starters />
        {children}
        <AiChat.InputForm placeholder={placeholder} />
      </AiChat.Frame>
    </AiChat.Provider>
  );
}
