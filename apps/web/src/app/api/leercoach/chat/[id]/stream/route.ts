import { Leercoach } from "@nawadi/core";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { Redis } from "ioredis";
import { after, NextResponse } from "next/server";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { leercoachEnabled } from "~/lib/flags";
import { createClient } from "~/lib/supabase/server";

// Resumable-stream reconnect + cancel endpoints for a single chat.
//
// GET  — called automatically by useChat({ resume: true }) on mount,
//        and by manual navigation back to a mid-stream chat. Returns
//        a 204 when there is nothing to resume, otherwise a ReadableStream
//        replaying the in-flight chunks from Redis with the SSE
//        headers that `useChat` expects.
//
// DELETE — called by the client Stop button. We don't try to kill the
//          stream from here; instead we flag canceledAt on the chat row,
//          which the POST route's throttled onChunk picks up within
//          ~1s and uses to abort streamText server-side. This keeps all
//          LLM-abort logic in one place and survives client disconnects.

let _redis: Redis | null = null;
function getRedis(): Redis {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL;
  if (!url || url.trim() === "") {
    throw new Error(
      "REDIS_URL is required for resumable streams — see docker-compose.yml or set the Upstash URL in production.",
    );
  }
  _redis = new Redis(url);
  return _redis;
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await leercoachEnabled())) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  const chat = await Leercoach.Chat.getById({
    chatId: id,
    userId: user.id,
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  // No active stream — nothing to reconnect to. 204 is the contract
  // useChat understands as "fine, stay idle".
  if (chat.activeStreamId == null) {
    return new Response(null, { status: 204 });
  }

  const redis = getRedis();
  const streamContext = createResumableStreamContext({
    waitUntil: after,
    publisher: redis,
    subscriber: redis.duplicate(),
  });

  const resumed = await streamContext.resumeExistingStream(chat.activeStreamId);
  if (!resumed) {
    // Marker was stale (e.g. Redis evicted the key). Clear it so a
    // future GET doesn't hit the same hole, and tell the client there's
    // nothing to resume.
    try {
      await Leercoach.Chat.setActiveStreamId({ chatId: id, streamId: null });
    } catch {
      // Swallow — best effort cleanup.
    }
    return new Response(null, { status: 204 });
  }

  return new Response(resumed, { headers: UI_MESSAGE_STREAM_HEADERS });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await leercoachEnabled())) {
    return NextResponse.json({ error: "Niet gevonden." }, { status: 404 });
  }

  const { id } = await ctx.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Niet ingelogd." }, { status: 401 });
  }

  // Verify ownership before writing the cancel marker — defence in
  // depth against someone probing chat ids.
  const chat = await Leercoach.Chat.getById({
    chatId: id,
    userId: user.id,
  });
  if (!chat) {
    return NextResponse.json({ error: "Chat niet gevonden." }, { status: 404 });
  }

  await Leercoach.Chat.markCanceled({ chatId: id, userId: user.id });
  return new Response(null, { status: 200 });
}
