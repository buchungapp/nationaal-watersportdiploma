"use server";

import { Leercoach } from "@nawadi/core";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getUserOrThrow } from "~/lib/nwd";
import { buildChatTitle, resolveChatContext } from "./_lib/chat-context";
import { buildOpeningMessage } from "./_lib/opening-message";
import { requireLeercoachEnabled } from "./_lib/require-leercoach-enabled";

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
  /**
   * Required when the picked profiel has richting=instructeur, null
   * otherwise. The core model rejects mismatched combinations, so
   * the picker UI is the first line of enforcement.
   */
  instructieGroepId: string | null;
  title?: string;
  /** Person handle for the viewing context — threads through to redirect + revalidate paths. */
  handle: string;
};

export async function createChatAction(
  input: CreateChatInput,
): Promise<{ chatId: string }> {
  await requireLeercoachEnabled();
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
    instructieGroepId: input.instructieGroepId,
    title: input.title?.trim() || autoTitle,
  });

  // Attach to the kandidaat's portfolio for this
  // (profiel, scope, instructieGroep) tuple. One active portfolio per
  // tuple — a new chat on the same tuple picks up the existing doc
  // rather than creating a parallel one. Non-fatal if it fails (the
  // chat still works); the UI will degrade to "no doc pane" until
  // the attachment is retried.
  try {
    const { portfolioId } = await Leercoach.Portfolio.resolveOrCreate({
      userId: user.authUserId,
      profielId: input.profielId,
      scope: input.scope,
      instructieGroepId: input.instructieGroepId,
      titleWhenCreating: input.title?.trim() || autoTitle,
    });
    await Leercoach.Portfolio.attachChat({ chatId, portfolioId });
  } catch (err) {
    console.error("Failed to attach portfolio to new chat", err);
  }

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

// createQAChatAction — called from the index page's "Stel een vraag"
// CTA. Creates a chat with no profiel/scope/portfolio binding and
// redirects straight into it. `_formData` is ignored: the action is
// invoked via `<form action={bound}>` where `handle` is pre-bound and
// the browser's FormData lands as the second arg — we don't read it.
export async function createQAChatAction(
  input: { handle: string },
  _formData?: FormData,
): Promise<void> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();

  const { chatId } = await Leercoach.Chat.createQAChat({
    userId: user.authUserId,
  });

  // No opening-message template for Q&A chats — the blank canvas +
  // starter chips is the right entry UX (starters already cover the
  // "what can I ask" question). Skipping the save keeps creation
  // instant; for portfolio chats the opening message is higher value
  // because it names the scope + next steps.

  redirect(`/profiel/${input.handle}/leercoach/chat/${chatId}`);
}

// editPortfolioAction — called from the portfolio detail page's
// "Bewerk concept" button ONLY when the portfolio has no attached
// chat yet. Creates a minimal chat (same as createPortfolioChatAction
// but without the opening message) and redirects with ?focus=doc so
// the chat page lands with the editor full-width and chat pane
// collapsed. Subsequent "Bewerk" clicks skip this action entirely —
// the page-side component links directly to the existing chat.
export async function editPortfolioAction(
  input: { handle: string; portfolioId: string },
  _formData?: FormData,
): Promise<void> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();

  const portfolio = await Leercoach.Portfolio.getById({
    portfolioId: input.portfolioId,
    userId: user.authUserId,
  });
  if (!portfolio) {
    throw new Error("Portfolio niet gevonden.");
  }

  const ctx = await resolveChatContext({
    profielId: portfolio.profielId,
    scope: portfolio.scope,
  });

  const { chatId } = await Leercoach.Chat.createPortfolioChat({
    userId: user.authUserId,
    portfolioId: portfolio.portfolioId,
    title: portfolio.title || buildChatTitle(ctx),
  });

  // Skip the opening assistant message — we're entering doc-focused
  // mode, not coaching mode. The chat exists but starts empty; the
  // user can toggle the chat pane open anytime to begin a
  // conversation, and the coach has full context from the portfolio.

  redirect(
    `/profiel/${input.handle}/leercoach/chat/${chatId}?focus=doc`,
  );
}

