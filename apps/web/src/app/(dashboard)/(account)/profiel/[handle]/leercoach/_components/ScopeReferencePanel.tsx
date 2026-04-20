"use client";

import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ChevronRightIcon, XMarkIcon } from "@heroicons/react/20/solid";
import {
  parseKerntaakTitel,
  parseWerkprocesTitel,
} from "../../_lib/format-kerntaak";
import type { LeercoachRubric, LeercoachWerkproces } from "../_lib/rubric";

// Right-side drawer reference for the chat's rubric. Opens via the
// "Rubriek" button in the chat header; closes on ✕, backdrop click, or
// Esc (Headless UI default behaviour on Dialog).
//
// The content is the same rubric that seeds the LLM's system prompt,
// just presented for humans: grouped by kerntaak, with each werkproces
// showing its resultaat + numbered criteria. When the model mentions
// "Werkproces 5.3.1" mid-conversation the kandidaat can crack this
// open and see what 5.3.1 actually is without leaving the chat.

type Props = {
  open: boolean;
  onClose: () => void;
  rubric: LeercoachRubric;
  /** Werkprocessen already filtered to the chat's scope. */
  scopedWerkprocessen: LeercoachWerkproces[];
};

function richtingLabel(r: LeercoachRubric["richting"]): string {
  if (r === "instructeur") return "Instructeur";
  if (r === "leercoach") return "Leercoach";
  return "PvB-beoordelaar";
}

// Group werkprocessen by kerntaakCode while preserving encounter order.
// The ordering is already niveau → kerntaak → werkproces because the
// rubric loader returns them sorted by `rang`; a Map preserves
// insertion order so we get the same grouping without a second sort.
type KerntaakGroup = {
  kerntaakCode: string;
  kerntaakTitel: string;
  werkprocessen: LeercoachWerkproces[];
};

function groupByKerntaak(
  werkprocessen: LeercoachWerkproces[],
): KerntaakGroup[] {
  const byCode = new Map<string, KerntaakGroup>();
  for (const wp of werkprocessen) {
    let group = byCode.get(wp.kerntaakCode);
    if (!group) {
      group = {
        kerntaakCode: wp.kerntaakCode,
        kerntaakTitel: wp.kerntaakTitel,
        werkprocessen: [],
      };
      byCode.set(wp.kerntaakCode, group);
    }
    group.werkprocessen.push(wp);
  }
  return Array.from(byCode.values());
}

