// Public API.
//
// Two ways to consume the chat UI:
//
// 1. AiChat compound — full control over composition:
//      <AiChat.Provider ...>
//        <AiChat.Frame>
//          <AiChat.MessageList />
//          <AiChat.ErrorBanner />
//          <AiChat.Starters />
//          <YourCustomUI />  {/* uses useAiChatContext() */}
//          <AiChat.InputForm />
//        </AiChat.Frame>
//      </AiChat.Provider>
//
// 2. AiChatWindow — thin wrapper that renders the default composition.
//    Any `children` land between Starters and InputForm.

export type { AiChatErrorRetryRenderer } from "./AiChat";
export { AiChat, isTextPart } from "./AiChat";
export { AiChatWindow } from "./AiChatWindow";
export type {
  AiChatActions,
  AiChatContextValue,
  AiChatMessage,
  AiChatMeta,
  AiChatState,
} from "./context";
export {
  AiChatContext,
  useAiChatContext,
  useAiChatInputSlot,
} from "./context";
export { SimpleMarkdown } from "./markdown";
export type { ToolPart } from "./tool-parts";
export { isToolPart, ToolPartRenderer } from "./tool-parts";
export type {
  AiChatDropHandler,
  AiChatInitialMessage,
  AiChatInputSlotContext,
  AiChatPasteHandler,
  AiChatSlashAction,
  AiChatSlashCommand,
  AiChatStarter,
  AiChatSubmitBlock,
  AiChatWindowProps,
} from "./types";
export { isNearBottom, useStickyScroll } from "./use-sticky-scroll";