// createPortfolioChatAction — called from the portfolio detail page's
// "Nieuwe sessie" CTA. Creates a chat already bound to the given
// portfolio (profielId + scope inherited, portfolioId attached). The
// opening message is templated using the portfolio's profiel+scope
// context, same as the legacy new-chat flow.
export async function createPortfolioChatAction(
  input: { handle: string; portfolioId: string },
  _formData?: FormData,
): Promise<void> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();

  const portfolio = await Leercoach.Portfolio.getById({
    portfolioId: input.portfolioId,
    userId: user.authUserId,
  });
  if (!portfolio) {
    throw new Error("Portfolio niet gevonden.");
  }

  const ctx = await resolveChatContext({
    profielId: portfolio.profielId,
    scope: portfolio.scope,
  });

  const { chatId } = await Leercoach.Chat.createPortfolioChat({
    userId: user.authUserId,
    portfolioId: portfolio.portfolioId,
    title: portfolio.title || buildChatTitle(ctx),
  });

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
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();
  await Leercoach.Chat.softDelete({
    chatId: input.chatId,
    userId: user.authUserId,
  });
  revalidatePath(`/profiel/${input.handle}/leercoach`);
  revalidatePath(`/profiel/${input.handle}`);
}

// promoteChatAction — one-way latch from vraag-sessie to
// portfolio-sessie. Resolve-or-creates the kandidaat's portfolio for
// the target (profiel, scope) tuple, then calls core's atomic
// promoteToPortfolio to update chat.profielId / chat.scope /
// chat.portfolioId in one transaction. Saves an informational
// assistant message so the transition is legible in history.
export async function promoteChatAction(input: {
  chatId: string;
  handle: string;
  profielId: string;
  scope: CreateChatInput["scope"];
  /**
   * Required when richting=instructeur; null otherwise. Must match
   * the portfolio's instructieGroepId — enforced by resolveOrCreate's
   * validation + the chat-side update below.
   */
  instructieGroepId: string | null;
}): Promise<void> {
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();

  const ctx = await resolveChatContext({
    profielId: input.profielId,
    scope: input.scope,
  });
  const newTitle = buildChatTitle(ctx);

  const { portfolioId } = await Leercoach.Portfolio.resolveOrCreate({
    userId: user.authUserId,
    profielId: input.profielId,
    scope: input.scope,
    instructieGroepId: input.instructieGroepId,
    titleWhenCreating: newTitle,
  });

  await Leercoach.Chat.promoteToPortfolio({
    chatId: input.chatId,
    userId: user.authUserId,
    profielId: input.profielId,
    scope: input.scope,
    instructieGroepId: input.instructieGroepId,
    portfolioId,
    title: newTitle,
  });

  try {
    await Leercoach.Message.save({
      chatId: input.chatId,
      role: "assistant",
      parts: [
        {
          type: "text",
          text: `_Gekoppeld aan portfolio **${ctx.scopeLabel}**._ Vanaf nu werken we gericht aan dit portfolio. De eerdere uitwisseling blijft staan als context.`,
        },
      ],
    });
  } catch (err) {
    console.error("Failed to save promotion message", err);
  }

  revalidatePath(`/profiel/${input.handle}/leercoach/chat/${input.chatId}`);
  revalidatePath(`/profiel/${input.handle}/leercoach`);
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
  await requireLeercoachEnabled();
  const user = await getUserOrThrow();

  const chat = await Leercoach.Chat.getById({
    chatId: input.chatId,
    userId: user.authUserId,
  });
  if (!chat) {
    throw new Error("Chat niet gevonden.");
  }
  // Scope change only makes sense on a portfolio-sessie — a Q&A chat
  // has no profiel to re-scope. Promoting a Q&A chat to a portfolio
  // chat lives behind a separate action (see promote flow in step 7).
  if (chat.profielId === null) {
    throw new Error(
      "Scope wijzigen kan alleen in een portfolio-sessie. Koppel de chat eerst aan een portfolio.",
    );
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