export function ScopeReferencePanel({
  open,
  onClose,
  rubric,
  scopedWerkprocessen,
}: Props) {
  const groups = groupByKerntaak(scopedWerkprocessen);
  // Single-kerntaak scopes open the group by default (nothing else to
  // scan); multi-kerntaak scopes start collapsed so the kandidaat can
  // eyeball the list of titles and expand the relevant one.
  const singleGroup = groups.length === 1;

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-slate-900/30 transition duration-200 ease-out data-closed:opacity-0"
      />
      <div className="fixed inset-0 flex justify-end">
        {/* Width: `w-full` on mobile (where max-w-2xl exceeds the
            viewport) so the panel behaves as a full-screen drawer,
            capping at ~672px on larger viewports so criteria
            descriptions have breathing room without eating the
            whole screen. */}
        <DialogPanel
          transition
          className="flex w-full max-w-2xl flex-col bg-white shadow-xl transition duration-300 ease-out data-closed:translate-x-full"
        >
          <header className="flex items-start justify-between gap-3 border-b border-zinc-200 p-4">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-lg font-semibold text-slate-900">
                Rubriek
              </DialogTitle>
              <p className="text-sm text-slate-600">
                {rubric.profielTitel} ·{" "}
                {richtingLabel(rubric.richting)} niveau {rubric.niveauRang}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Sluiten"
              // `p-2` gives a 36×36px tap target — closer to mobile
              // HIG minimums than `p-1` (28×28px) would be.
              className="rounded-md p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              <XMarkIcon className="size-5" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain p-4">
            {groups.length === 0 ? (
              <p className="text-sm text-slate-600">
                Geen werkprocessen in scope.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {groups.map((group) => (
                  <KerntaakGroupBlock
                    key={group.kerntaakCode}
                    group={group}
                    defaultOpen={singleGroup}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}

function KerntaakGroupBlock({
  group,
  defaultOpen,
}: {
  group: KerntaakGroup;
  defaultOpen: boolean;
}) {
  // kerntaakTitel on the rubric row is the raw DB titel ("PvB 5.3 -
  // Adviseert…"). Parse the dotted display code from it; fall back
  // to the raw rang string if the titel doesn't match the convention
  // — rang is ordering, not display, per NWD domain.
  const { code: parsedCode, label } = parseKerntaakTitel(group.kerntaakTitel);
  const displayCode = parsedCode ?? group.kerntaakCode;
  // A single werkproces inside a kerntaak → open it by default;
  // multiple → keep them collapsed so the kandidaat can scan the
  // werkproces titles before diving into any one's criteria wall.
  const singleWerkproces = group.werkprocessen.length === 1;

  return (
    <details
      open={defaultOpen}
      className="group/kerntaak rounded-lg border border-zinc-200 bg-white"
    >
      <summary className="flex cursor-pointer list-none items-start gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        {/* Chevron rotates on open via the `group-open/kerntaak`
            Tailwind variant — driven purely by the <details open>
            attribute, no JS state. Named group (`/kerntaak`) so it
            doesn't collide with the werkproces-level chevron below. */}
        <ChevronRightIcon
          aria-hidden="true"
          className="mt-0.5 size-3.5 shrink-0 text-slate-400 transition-transform duration-150 group-open/kerntaak:rotate-90"
        />
        {/* Plain inline text on the left — NOT a nested flex. A nested
            flex was shrinking under the count column's pressure and
            wrapping "Kerntaak 5.3" across two lines. Natural text
            flow + `whitespace-nowrap` on the code keeps the label
            atomic and lets the description wrap cleanly. */}
        <span className="min-w-0 flex-1">
          <span className="whitespace-nowrap">Kerntaak {displayCode}</span>
          <span className="font-normal text-slate-600"> — {label}</span>
        </span>
        <span className="shrink-0 text-xs font-normal text-slate-400">
          {group.werkprocessen.length} werkproces
          {group.werkprocessen.length === 1 ? "" : "sen"}
        </span>
      </summary>
      {/* Werkprocessen render as plain rows inside the kerntaak card
          — no nested borders/backgrounds. `divide-y` gives a
          one-pixel hairline between rows so the list still reads as
          separable items without the visual weight of stacked
          cards. */}
      <div className="divide-y divide-zinc-100 border-t border-zinc-200">
        {group.werkprocessen.map((wp) => (
          <WerkprocesBlock
            key={wp.id}
            werkproces={wp}
            kerntaakDisplayCode={displayCode}
            defaultOpen={singleWerkproces}
          />
        ))}
      </div>
    </details>
  );
}

function WerkprocesBlock({
  werkproces,
  kerntaakDisplayCode,
  defaultOpen,
}: {
  werkproces: LeercoachWerkproces;
  kerntaakDisplayCode: string;
  defaultOpen: boolean;
}) {
  // Werkproces display code is "{niveau.kerntaak}.{werkprocesRang}",
  // mirroring how the LLM refers to them in conversation. We prefer
  // parsing it from the DB titel (which carries the same code as a
  // prefix) because that ensures the label we render matches what
  // the titel string ACTUALLY says — falls back to the rang-derived
  // computation when the prefix isn't recognisable.
  const parsed = parseWerkprocesTitel(werkproces.titel);
  const displayCode =
    parsed.code ?? `${kerntaakDisplayCode}.${werkproces.rang}`;
  const cleanedLabel = parsed.label;

  return (
    <details open={defaultOpen} className="group/werkproces">
      {/* Plain row, no card chrome — nested bordered cards were
          making the drawer feel heavy. Hairline divider between
          rows comes from the parent's `divide-y`. */}
      <summary className="flex cursor-pointer list-none items-baseline gap-2 px-3 py-2 text-sm transition-colors hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <ChevronRightIcon
          aria-hidden="true"
          className="size-3 shrink-0 translate-y-[2px] text-slate-400 transition-transform duration-150 group-open/werkproces:rotate-90"
        />
        <span className="min-w-0 flex-1">
          <span className="whitespace-nowrap tabular-nums text-slate-500">
            {displayCode}
          </span>{" "}
          <span className="font-medium text-slate-900">{cleanedLabel}</span>
        </span>
        <span className="shrink-0 text-xs text-slate-400">
          {werkproces.criteria.length} criteri
          {werkproces.criteria.length === 1 ? "um" : "a"}
        </span>
      </summary>
      <div className="flex flex-col gap-2 bg-slate-50/60 px-3 py-3 pl-8">
        {werkproces.resultaat ? (
          <p className="text-xs leading-relaxed text-slate-600">
            <span className="font-semibold text-slate-700">Resultaat: </span>
            {werkproces.resultaat}
          </p>
        ) : null}
        {werkproces.criteria.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-semibold text-slate-500">
              Beoordelingscriteria
            </p>
            {/* Title + description stack vertically inside each item
                so the description always starts at the same indent
                (under the list number), which makes the list
                scannable. Previously we joined them with ": " inline
                — that produced an awkward ".:" sequence (title ends
                in a period, then our separator), and description
                start-points drifted with title length. Gap-3 between
                items keeps them visually separated now that each
                row is taller. */}
            {/* The <li> stays as default `display: list-item` so the
                decimal marker actually renders — setting flex/grid
                on a list item drops its marker. Inner wrapper is a
                flex-col so the title and description stack vertically
                while the `1.` / `2.` / … markers still appear. */}
            <ol className="list-outside list-decimal space-y-3 pl-5 text-xs leading-relaxed text-slate-700">
              {werkproces.criteria.map((c) => (
                <li key={c.id}>
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-900">
                      {c.title}
                    </span>
                    {c.omschrijving ? (
                      <span className="block text-justify text-slate-600">
                        {c.omschrijving}
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </div>
    </details>
  );
}
