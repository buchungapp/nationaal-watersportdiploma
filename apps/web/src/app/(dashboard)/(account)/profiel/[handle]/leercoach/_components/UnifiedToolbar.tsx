"use client";

import { Menu, MenuButton, MenuItems } from "@headlessui/react";
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  EllipsisHorizontalIcon,
} from "@heroicons/react/20/solid";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Link } from "~/app/(dashboard)/_components/link";
import { ActionsMenuItem } from "./ChatToolbar";
import { CompactMenuItem } from "./CompactionControls";
import { Panes } from "./Panes";

// Single global toolbar spanning all panes. Replaces the two stacked
// headers (chat pane toolbar + doc pane sub-header) from v1 with one
// compact row at the very top. Based on the review's P1 finding:
// the old layout consumed ~120 px of vertical chrome before any
// content rendered, title wrapped on 3 lines due to a missing
// min-w-0, and the "Portfolio / Klaar" row duplicated what the tabs
// already communicate.
//
// Layout zones (left → right):
//   [← back]  [title + badge]   [pane toggles + actions menu]
//
// The title zone flex-grows and truncates gracefully. The rightmost
// action zone collapses items into a ⋮ overflow menu at narrow
// widths so the toolbar never wraps.
//
// Pane visibility state lives in Panes.Provider (see panes-context.ts),
// so each `<Panes.*Toggle />` reads its own state from context. This
// keeps UnifiedToolbar's surface tiny — no pane booleans, no
// per-pane callbacks — matching vercel-composition-patterns'
// "avoid boolean prop proliferation" + "lift state" rules.
//
// Phase (verkennen / ordenen / concept / verfijnen) used to live as
// a dropdown in the center-right of this toolbar but was hidden in
// v3 — picking a phase as if it were a navigation target was a UX
// lie (it actually sent a scripted message the coach could refuse).
// Phase still shapes coach behaviour via the system prompt, and
// transitions surface as a compact marker in the chat (via the
// `setPhase` tool's result renderer in tool-parts.tsx) — that's
// enough signal without pretending to be a control.

type Props = {
  backHref: string;
  backLabel: string;
  title: string;
  canChangeScope: boolean;
  onOpenScopeDialog: () => void;
  /** True when the chat is a vraag-sessie — exposes the promote action. */
  canPromoteToPortfolio: boolean;
  onOpenPromoteDialog: () => void;
  chatId: string;
};

export function UnifiedToolbar({
  backHref,
  backLabel,
  title,
  canChangeScope,
  onOpenScopeDialog,
  canPromoteToPortfolio,
  onOpenPromoteDialog,
  chatId,
}: Props) {
  return (
    <header
      // Single-row top bar. Previously had `overflow-hidden` as a
      // defensive clamp against content pushing the toolbar taller,
      // but `h-12 shrink-0` already pins the height, and the
      // overflow rule was clipping the ⋮ menu's absolutely-positioned
      // MenuItems panel (which extends below the toolbar into the
      // chat canvas). `overflow-visible` lets the dropdown render
      // above the chat content — the z-20 on MenuItems + Headless
      // UI's internal portal handling do the rest.
      //
      // The background matches the doc-pane tonal choice — slightly
      // off-white — so the toolbar reads as continuous with the doc
      // surface when both are open.
      className="relative z-30 flex h-12 shrink-0 items-center gap-2 overflow-visible border-b border-slate-200 bg-white px-3"
    >
      {/* Left: back link — icon only below lg, icon + label at lg+
          (matches the pre-v2 behaviour but with a smaller footprint
          because we're no longer fighting for horizontal space). */}
      <Link
        href={backHref}
        aria-label={backLabel}
        title={backLabel}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors touch-manipulation hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeftIcon aria-hidden="true" className="size-4" />
        <span className="hidden lg:inline">{backLabel}</span>
      </Link>

      {/* Center-left: title + badge. `min-w-0` + `flex-1` lets the
          title collapse with ellipsis instead of pushing the rest
          of the toolbar off-screen. This was broken in v1 and is
          the cause of the 3-line title wrap in the review screenshot. */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h1 className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-900">
          {title}
        </h1>
        <Badge color="amber" className="hidden shrink-0 sm:inline-flex">
          Experimenteel
        </Badge>
      </div>

      {/* Right: pane toggles + ⋮ overflow menu. Left-to-right order
          mirrors the pane layout itself (Rubriek | Chat | Document).
          Each toggle reads its own visibility/availability from the
          Panes context and renders null when its feature is absent
          — no conditionals needed here. */}
      <div className="flex shrink-0 items-center gap-1.5">
        <Panes.RubriekToggle />
        <Panes.ChatToggle />
        <Panes.DocToggle />

        <Menu as="div" className="relative">
          <MenuButton
            aria-label="Meer acties"
            className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50 hover:text-slate-900"
          >
            <EllipsisHorizontalIcon aria-hidden="true" className="size-4" />
          </MenuButton>
          <MenuItems
            transition
            className="absolute right-0 top-full z-20 mt-1 w-56 origin-top-right rounded-xl border border-slate-200 bg-white p-1 text-sm shadow-lg transition duration-100 ease-out focus:outline-none data-closed:scale-95 data-closed:opacity-0"
          >
            <CompactMenuItem chatId={chatId} onClose={() => {}} />
            {canPromoteToPortfolio ? (
              <ActionsMenuItem
                icon={<DocumentTextIcon className="size-4" />}
                onClick={onOpenPromoteDialog}
              >
                Koppel aan portfolio
              </ActionsMenuItem>
            ) : null}
            {canChangeScope ? (
              <ActionsMenuItem
                icon={<Cog6ToothIcon className="size-4" />}
                onClick={onOpenScopeDialog}
              >
                Scope wijzigen
              </ActionsMenuItem>
            ) : null}
          </MenuItems>
        </Menu>
      </div>
    </header>
  );
}
