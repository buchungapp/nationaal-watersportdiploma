// Component tests for AiChatWindow (the thin wrapper around the AiChat
// compound) + the AiChat pieces via their shared context.
//
// Strategy (Layer 1 per leercoach-pivot.md): mock `useChat` and
// `streamdown` at the module level so the test is isolated from
// network + heavyweight markdown rendering. Asserts observable UI
// behaviour: message rendering, starter chips, input submission,
// keyboard handling, error surface, lifecycle around `onError`, and
// context-based composition (children access sendMessage +
// isLoading via useAiChatContext).

import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// --- Mock @ai-sdk/react.useChat ---
// useChat is called once per AiChat.Provider render. We control its
// return value per-test via the setChatState helper below.

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
// Reduce to plain text so assertions can find message content without
// depending on streamdown's full markdown pipeline.

vi.mock("streamdown", () => ({
  Streamdown: ({ children }: { children: string }) => (
    <div data-testid="streamdown">{children}</div>
  ),
}));

// --- Imports after mocks so vi.mock hoists before module load ---

import { AiChatWindow } from "./AiChatWindow";
import { useAiChatContext } from "./context";
import type { AiChatInitialMessage, AiChatStarter } from "./types";

function setChatState(partial: Partial<typeof currentChatState>): void {
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

  test("renders unknown non-text non-tool parts as JSON for debug visibility", () => {
    setChatState({
      messages: [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "experimental-attachment",
              name: "screenshot.png",
              url: "blob:abc",
            },
          ],
        },
      ],
    });
    renderWindow();
    const pre = screen.getByText(/experimental-attachment/);
    expect(pre.tagName.toLowerCase()).toBe("pre");
  });

  test("renders tool parts via ToolPartRenderer, not as JSON", () => {
    setChatState({
      messages: [
        {
          id: "m1",
          role: "assistant",
          parts: [
            {
              type: "tool-searchBewijsExamples",
              toolCallId: "call-1",
              state: "input-streaming",
            },
          ],
        },
      ],
    });
    renderWindow();
    expect(
      screen.getByText(/zoekt voorbeelden in geslaagde portfolio/i),
    ).toBeInTheDocument();
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
    await user.keyboard("{Shift>}{Enter}{/Shift}");
    await user.type(textarea, "regel 2");
    expect(mockSendMessage).not.toHaveBeenCalled();
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
    await user.keyboard("{Enter}");
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  test("input and send button disable while streaming", () => {
    setChatState({ status: "streaming" });
    renderWindow();
    expect(screen.getByRole("textbox")).toBeDisabled();
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
  test("appends consumer className to the frame's outer container", () => {
    const { container } = renderWindow({ className: "my-custom-cls" });
    // className lands on the Frame, which is nested inside the Provider.
    // Walk the tree to find the element carrying our test class.
    const match = container.querySelector(".my-custom-cls");
    expect(match).not.toBeNull();
  });
});

describe("AiChatWindow — context-aware children (composition via use())", () => {
  // Follows the vercel-composition-patterns guidance: child UI that
  // needs sendMessage + isLoading consumes useAiChatContext() instead
  // of taking a render-prop callback.

  function TestChild({ label }: { label: string }) {
    const { actions, meta } = useAiChatContext();
    return (
      <button
        type="button"
        data-testid="context-child"
        disabled={meta.isLoading}
        onClick={() => actions.sendMessage({ text: "triggered from child" })}
      >
        {label} — loading: {meta.isLoading ? "yes" : "no"}
      </button>
    );
  }

  test("renders children between starters and the input form", () => {
    renderWindow({
      children: <TestChild label="hello" />,
    });
    expect(screen.getByTestId("context-child")).toHaveTextContent(
      "hello — loading: no",
    );
  });

  test("child can read isLoading from context (streaming)", () => {
    setChatState({ status: "streaming" });
    renderWindow({
      children: <TestChild label="x" />,
    });
    expect(screen.getByTestId("context-child")).toHaveTextContent(
      "loading: yes",
    );
    expect(screen.getByTestId("context-child")).toBeDisabled();
  });

  test("child can call sendMessage via context", async () => {
    const user = userEvent.setup();
    renderWindow({
      children: <TestChild label="x" />,
    });
    await user.click(screen.getByTestId("context-child"));
    expect(mockSendMessage).toHaveBeenCalledWith({
      text: "triggered from child",
    });
  });

  test("useAiChatContext throws when used outside the provider", () => {
    // Consuming the hook outside an <AiChat.Provider> should throw
    // rather than silently no-op — prevents orphaned pieces.
    function Orphan() {
      useAiChatContext();
      return null;
    }
    // Suppress React's error-boundary console noise for this assertion.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Orphan />)).toThrow(
      /must be used inside <AiChat\.Provider>/,
    );
    spy.mockRestore();
  });
});
