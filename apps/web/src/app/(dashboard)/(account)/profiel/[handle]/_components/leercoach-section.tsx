import { Leercoach } from "@nawadi/core";
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
} from "@heroicons/react/20/solid";
import { Suspense } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import {
  gridContainer,
  GridListItem,
} from "~/app/(dashboard)/_components/grid-list-v2";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { Link } from "~/app/(dashboard)/_components/link";
import {
  StackedLayoutCardDisclosure,
  StackedLayoutCardDisclosureChevron,
} from "~/app/(dashboard)/_components/stacked-layout";
import { Text, TextLink } from "~/app/(dashboard)/_components/text";
import { getUserOrThrow } from "~/lib/nwd";
import { ScrollableGridList } from "./scrollable-grid-list";

// Entry-point section for the leercoach feature on an instructor's
// /profiel/[handle] dashboard. Matches the visual pattern of
// Locations + PvbOverview (StackedLayoutCardDisclosure shell +
// Subheading header + preview list + primary CTA).
//
// Only rendered for persons that pass the instructor-ish role gate
// (parent page owns that check); this component assumes visibility
// already implies access.
export function LeercoachSection({ handle }: { handle: string }) {
  return (
    <StackedLayoutCardDisclosure
      defaultOpen
      className={gridContainer}
      header={
        <>
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-x-2">
              <Subheading>Leercoach</Subheading>
              <Badge color="amber">Experimenteel</Badge>
            </div>
            <StackedLayoutCardDisclosureChevron />
          </div>
          <Text>
            Je digitale leercoach. Stel vragen, bespreek werkprocessen, en
            bouw je PvB-portfolio stap voor stap op.
          </Text>
        </>
      }
    >
      <div className="mt-2 flex flex-col gap-3">
        <Suspense fallback={<RecentSessionsSkeleton />}>
          <RecentSessions handle={handle} />
        </Suspense>
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              href={`/profiel/${handle}/leercoach`}
              color="branding-orange"
            >
              <ChatBubbleLeftRightIcon data-slot="icon" />
              Open leercoach
            </Button>
            <Button href={`/profiel/${handle}/leercoach/new`} outline>
              <PlusIcon data-slot="icon" />
              Nieuwe sessie
            </Button>
          </div>
          <Text>
            <TextLink href={`/profiel/${handle}/portfolios`}>
              Eerdere portfolio’s
            </TextLink>
          </Text>
        </div>
      </div>
    </StackedLayoutCardDisclosure>
  );
}

// ---- Recent sessions preview ----

async function RecentSessions({ handle }: { handle: string }) {
  const user = await getUserOrThrow();
  const chats = await Leercoach.Chat.listByUserId({
    userId: user.authUserId,
    limit: 3,
  });

  if (chats.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4">
        <Text>
          Nog geen sessies. Start er één om te beginnen aan je portfolio.
        </Text>
      </div>
    );
  }

  return (
    <ScrollableGridList>
      {chats.map((chat) => (
        <GridListItem
          key={chat.chatId}
          className="bg-white px-2 lg:px-4 duration-200 lg:border-zinc-200/80"
        >
          <Link
            href={`/profiel/${handle}/leercoach/chat/${chat.chatId}`}
            className="flex items-center gap-2.5 lg:gap-4 group"
          >
            <ChatBubbleLeftRightIcon
              aria-hidden="true"
              className="size-5 text-zinc-400 group-hover:text-branding-dark transition-colors"
            />
            <div className="flex flex-col min-w-0 flex-1">
              <Text className="font-semibold text-zinc-800 group-hover:text-branding-dark transition-colors truncate">
                {chat.title || scopeLabel(chat.scope)}
              </Text>
              <Text className="text-xs text-zinc-500">
                {formatRelative(chat.updatedAt)}
              </Text>
            </div>
          </Link>
        </GridListItem>
      ))}
    </ScrollableGridList>
  );
}

function RecentSessionsSkeleton() {
  return (
    <ScrollableGridList>
      {[1, 2].map((i) => (
        <GridListItem key={i} className="bg-white px-2 lg:px-4">
          <div className="flex items-center gap-2.5 lg:gap-4">
            <div
              aria-hidden="true"
              className="size-5 bg-zinc-200 rounded animate-pulse"
            />
            <div className="flex flex-col flex-1 gap-1">
              <div className="h-4 bg-zinc-200 rounded animate-pulse w-48" />
              <div className="h-3 bg-zinc-100 rounded animate-pulse w-24" />
            </div>
          </div>
        </GridListItem>
      ))}
    </ScrollableGridList>
  );
}

// Defensive fallback when chat.title is empty (DB column is NOT NULL
// DEFAULT '' — buildChatTitle populates it for every new chat). The
// stored scope carries only rang-as-string codes; rang is ordering,
// not display, so we don't risk rendering a wrong dotted code here —
// we show the scope shape without a number.
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

// Relative-time formatter in Dutch. Uses Intl.RelativeTimeFormat for the
// localised labels (Intl knows "zojuist", "2 minuten geleden", etc.); falls
// back to a localised absolute date for anything older than ~30 days so the
// preview doesn't degrade to "4 weken geleden" for very stale chats.
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
