import Link from "next/link";
import { DocumentTextIcon } from "@heroicons/react/20/solid";

// Mirrors LeercoachPortfolioScope from packages/core/src/models/
// leercoach/portfolio.ts — kept inline here (rather than imported as
// a type) because the core package doesn't re-export the type through
// its namespaced Portfolio namespace, and re-exporting a single type
// just for this card would widen the core's public surface.
type PortfolioScope =
  | { type: "full_profiel" }
  | { type: "kerntaak"; kerntaakCode: string }
  | { type: "kerntaken"; kerntaakCodes: string[] };

type Props = {
  handle: string;
  portfolioId: string;
  title: string;
  scope: PortfolioScope;
  /**
   * Non-null for richting=instructeur portfolios. Joined at query
   * time by Portfolio.listByUserId so the card can render
   * "Instructeur 5 — Jeugdzeilen" without a second fetch.
   */
  instructieGroepTitle: string | null;
  chatCount: number;
  updatedAt: string;
  /** True when the portfolio has at least one saved version. */
  hasDraft: boolean;
};

// Card tile for a single portfolio on the leercoach index page. The
// whole card is a link to the portfolio detail page — per-chat actions
// (open latest, start new chat) live one level deeper so this tile
// stays visually calm. Click target is the portfolio itself, not any
// one of its chats.
export function PortfolioCard({
  handle,
  portfolioId,
  title,
  scope,
  instructieGroepTitle,
  chatCount,
  updatedAt,
  hasDraft,
}: Props) {
  const scopeText = scopeLabel(scope);
  const fallbackTitle = scopeText;
  const displayTitle = title.trim() || fallbackTitle;
  // Sub-label: scope + instructiegroep on one line when both apply,
  // separated by a thin middle-dot. Keeps the card visually calm at
  // one sub-line even for richting=instructeur portfolios.
  const subLabel = instructieGroepTitle
    ? `${scopeText} · ${instructieGroepTitle}`
    : scopeText;
  return (
    <Link
      href={`/profiel/${handle}/leercoach/portfolio/${portfolioId}`}
      className="group flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:border-branding-light/40 hover:bg-branding-light/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-semibold text-slate-900 group-hover:text-branding-dark">
            {displayTitle}
          </span>
          <span className="text-xs text-slate-500">{subLabel}</span>
        </div>
        <DocumentTextIcon
          aria-hidden="true"
          className="size-5 shrink-0 text-slate-400 group-hover:text-branding-dark"
        />
      </div>

      <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
        <span>
          {chatCount === 0
            ? "Nog geen sessies"
            : chatCount === 1
              ? "1 sessie"
              : `${chatCount} sessies`}
          {hasDraft ? " · draft" : ""}
        </span>
        <span>{formatRelative(updatedAt)}</span>
      </div>
    </Link>
  );
}

// Shared scope → Dutch label helper. Kept local to the card instead of
// threading through a shared util because the three call sites (index
// page, sidebar preview, chat toolbar) each want slightly different
// framing ("Vraag-sessie" fallback for the index / sidebar, no
// fallback inside the chat page where scope can be trusted non-null).
function scopeLabel(scope: PortfolioScope): string {
  switch (scope.type) {
    case "full_profiel":
      return "Hele profiel";
    case "kerntaak":
      return "Eén kerntaak";
    case "kerntaken":
      return `${scope.kerntaakCodes.length} kerntaken`;
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
