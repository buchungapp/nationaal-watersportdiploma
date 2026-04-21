import { KSS, Leercoach } from "@nawadi/core";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PencilSquareIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { SimpleMarkdown } from "~/app/_components/ai-chat/markdown";
import { requireInstructorPerson } from "../../../_lib/require-instructor-person";
import {
  createPortfolioChatAction,
  editPortfolioAction,
} from "../../actions";
import { requireLeercoachEnabled } from "../../_lib/require-leercoach-enabled";
import { loadLeercoachRubric } from "../../_lib/rubric";
import { SessionRow } from "../../_components/SessionRow";

export const metadata: Metadata = {
  title: "Portfolio-concept · leercoach",
  robots: { index: false, follow: false },
};

// Detail page for a single portfolio-concept. Three zones:
//
//   1. Hero — portfolio title + one-line richting/niveau/instructiegroep
//      subtitle + a quiet meta row (sessies · versies · bijgewerkt).
//      "Experimenteel" badge lives on the /leercoach index + toolbar
//      already; no need to repeat it on every sub-page.
//
//   2. Concept viewer — the portfolio's current version, rendered as
//      markdown via the same streamdown-based renderer the chat uses.
//      Scrollable within max-h-[60vh] with a soft gradient fade at the
//      bottom signalling there's more. If no version exists yet, the
//      card becomes a call-to-start state.
//
//   3. Sessies — list of chats bound to this portfolio, with the
//      "+ Nieuwe sessie" CTA inline in the section header (matches
//      the dashboard pattern where a list-creating CTA lives beside
//      the list it feeds). Deliberately framed around CONVERSATIONS,
//      not document-editing — the Bewerk button above carries the
//      "I just want to type" intent.
//
// Two entry paths for continuing work on this portfolio:
//
//   - "Bewerk concept" (concept card header) → opens the latest chat
//     with `?focus=doc` so the editor is full-width and the chat
//     pane is collapsed. If no chat exists yet the editPortfolio
//     action creates one silently first.
//
//   - "+ Nieuwe sessie" (sessies header) → always creates a fresh
//     chat, opens in normal chat-first layout. For when the user
//     wants to talk, not type.
export default async function PortfolioDetailPage(props: {
  params: Promise<{ handle: string; portfolioId: string }>;
}) {
  const { handle, portfolioId } = await props.params;
  await requireLeercoachEnabled();
  const { user } = await requireInstructorPerson(handle);

  const portfolio = await Leercoach.Portfolio.getById({
    portfolioId,
    userId: user.authUserId,
  });
  if (!portfolio) notFound();

  // Parallel reads: rubric for header metadata, current version for
  // the preview, chat list + version summaries for the meta row,
  // instructiegroep lookup when applicable. listVersions returns
  // summaries only (no content), so including it costs pennies.
  const [rubric, currentVersion, chats, versions, instructieGroep] =
    await Promise.all([
      loadLeercoachRubric(portfolio.profielId),
      portfolio.currentVersionId
        ? Leercoach.Portfolio.getVersionById({
            versionId: portfolio.currentVersionId,
            userId: user.authUserId,
          })
        : Promise.resolve(null),
      Leercoach.Chat.listByPortfolioId({
        portfolioId: portfolio.portfolioId,
        userId: user.authUserId,
        limit: 50,
      }),
      Leercoach.Portfolio.listVersions({
        portfolioId: portfolio.portfolioId,
        userId: user.authUserId,
        limit: 100,
      }),
      portfolio.instructieGroepId
        ? KSS.InstructieGroep.list({
            filter: { id: portfolio.instructieGroepId },
          }).then((rows) => rows[0] ?? null)
        : Promise.resolve(null),
    ]);

  const headerTitle = portfolio.title.trim() || scopeLabel(portfolio.scope);

  // Subtitle: richting + niveau (+ instructiegroep when applicable).
  // Deliberately drops the profiel titel prefix — that's in the header
  // already (portfolio.title is usually "Leercoach 5 — Hele profiel",
  // so re-stating "Leercoach 5" below would just double-print).
  const subtitleParts: string[] = [];
  if (rubric) {
    subtitleParts.push(
      `${richtingLabel(rubric.richting)} niveau ${rubric.niveauRang}`,
    );
  }
  if (instructieGroep) {
    subtitleParts.push(instructieGroep.title);
  }
  const subtitle = subtitleParts.join(" · ");

  // Meta row: quick-scan facts that sit below the subtitle. Kept small
  // and text-only so the eye lands on the concept card next.
  const metaParts: string[] = [];
  metaParts.push(
    chats.length === 1 ? "1 sessie" : `${chats.length} sessies`,
  );
  metaParts.push(
    versions.length === 1 ? "1 versie" : `${versions.length} versies`,
  );
  metaParts.push(`bijgewerkt ${formatRelative(portfolio.updatedAt)}`);
  const meta = metaParts.join(" · ");

  // Sessions come back sorted by updatedAt DESC (see
  // Chat.listByPortfolioId), so chats[0] is the most recent — the
  // natural "pick up where I was" entry.
  const latestChat = chats[0] ?? null;

  const createChat = createPortfolioChatAction.bind(null, {
    handle,
    portfolioId: portfolio.portfolioId,
  });

  // "Bewerk concept" target. Two paths depending on whether a chat
  // exists for this portfolio:
  //
  //   - Existing chat → direct link to that chat with `?focus=doc`
  //     so ChatShell mounts with the chat pane collapsed + doc pane
  //     full-width. Cheap: no action, no redirect roundtrip, just
  //     client-side navigation.
  //
  //   - No chat yet → submit editPortfolioAction, which creates a
  //     minimal chat (no opening message) and redirects to the same
  //     `?focus=doc` URL. Only happens on first Bewerk click for a
  //     given portfolio; subsequent clicks reuse the existing chat.
  //
  // The two branches render different markup below so the server can
  // decide without shipping an action call per view.
  const editPortfolio = editPortfolioAction.bind(null, {
    handle,
    portfolioId: portfolio.portfolioId,
  });
  const editHref = latestChat
    ? `/profiel/${handle}/leercoach/chat/${latestChat.chatId}?focus=doc`
    : null;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Hero (full-width) ──────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <TextLink
          href={`/profiel/${handle}/leercoach`}
          className="text-sm"
        >
          ← Terug naar leercoach
        </TextLink>
        <Heading>{headerTitle}</Heading>
        {subtitle ? (
          <Text className="text-slate-600">{subtitle}</Text>
        ) : null}
        <Text className="text-xs text-slate-500">{meta}</Text>
      </div>

      {/* ── Content grid ───────────────────────────────────────────────
          Side-by-side on lg+ (2:1 — concept wider since it's the
          reading zone, sessies narrower as secondary navigation).
          Stacks back to single column below lg to stay readable on
          tablets and phones. Items-start so the two columns hug the
          top together; the concept's own internal scroll keeps the
          page itself from growing absurdly tall. */}
      <div className="grid items-start gap-8 lg:grid-cols-3">
        {/* Concept viewer — 2 cols on lg+, full on mobile */}
        <section className="flex flex-col gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <div className="flex items-baseline gap-x-3 gap-y-1">
              <Subheading>Huidige concept</Subheading>
              {currentVersion ? (
                <span className="text-xs text-slate-500">
                  {currentVersion.label ? `${currentVersion.label} · ` : ""}
                  versie {versions.length} ·{" "}
                  {formatRelative(currentVersion.createdAt)}
                </span>
              ) : null}
            </div>
            {/* Bewerk-CTA: the primary "I just want to edit" path.
                Renders as a direct Link when a chat already exists
                (fast), or a tiny form when we need to create one
                first. Both end up at /chat/[id]?focus=doc — ChatShell
                mounts with chat pane collapsed and doc pane wide. */}
            {editHref ? (
              <Link
                href={editHref}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
              >
                <PencilSquareIcon aria-hidden="true" className="size-3.5" />
                Bewerk concept
              </Link>
            ) : (
              <form action={editPortfolio}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
                >
                  <PencilSquareIcon aria-hidden="true" className="size-3.5" />
                  Bewerk concept
                </button>
              </form>
            )}
          </div>

          {currentVersion && currentVersion.content.trim() ? (
            <div className="relative overflow-hidden rounded-xl border border-zinc-200 bg-white">
              {/* Scrollable container. max-h-[60vh] is a "long enough
                  to read, short enough to stay with the page"
                  compromise — deep-dive editing happens in the chat
                  page's doc pane. overscroll-contain prevents
                  scroll-chaining into the parent page. */}
              <div className="max-h-[60vh] overflow-y-auto overscroll-contain p-6">
                <SimpleMarkdown text={currentVersion.content} />
              </div>
              {/* Soft gradient fade — visual hint that there's more
                  below when the content overflows. Zero-cost when
                  content is short (blends into the white background). */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
              <DocumentTextIcon className="size-8 text-zinc-400" />
              <Text className="text-zinc-600">
                Nog geen inhoud. Start een sessie om een eerste concept uit
                te werken.
              </Text>
            </div>
          )}
        </section>

        {/* Sessies — 1 col on lg+ (right rail), full on mobile.
            At the ~400px width the right rail gets on typical
            desktops, SessionRow rows truncate gracefully — the
            sessie title is usually short anyway ("Leercoach 5 — Hele
            profiel") so it still fits. */}
        <aside className="flex flex-col gap-3 lg:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <Subheading>
              Sessies {chats.length > 0 ? `(${chats.length})` : ""}
            </Subheading>
            <form action={createChat}>
              <Button type="submit" color="branding-orange">
                <PlusIcon data-slot="icon" />
                Nieuwe sessie
              </Button>
            </form>
          </div>

          {/* "Open laatste sessie →" used to live here. Now redundant
              because the concept card above carries the "Bewerk"
              affordance — same destination, clearer intent. The
              Sessies panel stays focused on CONVERSATIONS. */}

          {chats.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
              <ChatBubbleLeftRightIcon className="size-8 text-zinc-400" />
              <Text className="text-zinc-600">
                Nog geen sessies gekoppeld. Klik op &ldquo;Nieuwe sessie&rdquo;
                om te beginnen.
              </Text>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {chats.map((chat) => (
                <li key={chat.chatId}>
                  <SessionRow
                    handle={handle}
                    chatId={chat.chatId}
                    title={chat.title || headerTitle}
                    subtitle={formatRelative(chat.updatedAt)}
                  />
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>
    </div>
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
      return "Eén kerntaak";
    case "kerntaken":
      return `${scope.kerntaakCodes.length} kerntaken`;
  }
}

function richtingLabel(r: "instructeur" | "leercoach" | "pvb_beoordelaar"): string {
  switch (r) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB-beoordelaar";
  }
}

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("nl-NL", {
  numeric: "auto",
});
const ABSOLUTE_DATE_FORMAT = new Intl.DateTimeFormat("nl-NL", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((then - Date.now()) / 1000);
  const absSec = Math.abs(diffSec);
  if (absSec < 60) return RELATIVE_TIME_FORMAT.format(diffSec, "second");
  const diffMin = Math.round(diffSec / 60);
  if (Math.abs(diffMin) < 60)
    return RELATIVE_TIME_FORMAT.format(diffMin, "minute");
  const diffHour = Math.round(diffMin / 60);
  if (Math.abs(diffHour) < 24)
    return RELATIVE_TIME_FORMAT.format(diffHour, "hour");
  const diffDay = Math.round(diffHour / 24);
  if (Math.abs(diffDay) < 30)
    return RELATIVE_TIME_FORMAT.format(diffDay, "day");
  return ABSOLUTE_DATE_FORMAT.format(new Date(iso));
}
