import type { ReactNode } from "react";

// Minimal, consumer-friendly message shape. Deliberately avoids depending on
// the AI SDK's UIMessage type directly so consumers can pass DB rows in
// without a conversion step — the AiChatWindow does the mapping internally.
export type AiChatInitialMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[]; // AI SDK UIMessage parts, jsonb-safe
};

export type AiChatStarter = {
  label: string;
  prompt: string;
};

export type AiChatWindowProps = {
  /** Stable chat identifier. Also used as the useChat hook id. */
  chatId: string;
  /** Messages to hydrate on mount. Pass an empty array for a fresh chat. */
  initialMessages: AiChatInitialMessage[];
  /** Streaming endpoint. POST receives { id, messages } and streams UIMessage chunks. */
  apiEndpoint: string;
  /** Placeholder for the input textarea. */
  placeholder?: string;
  /**
   * Optional starter chips rendered above the input, only while the user
   * hasn't sent any message yet. Clicking a chip sends the prompt straight
   * into the chat.
   */
  starters?: AiChatStarter[];
  /** Custom empty-state rendered when there are no messages at all. */
  emptyState?: ReactNode;
  /**
   * Called whenever the streamed response errors. Consumer can show a toast
   * or log; the component already renders a default error box.
   */
  onError?: (error: Error) => void;
  /** Extra classes on the outermost container. */
  className?: string;
};
