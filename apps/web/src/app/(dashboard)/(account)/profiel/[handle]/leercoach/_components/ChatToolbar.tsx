"use client";

import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ArrowLeftIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import type { ReactNode } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Link } from "~/app/(dashboard)/_components/link";

// Unified chat toolbar — one compact row at the top of the chat
// replacing what used to be three stacked page-header rows (back
// link, title block with badge, phase stepper with Rubriek button).
//
// Layout zones:
//   [←  Alle sessies]  [Title · badge]   [Phase slot]   [Actions slot]
//
// Response shape:
//   - lg+     : back button with label, full title, all right-side
//               actions inline.
//   - md      : back button with label shrinks (label hidden <lg),
//               phase slot may fold into the actions menu in future
//               iterations.
//   - below md: same toolbar wraps to two rows via flex-wrap.
//
// Leaves the phase control and actions pluggable as ReactNode so
// ChatShell composes the right-side pieces (PhaseDropdown,
// ScopeReference.Toggle, ⋮ ActionsMenu) without this component
// reaching into chat context itself.

type Props = {
  /** Href the "back" button routes to. */
  backHref: string;
  /**
   * Accessible label for the back button; also shown as visible text
   * at `lg` breakpoint and up. Kept shorter than a breadcrumb — we
   * want a destination, not a trail.
   */
  backLabel: string;
  /** Chat title; truncates when long. */
  title: string;
  /** Optional badge rendered beside the title (e.g. "Experimenteel"). */
  badge?: ReactNode;
  /**
   * Phase indicator/switcher — usually a PhaseDropdown. Optional so
   * consumers who don't have a phase concept just omit it.
   */
  phaseSlot?: ReactNode;
  /**
   * Right-aligned action area. Typical contents: the Rubriek toggle
   * + an ⋮ ActionsMenu with scope-change etc. Pass whatever ReactNode
   * makes sense for the consumer.
   */
  actionsSlot?: ReactNode;
};

export function ChatToolbar({
  backHref,
  backLabel,
  title,
  badge,
  phaseSlot,
  actionsSlot,
}: Props) {
  return (
    <header
      // `flex-wrap` lets the toolbar spill onto two rows on narrow
      // viewports without extra breakpoint gymnastics. `gap-x-3` +
      // `gap-y-2` keeps wrapped rows visually tidy. No own
      // background — the parent Frame card provides the chat-wide
      // white surface this toolbar rides on.
      className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-zinc-200 px-3 py-2"
    >
      <Link
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        // Icon-only below lg; icon + label at lg+. `touch-manipulation`
        // removes the 300ms tap delay mobile browsers add to plain
        // link taps — chat navigation feels snappier.
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors touch-manipulation hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        <span className="hidden lg:inline">{backLabel}</span>
      </Link>

      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
        {/* `min-w-0` + `truncate` on the heading lets the title
            collapse with ellipsis instead of pushing the actions off
            screen on narrow viewports. */}
        <h1 className="min-w-0 truncate text-base font-semibold text-slate-900 text-pretty">
          {title}
        </h1>
        {badge}
      </div>

      {phaseSlot ? <div className="shrink-0">{phaseSlot}</div> : null}
      {actionsSlot ? (
        <div className="flex shrink-0 items-center gap-1.5">{actionsSlot}</div>
      ) : null}
    </header>
  );
}

// ---- ActionsMenu ----
//
// Thin wrapper around Headless UI's Menu to provide the "⋮" affordance
// used for rarely-triggered actions in the chat toolbar (scope change
// today; could grow later). Consumers supply the MenuItem children.

export function ActionsMenu({ children }: { children: ReactNode }) {
  return (
    <Menu as="div" className="relative">
      <MenuButton
        aria-label="Meer acties"
        className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
      >
        <EllipsisHorizontalIcon aria-hidden="true" className="size-4" />
      </MenuButton>
      <MenuItems
        transition
        // Right-anchored so the menu opens below and to the left of
        // the trigger — doesn't go off-screen at the right edge.
        className="absolute right-0 top-full z-20 mt-1 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        {children}
      </MenuItems>
    </Menu>
  );
}

// ---- ActionsMenuItem ----
//
// Convenience wrapper matching the focus-styled button pattern used
// across the leercoach menus (AttachmentMenu, PhaseDropdown). Saves
// callers the Headless boilerplate.

export function ActionsMenuItem({
  onClick,
  children,
  icon,
}: {
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <MenuItem>
      {({ focus }) => (
        <button
          type="button"
          onClick={onClick}
          className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 ${
            focus ? "bg-slate-100" : ""
          }`}
        >
          {icon ? (
            <span
              aria-hidden="true"
              className="inline-flex size-4 shrink-0 items-center justify-center text-slate-400"
            >
              {icon}
            </span>
          ) : null}
          <span>{children}</span>
        </button>
      )}
    </MenuItem>
  );
}

// Re-export Badge so consumers can build `<ChatToolbar badge={...} />`
// without importing it separately.
export { Badge };
