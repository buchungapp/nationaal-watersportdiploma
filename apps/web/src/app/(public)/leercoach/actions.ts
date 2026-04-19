"use server";

import { Leercoach } from "@nawadi/core";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";

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

  const { chatId } = await Leercoach.Chat.create({
    userId: user.id,
    profielId: input.profielId,
    scope: input.scope,
    title: input.title ?? "",
  });

  redirect(`/leercoach/chat/${chatId}`);
}
