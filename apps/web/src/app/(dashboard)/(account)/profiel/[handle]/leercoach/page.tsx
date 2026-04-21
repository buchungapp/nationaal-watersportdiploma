import { Leercoach } from "@nawadi/core";
import {
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { requireInstructorPerson } from "../_lib/require-instructor-person";
import { requireLeercoachEnabled } from "./_lib/require-leercoach-enabled";
import { createQAChatAction } from "./actions";
import { PortfolioCard } from "./_components/PortfolioCard";
import { SessionRow } from "./_components/SessionRow";

export const metadata: Metadata = {
  title: "Leercoach",
  robots: { index: false, follow: false },
};

// Landing for /profiel/[handle]/leercoach — portfolios up top (the
// persistent work product), Q&A chats below (ephemeral exploration).
// Role-gated via requireInstructorPerson; data is user-scoped so a
// user with multiple person rows sees one shared history across them.
export default async function LeercoachLandingPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  await requireLeercoachEnabled();
  const { user } = await requireInstructorPerson(handle);

  const [portfolios, qaChats] = await Promise.all([
    Leercoach.Portfolio.listByUserId({
      userId: user.authUserId,
      limit: 50,
    }),
    Leercoach.Chat.listQAChatsByUserId({
      userId: user.authUserId,
      limit: 50,
    }),
  ]);

  const createQAChat = createQAChatAction.bind(null, { handle });

  return (
    <div className="flex flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <TextLink href={`/profiel/${handle}`} className="text-sm">
          ← Terug naar profiel
        </TextLink>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Heading>Jouw leercoach</Heading>
          <Badge color="amber">Experimenteel</Badge>
        </div>
        <Text className="max-w-prose">
          Stel vragen over de KSS, diplomalijn, of werk aan een
          PvB-portfolio. Je leercoach is er voor beide — losse vragen én
          het opbouwen van een volledig portfolio. Eerder werk kun je{" "}
          <TextLink href={`/profiel/${handle}/portfolios`}>hier</TextLink>{" "}
          uploaden.
        </Text>
      </div>

      {/* Primary CTAs — one row, both actions equally visible */}
      <div className="flex flex-wrap items-center gap-2">
        <form action={createQAChat}>
          <Button type="submit" color="branding-orange">
            <ChatBubbleLeftRightIcon data-slot="icon" />
            Stel een vraag
          </Button>
        </form>
        <Button
          href={`/profiel/${handle}/leercoach/portfolio/nieuw`}
          outline
        >
          <PlusIcon data-slot="icon" />
          Nieuw portfolio
        </Button>
      </div>

      {/* Portfolio-concepten */}
      <section className="flex flex-col gap-3">
        <Subheading>Jouw portfolio-concepten</Subheading>
        {portfolios.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <DocumentTextIcon className="size-8 text-zinc-400" />
            <div className="flex flex-col gap-1">
              <Text className="font-semibold text-zinc-900">
                Nog geen portfolio-concept.
              </Text>
              <Text className="text-zinc-600">
                Start een portfolio-sessie om stap voor stap naar een
                indienbare versie toe te werken.
              </Text>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {portfolios.map((p) => (
              <PortfolioCard
                key={p.portfolioId}
                handle={handle}
                portfolioId={p.portfolioId}
                title={p.title}
                scope={p.scope}
                instructieGroepTitle={p.instructieGroepTitle}
                chatCount={p.chatCount}
                updatedAt={p.updatedAt}
                hasDraft={p.currentVersionId !== null}
              />
            ))}
          </div>
        )}
      </section>

      {/* Vraag-sessies */}
      <section className="flex flex-col gap-3">
        <Subheading>Vragen & verkenning</Subheading>
        {qaChats.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <ChatBubbleLeftRightIcon className="size-8 text-zinc-400" />
            <div className="flex flex-col gap-1">
              <Text className="font-semibold text-zinc-900">
                Nog geen vragen gesteld.
              </Text>
              <Text className="text-zinc-600">
                Klik op &ldquo;Stel een vraag&rdquo; om te beginnen — ideaal
                voor losse KSS-vragen of om te verkennen wat een niveau
                inhoudt.
              </Text>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {qaChats.map((chat) => (
              <li key={chat.chatId}>
                <SessionRow
                  handle={handle}
                  chatId={chat.chatId}
                  title={chat.title || "Vraag-sessie"}
                  subtitle={formatRelative(chat.updatedAt)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
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
