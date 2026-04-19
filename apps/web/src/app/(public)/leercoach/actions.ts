"use server";

import { Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { buildChatTitle, resolveChatContext } from "./_lib/chat-context";
import { buildOpeningMessage } from "./_lib/opening-message";

// createChatAction — called from the new-chat form.
// Per Q1 (leercoach-pivot.md): the UI picks the scope shape based on niveau
// (N3 always full_profiel, N4/N5 can pick); here we just accept whatever
// shape arrived and validate via the Zod schema inside Leercoach.Chat.create.
export type CreateChatInput = {
  profielId: string;
  scope:
    | { type: "full_profiel" }
    | { type: "kerntaak"; kerntaakCode: string }
    | { type: "kerntaken"; kerntaakCodes: string[] };
  title?: string;
};

export async function createChatAction(
  input: CreateChatInput,
): Promise<{ chatId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Niet ingelogd.");
  }

  // Resolve profiel + kerntaak titels once and reuse for both the title
  // and the opening message.
  const ctx = await resolveChatContext({
    profielId: input.profielId,
    scope: input.scope,
  });
  const autoTitle = buildChatTitle(ctx);

  const { chatId } = await Leercoach.Chat.create({
    userId: user.id,
    profielId: input.profielId,
    scope: input.scope,
    title: input.title?.trim() || autoTitle,
  });

  // Save an opening assistant message so the kandidaat lands on the chat
  // page with real guidance instead of a blank canvas. Template-based; no
  // LLM call at creation time (keeps things fast + deterministic).
  try {
    const openingText = buildOpeningMessage(ctx);
    await Leercoach.Message.save({
      chatId,
      role: "assistant",
      parts: [{ type: "text", text: openingText }],
    });
  } catch (err) {
    // Non-fatal: if the opening message fails, the chat still works — the
    // kandidaat will just see the empty state we used to show. Log for
    // visibility so we can spot regressions.
    console.error("Failed to save opening message", err);
  }

  redirect(`/leercoach/chat/${chatId}`);
}

// Soft-delete a chat. The core helper verifies user ownership via the
// userId match — callers cannot delete other users' chats even with a
// guessed chatId. Triggers a revalidation of /leercoach so the list
// refreshes after navigation back.
export async function deleteChatAction(input: {
  chatId: string;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Niet ingelogd.");
  }

  await Leercoach.Chat.softDelete({
    chatId: input.chatId,
    userId: user.id,
  });

  revalidatePath("/leercoach");
}

// Change the scope of an existing chat mid-session. Used when a kandidaat
// realises they want to zoom in on a single kerntaak (or zoom back out to
// the whole profiel). Saves an informational assistant message explaining
// the shift so the conversation record stays coherent, then revalidates
// so the chat view picks up the new scope on the next render.
export async function updateChatScopeAction(input: {
  chatId: string;
  scope: CreateChatInput["scope"];
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Niet ingelogd.");
  }

  // Fetch the chat first so we can resolve the new scope label in the
  // same profiel context (kerntaak titel lookups need the profielId) AND
  // build a new title that reflects the fresh scope.
  const chat = await Leercoach.Chat.getById({
    chatId: input.chatId,
    userId: user.id,
  });
  if (!chat) {
    throw new Error("Chat niet gevonden.");
  }

  const ctx = await resolveChatContext({
    profielId: chat.profielId,
    scope: input.scope,
  });
  const newTitle = buildChatTitle(ctx);

  await Leercoach.Chat.updateScope({
    chatId: input.chatId,
    userId: user.id,
    scope: input.scope,
    title: newTitle,
  });

  // Log the transition as an assistant message so the conversation shows
  // "we zijn nu op kerntaak 5.1 gefocust" inline. Non-fatal if save fails.
  try {
    await Leercoach.Message.save({
      chatId: input.chatId,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: `_Scope gewijzigd naar **${ctx.scopeLabel}**._ Vanaf nu richten we ons specifiek daarop. Laat me weten wat je als eerste wilt bespreken.`,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to save scope-change message", err);
  }

  revalidatePath(`/leercoach/chat/${input.chatId}`);
  revalidatePath("/leercoach");
}
