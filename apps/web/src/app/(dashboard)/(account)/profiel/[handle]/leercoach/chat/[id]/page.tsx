import { AiCorpus, KSS, Leercoach } from "@nawadi/core";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AiChatInitialMessage } from "~/app/_components/ai-chat";
import {
  listKssKwalificatieprofielenWithOnderdelen,
  listKssNiveaus,
} from "~/lib/nwd";
import { listProfielenForUpload } from "../../../_lib/list-profielen-for-upload";
import { requireInstructorPerson } from "../../../_lib/require-instructor-person";
import { ChatShell } from "../../_components/ChatShell";
import {
  approximateTotalTokens,
  CONTEXT_WARN_TOKEN_THRESHOLD,
} from "../../_lib/compaction";
import { requireLeercoachEnabled } from "../../_lib/require-leercoach-enabled";
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
  searchParams: Promise<{ focus?: string }>;
}) {
  const { handle, id } = await props.params;
  // `?focus=doc` arrives from the portfolio detail page's "Bewerk
  // concept" affordance. We don't validate beyond the narrow shape —
  // anything else just means "normal layout". The value is passed as
  // an opaque hint into ChatShell and ignored when the chat has no
  // portfolio attached.
  const searchParams = await props.searchParams;
  const initialFocus =
    searchParams.focus === "doc" ? ("doc" as const) : undefined;
  await requireLeercoachEnabled();
  const { user } = await requireInstructorPerson(handle);

  const chat = await Leercoach.Chat.getById({
    chatId: id,
    userId: user.authUserId,
  });
  if (!chat) notFound();

  // Two shapes flow through this page now: portfolio-sessies (profiel
  // bound) render the full 3-pane shell; vraag-sessies (profielId +
  // scope null) render a chat-only shell — the rubric / doc panes
  // auto-hide via Panes.Provider's `hasX` meta. Data-loading branches
  // below: everything profiel-dependent (rubric, profielMeta, scoped
  // werkprocessen, portfolio) skips to null/[] when profielId is null.
  const profielId = chat.profielId;
  const scope = chat.scope;

  // Load messages + full profielen list + the user's prior-portfolio
  // count + this chat's artefacten in parallel — these are always
  // fetched regardless of chat shape. profielMeta + rubric + portfolio
  // are fetched conditionally based on whether this is a portfolio
  // sessie (profielId !== null).
  const [messages, profielen, priorSources, artefacten, instructieGroepen] =
    await Promise.all([
      Leercoach.Message.getByChatId({ chatId: chat.chatId }),
      listProfielenForUpload(),
      AiCorpus.listUserPriorSources({ userId: user.authUserId }),
      AiCorpus.listArtefactsForChat({
        chatId: chat.chatId,
        userId: user.authUserId,
      }),
      // Needed for PromoteToPortfolioDialog (vraag-sessie → portfolio
      // promotion picker). Included unconditionally because a Q&A chat
      // can become a portfolio chat mid-session and we don't want a
      // second round-trip when the user clicks the menu item.
      KSS.InstructieGroep.list({ filter: {} }),
    ]);

  // Profiel-bound fetches: rubric + profielMeta + portfolio row. All
  // short-circuit to null when this is a vraag-sessie.
  const [profielMeta, rubric, portfolioRow] = profielId
    ? await Promise.all([
        resolveProfielMeta(profielId),
        loadLeercoachRubric(profielId),
        chat.portfolioId
          ? Leercoach.Portfolio.getById({
              portfolioId: chat.portfolioId,
              userId: user.authUserId,
            })
          : Promise.resolve(null),
      ])
    : ([null, null, null] as const);

  // Portfolio-dependent fetches (current version + version history).
  // Keeps the top-level Promise.all lean and avoids N+1 when the chat
  // has no portfolio (vraag-sessies + legacy chats).
  const [portfolioCurrentVersion, portfolioVersions] = portfolioRow
    ? await Promise.all([
        portfolioRow.currentVersionId
          ? Leercoach.Portfolio.getVersionById({
              versionId: portfolioRow.currentVersionId,
              userId: user.authUserId,
            })
          : Promise.resolve(null),
        Leercoach.Portfolio.listVersions({
          portfolioId: portfolioRow.portfolioId,
          userId: user.authUserId,
        }),
      ])
    : [null, []];
  const priorPortfolioCount = priorSources.length;
  const scopedWerkprocessen =
    rubric && scope
      ? filterWerkprocessenByScope(rubric.werkprocessen, scope)
      : [];
  const title =
    chat.title ||
    (scope ? scopeLabel(scope) : null) ||
    (profielId ? "Leercoach-sessie" : "Nieuwe vraag");

  return (
    // Tighter than before (was `100dvh-10rem`) because the page-level
    // header has been folded into the ChatShell toolbar. `6rem` covers
    // the dashboard navbar + stacked-layout padding; 100dvh tracks iOS
    // Safari's retracting address bar to keep the composer above the
    // browser chrome.
    //
    // Width-escape: the dashboard StackedLayout wraps children in a
    // `max-w-7xl mx-auto` (1280px) column which leaves a lot of empty
    // horizontal space on wider displays for a side-by-side chat +
    // doc workflow. `mx-[calc(50%-50vw)] w-screen` is the standard
    // "escape the centered container" CSS trick: negative horizontal
    // margins equal to the container's side-margins, expanding back
    // to viewport width. Zero-op on viewports narrower than the
    // container (50% - 50vw is non-negative there), so small screens
    // stay within the max-w-7xl lane.
    //
    // `px-*` re-adds breathing room against the viewport edge so
    // the chat card doesn't touch the gutters on very wide screens.
    <div className="flex h-[calc(100dvh-6rem)] flex-col mx-[calc(50%-50vw)] w-screen px-4 2xl:px-8">
      <ChatShell
        handle={handle}
        chatId={chat.chatId}
        profielen={profielen}
        instructieGroepen={instructieGroepen}
        currentProfielId={chat.profielId}
        priorPortfolioCount={priorPortfolioCount}
        initialArtefacten={artefacten}
        rubric={rubric}
        scopedWerkprocessen={scopedWerkprocessen}
        // Resumable-stream handoff: reconnect on mount only when there's
        // actually a stream to resume. Keeps the GET cheap (no 204s
        // fired for idle chats) and gives us free "stream survives
        // navigation" UX out of the box.
        initialResume={chat.activeStreamId !== null}
        initialMessages={buildInitialMessages(messages)}
        title={title}
        currentScope={chat.scope}
        profielMeta={profielMeta}
        // Auto-warn banner fires when the *model-active* history (i.e.
        // uncompacted rows) approaches the context limit. We skip
        // compacted rows because they've already been summarised —
        // their token cost is zero from the model's perspective.
        shouldWarnCompaction={
          approximateTotalTokens(
            messages
              .filter((m) => m.compactedIntoId === null)
              .map((m) => ({
                messageId: m.messageId,
                role: m.role,
                parts: m.parts as Array<{
                  type: string;
                  [k: string]: unknown;
                }>,
                createdAt: m.createdAt,
              })),
          ) >= CONTEXT_WARN_TOKEN_THRESHOLD
        }
        // Portfolio + versions feed the side-by-side doc pane. Null
        // when the chat predates the portfolio model — pane is
        // suppressed + toolbar toggle hides.
        portfolio={
          portfolioRow
            ? {
                portfolioId: portfolioRow.portfolioId,
                currentVersionId: portfolioRow.currentVersionId,
                currentContent: portfolioCurrentVersion?.content ?? "",
                versions: portfolioVersions.map((v) => ({
                  versionId: v.versionId,
                  createdBy: v.createdBy,
                  label: v.label,
                  changeNote: v.changeNote,
                  createdAt: v.createdAt,
                  contentLength: v.contentLength,
                })),
              }
            : null
        }
        initialFocus={initialFocus}
      />
    </div>
  );
}

