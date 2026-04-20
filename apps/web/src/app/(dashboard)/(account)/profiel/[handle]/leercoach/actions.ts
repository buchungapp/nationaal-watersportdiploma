"use server";

import { Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserOrThrow } from "~/lib/nwd";
import { buildChatTitle, resolveChatContext } from "./_lib/chat-context";
import { buildOpeningMessage } from "./_lib/opening-message";

// createChatAction — called from the new-chat form.
// Scope shapes (Q1 in leercoach-pivot.md): N3 always full_profiel;
// N4/N5 can pick full_profiel | kerntaak | kerntaken. Actions don't
// care which shape — the Zod schema inside Leercoach.Chat.create
// validates at the model boundary.
export type CreateChatInput = {
  profielId: string;
  scope:
    | { type: "full_profiel" }
    | { type: "kerntaak"; kerntaakCode: string }
    | { type: "kerntaken"; kerntaakCodes: string[] };
  title?: string;
  /** Person handle for the viewing context — threads through to redirect + revalidate paths. */
  handle: string;
};

export async function createChatAction(
  input: CreateChatInput,
): Promise<{ chatId: string }> {
  const user = await getUserOrThrow();

  const ctx = await resolveChatContext({
    profielId: input.profielId,
    scope: input.scope,
  });
  const autoTitle = buildChatTitle(ctx);

  const { chatId } = await Leercoach.Chat.create({
    userId: user.authUserId,
    profielId: input.profielId,
    scope: input.scope,
    title: input.title?.trim() || autoTitle,
  });

  // Save an opening assistant message so the kandidaat lands on the chat
  // page with real guidance instead of a blank canvas. Template-based,
  // no LLM call — keeps creation fast + deterministic.
  try {
    const openingText = buildOpeningMessage(ctx);
    await Leercoach.Message.save({
      chatId,
      role: "assistant",
      parts: [{ type: "text", text: openingText }],
    });
  } catch (err) {
    console.error("Failed to save opening message", err);
  }

  redirect(`/profiel/${input.handle}/leercoach/chat/${chatId}`);
}

// Soft-delete a chat. The core helper verifies user ownership via the
// userId match — callers cannot delete other users' chats even with a
// guessed chatId.
export async function deleteChatAction(input: {
  chatId: string;
  handle: string;
}): Promise<void> {
  const user = await getUserOrThrow();
  await Leercoach.Chat.softDelete({
    chatId: input.chatId,
    userId: user.authUserId,
  });
  revalidatePath(`/profiel/${input.handle}/leercoach`);
  revalidatePath(`/profiel/${input.handle}`);
}

// Change the scope of an existing chat mid-session. Used when a
// kandidaat realises they want to zoom in on a single kerntaak (or
// zoom back out to the whole profiel). Saves an informational
// assistant message explaining the shift so the conversation record
// stays coherent.
export async function updateChatScopeAction(input: {
  chatId: string;
  scope: CreateChatInput["scope"];
  handle: string;
}): Promise<void> {
  const user = await getUserOrThrow();

  const chat = await Leercoach.Chat.getById({
    chatId: input.chatId,
    userId: user.authUserId,
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
    userId: user.authUserId,
    scope: input.scope,
    title: newTitle,
  });

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

  revalidatePath(`/profiel/${input.handle}/leercoach/chat/${input.chatId}`);
  revalidatePath(`/profiel/${input.handle}/leercoach`);
}
