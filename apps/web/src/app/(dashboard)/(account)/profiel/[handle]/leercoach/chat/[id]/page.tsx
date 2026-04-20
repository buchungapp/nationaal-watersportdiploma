import { AiCorpus, Leercoach } from "@nawadi/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Heading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import { listProfielenForUpload } from "../../../_lib/list-profielen-for-upload";
import { requireInstructorPerson } from "../../../_lib/require-instructor-person";
import { ChangeScopeButton } from "../../_components/ChangeScopeButton";
import { ChatShell } from "../../_components/ChatShell";
import { ScopeReferenceToggle } from "../../_components/ScopeReferenceToggle";
import {
  filterWerkprocessenByScope,
  loadLeercoachRubric,
} from "../../_lib/rubric";

export const metadata: Metadata = {
  title: "Leercoach · chat",
  robots: { index: false, follow: false },
};

export default async function LeercoachChatPage(props: {
  params: Promise<{ handle: string; id: string }>;
}) {
  const { handle, id } = await props.params;
  const { user } = await requireInstructorPerson(handle);

  const chat = await Leercoach.Chat.getById({
    chatId: id,
    userId: user.authUserId,
  });
  if (!chat) notFound();

  // Load messages + profiel meta + full profielen list + the user's
  // prior-portfolio count + this chat's artefacten + the full rubric
  // in parallel. profielMeta feeds the scope-change picker (only
  // matters for N4/N5); the full profiel list feeds the upload
  // dialog's picker; priorPortfolioCount drives upload-aware copy
  // in the starter chips; artefacten seed the chip strip above the
  // composer; the rubric feeds the "Rubriek" reference drawer so the
  // kandidaat can look up what a werkproces code means mid-conversation.
  const [messages, profielMeta, profielen, priorSources, artefacten, rubric] =
    await Promise.all([
      Leercoach.Message.getByChatId({ chatId: chat.chatId }),
      resolveProfielMeta(chat.profielId),
      listProfielenForUpload(),
      AiCorpus.listUserPriorSources({ userId: user.authUserId }),
      AiCorpus.listArtefactsForChat({
        chatId: chat.chatId,
        userId: user.authUserId,
      }),
      loadLeercoachRubric(chat.profielId),
    ]);
  const priorPortfolioCount = priorSources.length;
  const scopedWerkprocessen = rubric
    ? filterWerkprocessenByScope(rubric.werkprocessen, chat.scope)
    : [];

  return (
    <div className="flex h-[calc(100dvh-10rem)] flex-col gap-4">
      {/*
        `100dvh` (dynamic viewport height) tracks iOS Safari's
        retracting address bar — `100vh` would clip the composer
        behind browser chrome when the bar expands on scroll-up.
      */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 pb-3">
        <div className="flex min-w-0 flex-col gap-1">
          <TextLink
            href={`/profiel/${handle}/leercoach`}
            className="text-xs"
          >
            ← Alle sessies
          </TextLink>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Heading
              level={2}
              // `text-pretty` keeps long Dutch titles from widowing
              // the last word on narrow viewports.
              className="text-pretty"
            >
              {chat.title || scopeLabel(chat.scope) || "Leercoach-sessie"}
            </Heading>
            <Badge color="amber">Experimenteel</Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {rubric ? (
            <ScopeReferenceToggle
              rubric={rubric}
              scopedWerkprocessen={scopedWerkprocessen}
            />
          ) : null}
          {profielMeta ? (
            <ChangeScopeButton
              handle={handle}
              chatId={chat.chatId}
              niveauRang={profielMeta.niveauRang}
              kerntaken={profielMeta.kerntaken}
              currentScope={chat.scope}
            />
          ) : null}
        </div>
      </header>

      <ChatShell
        handle={handle}
        chatId={chat.chatId}
        profielen={profielen}
        currentProfielId={chat.profielId}
        priorPortfolioCount={priorPortfolioCount}
        initialArtefacten={artefacten}
        initialMessages={messages.map((m) => ({
          id: m.messageId,
          role: m.role,
          parts: m.parts,
        }))}
      />
    </div>
  );
}

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

// Defensive fallback: `chat.title` is populated via buildChatTitle at
// creation time. When it's somehow empty we only know the rang-string
// codes from the stored scope — rang is ordering, not display, so we
// drop the number rather than print a misleading "Kerntaak 41".
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
      return "Kerntaak";
    case "kerntaken":
      return "Kerntaken";
  }
}

// Unused locally but a companion to Text — the import keeps the
// primitive available if we later add inline descriptive copy.
void Text;
