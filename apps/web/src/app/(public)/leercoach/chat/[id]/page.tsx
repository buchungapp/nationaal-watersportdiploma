import { Leercoach } from "@nawadi/core";
import { notFound } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { ChatShell } from "../../_components/ChatShell";

export const metadata = {
  title: "Leercoach · chat",
  robots: { index: false, follow: false },
};

type Params = { id: string };

export default async function LeercoachChatPage({
  params,
}: { params: Promise<Params> }) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // layout redirects

  const chat = await Leercoach.Chat.getById({
    chatId: id,
    userId: user.id,
  });
  if (!chat) notFound();

  const messages = await Leercoach.Message.getByChatId({ chatId: chat.chatId });

  return (
    <main className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <header className="flex items-baseline justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {chat.title || "Leercoach-sessie"}
          </h1>
          <p className="text-xs text-slate-500">{scopeLabel(chat.scope)}</p>
        </div>
        <a
          href="/leercoach"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Alle sessies
        </a>
      </header>

      <ChatShell
        chatId={chat.chatId}
        initialMessages={messages.map((m) => ({
          id: m.messageId,
          role: m.role,
          parts: m.parts,
        }))}
      />
    </main>
  );
}

function scopeLabel(
  scope:
    | { type: "full_profiel" }
    | { type: "kerntaak"; kerntaakCode: string }
    | { type: "kerntaken"; kerntaakCodes: string[] },
): string {
  switch (scope.type) {
    case "full_profiel":
      return "Hele profiel";
    case "kerntaak":
      return `Kerntaak ${scope.kerntaakCode}`;
    case "kerntaken":
      return `Kerntaken ${scope.kerntaakCodes.join(", ")}`;
  }
}
