// Shared context for the AiChat compound components.
//
// Interface follows the `{state, actions, meta}` pattern from the
// vercel-composition-patterns skill (state-context-interface rule).
// Pieces like AiChat.InputForm, AiChat.Starters, AiChat.MessageList
// — plus any consumer UI that needs to trigger sends (e.g. an upload
// button that auto-sends a confirmation message) — consume this
// context via `use(AiChatContext)` instead of receiving props.
//
// Keeping the interface generic (no mention of useChat, @ai-sdk/react,
// or streaming) means alternative providers could plug in the same UI
// pieces with a different state implementation. For v1 there's only
// one provider (AiChat.Provider in ./AiChat.tsx); the interface
// decouples the pieces from that implementation so swapping is cheap.

import { createContext, use } from "react";
import type {
  AiChatDropHandler,
  AiChatInputSlotContext,
  AiChatPasteHandler,
  AiChatStarter,
  AiChatSubmitBlock,
} from "./types";

export type AiChatMessage = {
  id: string;
  role: "user" | "assistant" | "system";
  parts: unknown[];
};

export type AiChatState = {
  messages: AiChatMessage[];
  inputValue: string;
  /** Streaming status from useChat (or equivalent). */
  status: "ready" | "submitted" | "streaming" | "error" | string;
  error: Error | undefined;
  /** Starter chips to render while no user turn has been sent. */
  starters: AiChatStarter[];
};

export type AiChatActions = {
  /** Send a message directly (skipping the textarea). */
  sendMessage: (input: { text: string }) => void;
  /** Controlled update of the textarea value. */
  setInputValue: (v: string) => void;
  /** Submit whatever is currently in `inputValue` (no-op when empty or loading). */
  submitCurrentInput: () => void;
  /**
   * Abort the in-flight stream. Safe to call when not streaming — no-op.
   * Used by the cancel button + Esc shortcut in the InputForm.
   */
  stop: () => void;
  /**
   * Consumer-supplied paste handler. Called by the InputForm when the
   * clipboard carries an image or a large-enough text block to promote
   * to an attachment. Return `true` to signal "I handled it; default
   * paste should be suppressed". Return/undefined to let the textarea
   * paste normally.
   *
   * Default behaviour (when no handler is provided): normal paste.
   */
  handlePaste: AiChatPasteHandler | null;
  /**
   * Consumer-supplied drop handler. Called by the Frame when files
   * are dropped anywhere in the chat area. When null, drag-and-drop
   * is inert (the Frame still suppresses browser-default open-file
   * behaviour but discards the files).
   */
  handleDrop: AiChatDropHandler | null;
};

export type AiChatMeta = {
  /** True while streaming or awaiting a response; use to disable UI. */
  isLoading: boolean;
  /** Ref to attach to the scrollable message container (sticky-scroll hook). */
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Consumer-supplied submit block. When set, the InputForm disables
   * the submit button and Enter-to-send is ignored; the `reason`
   * surfaces as the button's tooltip. Null when submission is
   * allowed (the default).
   */
  submitBlock: AiChatSubmitBlock;
};

export type AiChatContextValue = {
  state: AiChatState;
  actions: AiChatActions;
  meta: AiChatMeta;
};

// Exporting the Context object (not wrapped in a Provider) so consumer
// components can also render their own providers if they want to swap
// state implementations — per the state-decouple-implementation rule.
export const AiChatContext = createContext<AiChatContextValue | null>(null);

/**
 * Read the AiChat context. Throws if used outside an <AiChat.Provider>
 * so pieces don't silently no-op on misuse.
 *
 * Uses React 19's `use()` instead of `useContext()` (react19-no-forwardref rule).
 */
export function useAiChatContext(): AiChatContextValue {
  const ctx = use(AiChatContext);
  if (!ctx) {
    throw new Error(
      "AiChat components must be used inside <AiChat.Provider>.",
    );
  }
  return ctx;
}

/**
 * Narrow helper matching the old `slotAboveInput` render-prop signature
 * — for the rare consumer that wants a subset. Prefer `useAiChatContext`
 * directly; this exists as a convenience alias.
 */
export function useAiChatInputSlot(): AiChatInputSlotContext {
  const { actions, meta } = useAiChatContext();
  return {
    sendMessage: actions.sendMessage,
    isLoading: meta.isLoading,
  };
}
