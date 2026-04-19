import { Leercoach } from "@nawadi/core";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "~/lib/supabase/server";

export const metadata: Metadata = {
  title: "Leercoach",
  description:
    "Je digitale leercoach voor de PvB. Upload je eerdere portfolio's, bespreek je werkprocessen, en kom tot concept-bewijs in jouw eigen stem.",
  robots: { index: false, follow: false },
};

// Landing: list user's chats + call-to-action to start a new session.
// Matches Q1 decision (leercoach-pivot.md): one chat per scope selection
// (full profiel / kerntaak / kerntaken). User switches chats to switch
// contexts; we don't force everything into one mega-session.
export default async function LeercoachPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layout already redirects anonymous users; this is defensive.
  if (!user) return null;

  const chats = await Leercoach.Chat.listByUserId({
    userId: user.id,
    limit: 50,
  });

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Leercoach · prototype
        </p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Jouw digitale leercoach
        </h1>
        <p className="max-w-2xl text-slate-700">
          Hier werk je samen met een leercoach aan je PvB-portfolio. Zij schrijft
          niet voor je, maar stelt gerichte vragen, wijst op voorbeelden uit
          vergelijkbare portfolio's, en helpt je jouw verhaal helder te krijgen.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">
            Jouw sessies
          </h2>
          <Link
            href="/leercoach/new"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Nieuwe sessie
          </Link>
        </div>

        {chats.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            <p className="font-semibold text-slate-900">
              Nog geen sessies gestart.
            </p>
            <p className="mt-1">
              Start er één om je portfolio stap voor stap door te lopen met je
              leercoach.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <Link
                  href={`/leercoach/chat/${chat.chatId}`}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-900">
                        {chat.title ||
                          scopeLabel(chat.scope) ||
                          "Nieuwe sessie"}
                      </span>
                      <span className="text-xs text-slate-500">
                        {scopeLabel(chat.scope)} ·{" "}
                        {formatRelative(chat.updatedAt)}
                      </span>
                    </div>
                    <span className="text-slate-400">→</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffSec = Math.round((now - then) / 1000);
  if (diffSec < 60) return "net gewijzigd";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} uur geleden`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} dag${diffDay === 1 ? "" : "en"} geleden`;
  return new Date(iso).toLocaleDateString("nl-NL");
}
