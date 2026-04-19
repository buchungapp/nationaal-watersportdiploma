import { gateway } from "@ai-sdk/gateway";
import { Leercoach } from "@nawadi/core";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { after, NextResponse } from "next/server";
import { createClient } from "~/lib/supabase/server";

// Chat API for /leercoach — streaming text completions via AI Gateway.
// v1 scope: text-only messages, no tools, no artifacts, no resumable streams.
// Later phases add rubric-aware system prompt (P2), tool calls for
// corpus retrieval + prior-portfolio lookup (P2), and bewijs-draft
// artifacts (P4).

export const maxDuration = 60;

const MODEL_ID = "anthropic/claude-sonnet-4-5";

const SYSTEM_PROMPT_V1 = `Je bent een digitale leercoach voor een kandidaat die werkt aan hun PvB-portfolio voor de NOC*NSF-kwalificatie binnen de watersport.

Je rol:
- Je helpt de kandidaat hun eigen verhaal te vormen. Je schrijft NIET voor ze.
- Je stelt gerichte, open vragen die concrete praktijkvoorbeelden uitlokken (situatie, taak, actie, resultaat).
- Je wijst op blinde vlekken zonder ze in te vullen.
- Je reageert warm en respectvol, als een ervaren collega-instructeur die nieuwsgierig is naar hun verhaal.

Schrijfstijl:
- Nederlands, ik-vorm waar natuurlijk.
- Korte zinnen, praktijktaal.
- Geen em-dashes (—); gebruik komma's, punten of haakjes.
- Geen clichés zoals "cruciaal", "essentieel", "resulteerde in".
- Geen meta-samenvattingen ("dit laat zien dat…"). Laat de kandidaat zelf betekenis geven.

Beperkingen van deze prototype-versie:
- Je hebt nog geen toegang tot de specifieke beoordelingscriteria van de kandidaat's profiel; dat komt later.
- Je hebt nog geen toegang tot hun eerdere portfolio's; dat komt later.

Voor nu: help ze hun gedachten ordenen, stel zinvolle vragen, en reageer op wat ze vertellen.`;

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

  // Verify the chat belongs to this user. getChatById returns null on mismatch
  // (no throw) so we can't leak chat existence across users.
  const chat = await Leercoach.Chat.getById({
    chatId: body.id,
    userId: user.id,
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  // The latest user message is the one we need to persist. Anything older
  // was already persisted in previous turns (or is being replayed by the
  // client from DB). We identify it as the last message with role "user".
  const latestUserMessage = [...body.messages]
    .reverse()
    .find((m) => m.role === "user");

  const modelMessages = await convertToModelMessages(body.messages);

  const result = streamText({
    model: gateway(MODEL_ID),
    system: SYSTEM_PROMPT_V1,
    messages: modelMessages,
    temperature: 0.6,
    stopWhen: stepCountIs(5),
  });

  // Persist the user turn synchronously (before streaming starts) so that a
  // page refresh mid-stream still shows what the user asked.
  if (latestUserMessage) {
    // Only persist if it's not already in DB — the client sends the whole
    // history back, which for a new message means the last item isn't
    // server-saved yet. Heuristic: check whether its id already exists.
    const existingIds = await Leercoach.Message.getByChatId({
      chatId: chat.chatId,
    });
    const alreadySaved = existingIds.some(
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

  // Persist assistant response after stream completes.
  after(async () => {
    try {
      const text = await result.text;
      await Leercoach.Message.save({
        chatId: chat.chatId,
        role: "assistant",
        parts: [{ type: "text", text }],
      });
    } catch (err) {
      console.error("Failed to persist assistant message", err);
    }
  });

  return result.toUIMessageStreamResponse();
}
