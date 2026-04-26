"use client";

import {
  ChevronDoubleDownIcon,
  ChevronDoubleUpIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

// Client-side expand/collapse-all for the KSS <details> tree.
// Scans its next-sibling subtree for <details> elements — that's where
// KssCompetentieTree renders. No props, no context, no JS weight beyond this.
export function KssTreeControls() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [openCount, setOpenCount] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const container = wrapperRef.current?.parentElement;
    if (!container) return;

    const query = () =>
      Array.from(
        container.querySelectorAll<HTMLDetailsElement>(":scope details"),
      );

    const sync = () => {
      const all = query();
      setTotal(all.length);
      setOpenCount(all.filter((d) => d.open).length);
    };

    sync();
    const mo = new MutationObserver(sync);
    mo.observe(container, {
      subtree: true,
      attributes: true,
      attributeFilter: ["open"],
      childList: true,
    });
    return () => mo.disconnect();
  }, []);

  const setAll = (open: boolean) => {
    const container = wrapperRef.current?.parentElement;
    if (!container) return;
    container
      .querySelectorAll<HTMLDetailsElement>(":scope details")
      .forEach((d) => {
        d.open = open;
      });
  };

  const allOpen = total > 0 && openCount === total;

  // Always render the wrapper so useEffect can attach. When total=0 (SSR /
  // pre-hydrate), the wrapper is an empty 0-height div — invisible but present.
  return (
    <div
      ref={wrapperRef}
      className={
        total === 0
          ? ""
          : "not-prose flex flex-wrap items-center justify-between gap-2 pb-2"
      }
    >
      {total > 0 && (
        <>
          <p className="text-xs text-slate-500">
            {openCount} van {total} werkprocessen open
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setAll(true)}
              disabled={allOpen}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDoubleDownIcon className="size-3.5" aria-hidden="true" />
              Alles uitklappen
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              disabled={openCount === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronDoubleUpIcon className="size-3.5" aria-hidden="true" />
              Alles inklappen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
