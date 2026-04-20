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

// Render-prop context handed to the `slotAboveInput` renderer. Exposes
// just enough of useChat's surface that consumers can trigger sends from
// within their custom UI (e.g. an upload button that auto-sends a
// confirmation message after successful ingest). We don't expose the
// whole useChat API — if we did, this slot would be doing work the
// component should be doing itself.
export type AiChatInputSlotContext = {
  sendMessage: (input: { text: string }) => void;
  isLoading: boolean;
};

/**
 * Consumer-supplied paste interceptor. The AiChat's InputForm fires
 * this BEFORE its own default paste handling when either:
 *   - the clipboard contains an image (any item with type image/*), or
 *   - the plain-text content is long enough (threshold owned by the
 *     InputForm; consumers don't need to know it).
 *
 * Return `true` to signal the consumer handled it — the InputForm will
 * preventDefault on the paste event so the content doesn't ALSO land
 * in the textarea. Return anything else to let the default paste
 * proceed.
 */
export type AiChatPasteHandler = (
  input:
    | { kind: "text"; content: string }
    | { kind: "image"; file: File },
) => boolean | Promise<boolean>;

/**
 * Consumer-supplied drop interceptor. The AiChat's Frame fires this
 * when one or more FILES (not text, not URLs) are dropped anywhere
 * inside the chat area. `preventDefault` is always called on the
 * drop event regardless of the handler's return value — we never
 * want the browser's default "navigate to dropped file" behaviour.
 *
 * The handler receives every File attached to `dataTransfer.files`;
 * the consumer decides whether to upload all of them, only the first,
 * or reject mixed-type drops.
 */
export type AiChatDropHandler = (
  files: File[],
) => boolean | Promise<boolean>;

/**
 * Consumer-supplied submit gate. When non-null, the InputForm
 * disables the submit button and Enter-to-send is a no-op — useful
 * while something async (an attachment upload, a background
 * validation, …) hasn't finished yet and sending now would race.
 * The `reason` is shown as the button's `title` tooltip so the user
 * understands why it's greyed out.
 */
export type AiChatSubmitBlock = { reason: string } | null;

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
