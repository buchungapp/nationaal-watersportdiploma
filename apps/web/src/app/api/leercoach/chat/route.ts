import { gateway } from "@ai-sdk/gateway";
import { AiCorpus, Leercoach } from "@nawadi/core";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { NextResponse } from "next/server";
import { buildSystemPrompt } from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/system-prompt";
import { buildLeercoachTools } from "~/app/(dashboard)/(account)/profiel/[handle]/leercoach/_lib/tools";
import { createClient } from "~/lib/supabase/server";

// Chat API for /leercoach — streaming text completions via AI Gateway with
// tool-call support.
//
// Pipeline:
//   1. Auth + chat-ownership check
//   2. Persist the latest user message synchronously (so a mid-stream
//      refresh still shows what they asked)
//   3. Build system prompt (scoped rubric) + tools (corpus lookup)
//   4. streamText with tools, wrapped in createUIMessageStream so
//      tool-call + tool-result parts are included in the saved assistant
//      message(s)
//   5. onFinish persists every assistant message produced during this
//      turn (may be multiple if the model took several steps via tool
//      calls before its final text response)

export const maxDuration = 60;

const MODEL_ID = "anthropic/claude-sonnet-4-5";

export async function POST(req: Request) {
  if (!process.env.AI_GATEWAY_API_KEY) {
    return NextResponse.json(
      { error: "AI_GATEWAY_API_KEY ontbreekt op de server." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const body = (await req.json()) as {
    id: string;
    messages: UIMessage[];
  };

  if (!body?.id || !Array.isArray(body.messages)) {
    return NextResponse.json(
      { error: "id en messages zijn verplicht." },
      { status: 400 },
    );
  }

  const chat = await Leercoach.Chat.getById({
    chatId: body.id,
    userId: user.id,
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  // Persist the latest user turn BEFORE streaming starts — a mid-stream
  // refresh should still show what the kandidaat asked. We identify the
  // latest user message (client sends the whole history), dedup against
  // what's already saved.
  const latestUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");
  if (latestUserMessage) {
    const existing = await Leercoach.Message.getByChatId({
      chatId: chat.chatId,
    });
    const alreadySaved = existing.some(
      (m) => m.messageId === latestUserMessage.id,
    );
    if (!alreadySaved) {
      await Leercoach.Message.save({
        chatId: chat.chatId,
        role: "user",
        parts: latestUserMessage.parts as Array<{
          type: string;
          [k: string]: unknown;
        }>,
      });
    }
  }

  // Resolve the user's prior-portfolio count once per turn and pass it
  // to the system prompt. When the kandidaat has uploads the prompt
  // tells the model to reach for searchPriorPortfolio proactively
  // rather than explaining a hypothetical upload workflow — that was
  // the observed failure mode when starter #2 fired after an upload.
  const priorSources = await AiCorpus.listUserPriorSources({
    userId: user.id,
  });
  const priorPortfolioCount = priorSources.length;

  const [modelMessages, systemPrompt] = await Promise.all([
    convertToModelMessages(body.messages),
    buildSystemPrompt({
      profielId: chat.profielId,
      scope: chat.scope,
      priorPortfolioCount,
    }),
  ]);

  const tools = buildLeercoachTools({
    profielId: chat.profielId,
    scope: chat.scope,
    userId: user.id,
    chatId: chat.chatId,
  });

  const stream = createUIMessageStream({
    execute: async ({ writer: dataStream }) => {
      const result = streamText({
        model: gateway(MODEL_ID),
        system: systemPrompt,
        messages: modelMessages,
        tools,
        // Allow the model multiple steps so it can call a tool, read
        // the result, then produce its final text. 5 is generous for a
        // single-tool loop; revisit when we add more tools.
        stopWhen: stepCountIs(5),
        temperature: 0.6,
      });
      dataStream.merge(result.toUIMessageStream());
    },
    onFinish: async ({ messages: finishedMessages }) => {
      // Save every assistant message produced during this turn, parts
      // and all (so tool-call + tool-result parts persist too). Failures
      // are logged but non-fatal — the chat stays functional even if a
      // save race-conditions out.
      for (const msg of finishedMessages) {
        try {
          await Leercoach.Message.save({
            chatId: chat.chatId,
            role: msg.role,
            parts: msg.parts as Array<{ type: string; [k: string]: unknown }>,
          });
        } catch (err) {
          console.error("Failed to persist assistant message", err);
        }
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
