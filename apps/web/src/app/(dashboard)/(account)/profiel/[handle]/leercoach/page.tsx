import { Leercoach } from "@nawadi/core";
import { ChatBubbleLeftRightIcon, PlusIcon } from "@heroicons/react/20/solid";
import type { Metadata } from "next";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Heading, Subheading } from "~/app/(dashboard)/_components/heading";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { requireInstructorPerson } from "../_lib/require-instructor-person";
import { SessionRow } from "./_components/SessionRow";

export const metadata: Metadata = {
  title: "Leercoach",
  robots: { index: false, follow: false },
};

// Landing for /profiel/[handle]/leercoach — lists the user's chat
// sessions across all profielen and provides a "Nieuwe sessie" CTA.
// Role-gated to active instructor-ish persons via requireInstructorPerson.
//
// Chats are scoped to user.authUserId (not person.id) so they're shared
// across the primary person's sessions. The role gate in this page just
// controls who can SEE the surface; the data itself is user-global.
export default async function LeercoachLandingPage(props: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await props.params;
  const { user } = await requireInstructorPerson(handle);

  const chats = await Leercoach.Chat.listByUserId({
    userId: user.authUserId,
    limit: 50,
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <TextLink href={`/profiel/${handle}`} className="text-sm">
          ← Terug naar profiel
        </TextLink>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Heading>Jouw leercoach</Heading>
          <Badge color="amber">Experimenteel</Badge>
        </div>
        <Text className="max-w-prose">
          Je digitale leercoach helpt je aan je PvB-portfolio te werken. Zij
          schrijft niets voor je, maar stelt gerichte vragen, wijst op
          voorbeelden uit vergelijkbare portfolio's, en begeleidt je bij het
          vormen van je eigen verhaal. Je kunt eerdere portfolio's uploaden
          via{" "}
          <TextLink href={`/profiel/${handle}/portfolios`}>
            Eerdere portfolio's
          </TextLink>
          .
        </Text>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Subheading>Jouw sessies</Subheading>
          <Button
            href={`/profiel/${handle}/leercoach/new`}
            color="branding-dark"
          >
            <PlusIcon data-slot="icon" />
            Nieuwe sessie
          </Button>
        </div>

        {chats.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-zinc-200 bg-white p-8 text-center">
            <ChatBubbleLeftRightIcon className="size-8 text-zinc-400" />
            <div className="flex flex-col gap-1">
              <Text className="font-semibold text-zinc-900">
                Nog geen sessies gestart.
              </Text>
              <Text className="text-zinc-600">
                Start er één om je portfolio stap voor stap door te lopen met
                je leercoach.
              </Text>
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {chats.map((chat) => (
              <li key={chat.chatId}>
                <SessionRow
                  handle={handle}
                  chatId={chat.chatId}
                  title={chat.title || scopeLabel(chat.scope)}
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

// Fallback label for chats created before the title refactor. New
// chats land with rich titles like "Instructeur 5 — Hele profiel".
// Defensive fallback when chat.title is empty — buildChatTitle
// populates a rich title for every new chat. The stored scope only
// carries rang-as-string codes (ordering, not display), so we keep
// this fallback number-free rather than render a wrong dotted form.
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

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diffSec = Math.round((Date.now() - then) / 1000);
  if (diffSec < 60) return "net gewijzigd";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min geleden`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} uur geleden`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 30) return `${diffDay} dag${diffDay === 1 ? "" : "en"} geleden`;
  return new Date(iso).toLocaleDateString("nl-NL");
}
