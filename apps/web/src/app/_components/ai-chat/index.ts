// Public API of the reusable AI chat window.
//
// Consumers (today: /leercoach. Tomorrow: /portfolio-checker chat, /portfolio-
// review reviewer chat) do:
//
//   import { AiChatWindow, type AiChatStarter } from "~/app/_components/ai-chat";
//
// and pass apiEndpoint, initialMessages, and optional starters + emptyState.

export { AiChatWindow, isTextPart } from "./AiChatWindow";
export { SimpleMarkdown } from "./markdown";
export type {
  AiChatInitialMessage,
  AiChatStarter,
  AiChatWindowProps,
} from "./types";
export { isNearBottom, useStickyScroll } from "./use-sticky-scroll";
