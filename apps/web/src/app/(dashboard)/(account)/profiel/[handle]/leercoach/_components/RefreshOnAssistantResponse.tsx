"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAiChatContext } from "~/app/_components/ai-chat";

// Renderless bridge: when a streamed assistant turn lands, trigger
// `router.refresh()` so the server component re-reads chat state
// (currently just the phase) that tool calls might have mutated.
//
// Must be mounted INSIDE the AiChat provider so it can read the
// streaming status + messages array.
//
// Why not revalidatePath from the tool's execute? Because there's
// no cache layer between the chat page's server component and the
// DB — `Leercoach.Chat.getById` reads fresh each render. What we
// need is for the browser to actually re-render; that's `refresh()`.
//
// Debounced to once-per-assistant-response via message count so we
// don't refresh on every streamed token tick.
export function RefreshOnAssistantResponse() {
  const {
    state: { messages, status },
  } = useAiChatContext();
  const router = useRouter();
  const lastAssistantCount = useRef<number>(
    messages.filter((m) => m.role === "assistant").length,
  );

  useEffect(() => {
    if (status !== "ready") return;
    const assistantCount = messages.filter((m) => m.role === "assistant").length;
    if (assistantCount === lastAssistantCount.current) return;
    lastAssistantCount.current = assistantCount;
    router.refresh();
  }, [messages, status, router]);

  return null;
}
