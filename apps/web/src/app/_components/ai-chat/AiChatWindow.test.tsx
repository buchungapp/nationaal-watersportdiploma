// Component tests for AiChatWindow.
//
// Strategy (Layer 1 per leercoach-pivot.md test plan): mock `useChat` and
// `streamdown` at the module level so the test is isolated from
// network + from streamdown's heavyweight rendering pipeline. Asserts the
// component's observable UI behaviour: message rendering, starter chip
// firing, input submission, keyboard handling, error surface, and lifecycle
// around the `onError` callback.
//
// Streaming-integration tests (real useChat + simulateReadableStream + a
// stubbed /api/chat endpoint) are a separate follow-up layer — they cover
// partial-token rendering + scroll behaviour during actual streams, which
// is different ground from "does clicking the chip call sendMessage".

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// --- Mock @ai-sdk/react.useChat ---
// useChat is called once per AiChatWindow render. We control its return
// value per-test via the mockReturnValue helper below.

const mockSendMessage = vi.fn();
let currentChatState: {
  messages: Array<{
    id: string;
    role: "user" | "assistant" | "system";
    parts: unknown[];
  }>;
  status: "ready" | "submitted" | "streaming" | "error";
  error: Error | undefined;
} = {
  messages: [],
  status: "ready",
  error: undefined,
};

vi.mock("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: currentChatState.messages,
    sendMessage: mockSendMessage,
    status: currentChatState.status,
    error: currentChatState.error,
  }),
}));

// --- Mock streamdown ---
// We don't want to pull streamdown's full marked + rehype + mermaid stack
// into jsdom for every component test; that's covered by streamdown's own
// test suite in vercel/streamdown. We render its children as plain text so
// assertions can look up message content without worrying about markdown
// structure.

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: string }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

// --- Test harness ---

import { AiChatWindow } from "./AiChatWindow";
import type { AiChatInitialMessage, AiChatStarter } from "./types";

function setChatState(
  partial: Partial<typeof currentChatState>,
): void {
  currentChatState = { ...currentChatState, ...partial };
}

beforeEach(() => {
  mockSendMessage.mockClear();
  setChatState({ messages: [], status: "ready", error: undefined });
});

afterEach(() => {
  cleanup();
});

const STARTERS: AiChatStarter[] = [
  { label: "Leg uit", prompt: "Leg uit wat dit is." },
  { label: "Start fresh", prompt: "Ik wil blanco beginnen." },
];

const TEXT_MESSAGE = (
  id: string,
  role: "user" | "assistant",
  text: string,
): AiChatInitialMessage => ({
  id,
  role,
  parts: [{ type: "text", text }],
});

function renderWindow(
  overrides?: Partial<Parameters<typeof AiChatWindow>[0]>,
) {
  return render(
    <AiChatWindow
      chatId="test-chat-id"
      initialMessages={[]}
      apiEndpoint="/api/test-chat"
      {...overrides}
    />,
  );
}

describe("AiChatWindow — empty state", () => {
  test("renders the default empty state when there are no messages", () => {
    renderWindow();
    expect(screen.getByText(/klaar om te beginnen/i)).toBeInTheDocument();
  });

  test("renders a custom emptyState when the consumer provides one", () => {
    renderWindow({ emptyState: <p>My custom welcome</p> });
    expect(screen.getByText("My custom welcome")).toBeInTheDocument();
    // Default should NOT appear when override is used.
    expect(
      screen.queryByText(/klaar om te beginnen/i),
    ).not.toBeInTheDocument();
  });
});

describe("AiChatWindow — message rendering", () => {
  test("renders user and assistant messages in order", () => {
    setChatState({
      messages: [
        TEXT_MESSAGE("m1", "user", "Hello there"),
        TEXT_MESSAGE("m2", "assistant", "Hi, welcome"),
      ],
    });
    renderWindow();
    const rendered = screen.getAllByTestId("streamdown");
    expect(rendered).toHaveLength(2);
    expect(rendered[0]).toHaveTextContent("Hello there");
    expect(rendered[1]).toHaveTextContent("Hi, welcome");
  });

  test("renders non-text parts as JSON for debug visibility", () => {
    setChatState({
      messages: [
        {
          id: "m1",
          role: "assistant",
          parts: [
            { type: "tool-call", toolName: "search_corpus", args: { q: "x" } },
          ],
        },
      ],
    });
    renderWindow();
    // The fallback branch renders a <pre> with JSON.
    const pre = screen.getByText(/tool-call/);
    expect(pre.tagName.toLowerCase()).toBe("pre");
  });
});

