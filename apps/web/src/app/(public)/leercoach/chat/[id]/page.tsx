import { Leercoach } from "@nawadi/core";
import { notFound } from "next/navigation";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import { createClient } from "~/lib/supabase/server";
import { ChangeScopeButton } from "../../_components/ChangeScopeButton";
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

  // Load messages + kerntaken in parallel. Kerntaken feed the scope-
  // change picker — only needed for N4/N5, but we load unconditionally
  // so the client component can decide based on niveauRang.
  const [messages, profielMeta] = await Promise.all([
    Leercoach.Message.getByChatId({ chatId: chat.chatId }),
    resolveProfielMeta(chat.profielId),
  ]);

  return (
    <main className="flex h-[calc(100vh-6rem)] flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-col">
          <h1 className="text-xl font-semibold text-slate-900">
            {chat.title || scopeLabel(chat.scope) || "Leercoach-sessie"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {profielMeta ? (
            <ChangeScopeButton
              chatId={chat.chatId}
              niveauRang={profielMeta.niveauRang}
              kerntaken={profielMeta.kerntaken}
              currentScope={chat.scope}
            />
          ) : null}
          <a
            href="/leercoach/prior-portfolios"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            Eerdere portfolio's
          </a>
          <a
            href="/leercoach"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            ← Alle sessies
          </a>
        </div>
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

// Resolve niveauRang + kerntaken for the chat's profiel. Same scanning
// pattern as chat-context.ts — public read path has no byId helper, so
// we iterate niveaus until we find the match.
async function resolveProfielMeta(profielId: string): Promise<{
  niveauRang: number;
  kerntaken: Array<{ id: string; titel: string; rang: number }>;
} | null> {
  const niveaus = await listKssNiveaus();
  for (const niveau of niveaus) {
    const profielen = await listKssKwalificatieprofielenWithOnderdelen(
      niveau.id,
    );
    const match = profielen.find((p) => p.id === profielId);
    if (!match) continue;
    return {
      niveauRang: niveau.rang,
      kerntaken: match.kerntaken.map((k) => ({
        id: k.id,
        titel: k.titel,
        rang: k.rang ?? 0,
      })),
    };
  }
  return null;
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