// Translate DB message rows into the AiChat provider's initial shape,
// attaching compaction bookkeeping where present so the UI can render
// summary rows as dividers + folded rows as faded-and-non-actionable.
//
// Intentionally tolerant: when the DB row has no compaction columns
// set, the `compaction` field is omitted entirely (not `null`) so
// consumers with the old shape keep working unchanged.
function buildInitialMessages(
  rows: Array<{
    messageId: string;
    role: "user" | "assistant" | "system";
    parts: unknown[];
    compactedIntoId: string | null;
    compactionMetadata: {
      kind: "summary";
      messageCount: number;
      fromCreatedAt: string;
      toCreatedAt: string;
      tokensSaved: number;
      preservedDraftMessageId: string | null;
    } | null;
  }>,
): AiChatInitialMessage[] {
  return rows.map((m) => {
    if (m.compactionMetadata?.kind === "summary") {
      return {
        id: m.messageId,
        role: m.role,
        parts: m.parts,
        compaction: {
          kind: "summary",
          messageCount: m.compactionMetadata.messageCount,
          fromCreatedAt: m.compactionMetadata.fromCreatedAt,
          toCreatedAt: m.compactionMetadata.toCreatedAt,
          tokensSaved: m.compactionMetadata.tokensSaved,
        },
      };
    }
    if (m.compactedIntoId !== null) {
      return {
        id: m.messageId,
        role: m.role,
        parts: m.parts,
        compaction: {
          kind: "folded",
          summaryMessageId: m.compactedIntoId,
        },
      };
    }
    return {
      id: m.messageId,
      role: m.role,
      parts: m.parts,
    };
  });
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