describe("AiChatWindow — starter chips", () => {
  test("renders starter chips when messages empty and starters provided", () => {
    renderWindow({ starters: STARTERS });
    expect(screen.getByRole("button", { name: "Leg uit" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Start fresh" }),
    ).toBeInTheDocument();
  });

  test("hides starter chips when there is already a user turn", () => {
    setChatState({
      messages: [TEXT_MESSAGE("u1", "user", "Al een vraag")],
    });
    renderWindow({ starters: STARTERS });
    expect(
      screen.queryByRole("button", { name: "Leg uit" }),
    ).not.toBeInTheDocument();
  });

  test("keeps starter chips visible when only assistant messages exist (opening)", () => {
    // Matches our real flow: createChatAction saves an opening assistant
    // message, then the chat loads with starters still visible until the
    // first user turn.
    setChatState({
      messages: [TEXT_MESSAGE("a1", "assistant", "Welkom.")],
    });
    renderWindow({ starters: STARTERS });
    expect(screen.getByRole("button", { name: "Leg uit" })).toBeInTheDocument();
  });

  test("hides chips block entirely when starters prop is empty array", () => {
    renderWindow({ starters: [] });
    expect(screen.queryByText(/of begin met/i)).not.toBeInTheDocument();
  });

  test("clicking a starter fires sendMessage with the chip prompt", async () => {
    const user = userEvent.setup();
    renderWindow({ starters: STARTERS });
    await user.click(screen.getByRole("button", { name: "Leg uit" }));
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    expect(mockSendMessage).toHaveBeenCalledWith({
      text: "Leg uit wat dit is.",
    });
  });

  test("starter buttons disable while status is streaming", () => {
    setChatState({ status: "streaming" });
    renderWindow({ starters: STARTERS });
    expect(screen.getByRole("button", { name: "Leg uit" })).toBeDisabled();
  });
});

describe("AiChatWindow — input + submission", () => {
  test("typing + clicking Verstuur submits the text and clears input", async () => {
    const user = userEvent.setup();
    renderWindow();
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "hoi leercoach");
    await user.click(screen.getByRole("button", { name: "Verstuur" }));
    expect(mockSendMessage).toHaveBeenCalledWith({ text: "hoi leercoach" });
    expect((textarea as HTMLTextAreaElement).value).toBe("");
  });

  test("Enter submits, Shift+Enter inserts newline", async () => {
    const user = userEvent.setup();
    renderWindow();
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "regel 1");
    // Shift+Enter should not submit; should insert a newline.
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(textarea, "regel 2");
    expect(mockSendMessage).not.toHaveBeenCalled();
    // A plain Enter submits.
    await user.keyboard("{Enter}");
    expect(mockSendMessage).toHaveBeenCalledTimes(1);
    const call = mockSendMessage.mock.calls[0]?.[0];
    expect(call?.text).toContain("regel 1");
    expect(call?.text).toContain("regel 2");
  });

  test("empty / whitespace-only input does not submit", async () => {
    const user = userEvent.setup();
    renderWindow();
    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "   ");
    // Button is disabled; clicking does nothing. Keyboard Enter also
    // bails out of handleSubmit early. Assert no send.
    await user.keyboard("{Enter}");
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test("input and send button disable while streaming", () => {
    setChatState({ status: "streaming" });
    renderWindow();
    expect(screen.getByRole("textbox")).toBeDisabled();
    // The send button shows "…" while loading.
    expect(screen.getByRole("button", { name: "…" })).toBeDisabled();
  });

  test("placeholder can be overridden via props", () => {
    renderWindow({ placeholder: "Custom prompt" });
    expect(screen.getByPlaceholderText("Custom prompt")).toBeInTheDocument();
  });
});

describe("AiChatWindow — error surface", () => {
  test("renders the built-in error box when error is set", () => {
    setChatState({ error: new Error("gateway timeout") });
    renderWindow();
    expect(screen.getByText(/er ging iets mis/i)).toBeInTheDocument();
    expect(screen.getByText("gateway timeout")).toBeInTheDocument();
  });

  test("calls onError callback when error state appears", () => {
    const onError = vi.fn();
    setChatState({ error: new Error("boom") });
    renderWindow({ onError });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]?.[0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0]?.[0].message).toBe("boom");
  });
});

describe("AiChatWindow — className prop", () => {
  test("appends consumer className to the outermost container", () => {
    const { container } = renderWindow({ className: "my-custom-cls" });
    const outer = container.firstElementChild;
    expect(outer?.className).toContain("my-custom-cls");
  });
});

// --- sanity check so the fireEvent import isn't orphaned; it'll be used
// by the useStickyScroll tests in a sibling file, but vitest errors on
// unused named imports when `noUnusedLocals` is strict. Reference once. ---
void fireEvent;
