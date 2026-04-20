"use client";

import { BookOpenIcon } from "@heroicons/react/20/solid";
import { useState } from "react";
import type { LeercoachRubric, LeercoachWerkproces } from "../_lib/rubric";
import { ScopeReferencePanel } from "./ScopeReferencePanel";

// Header button that opens the rubric reference drawer. State is
// purely local (no URL sync): the drawer is ephemeral, users open it,
// glance at a criterium, close it. Deep-linking to an open drawer
// adds complexity for no real use case.

type Props = {
  rubric: LeercoachRubric;
  /** Werkprocessen filtered to the current chat's scope, server-side. */
  scopedWerkprocessen: LeercoachWerkproces[];
};

export function ScopeReferenceToggle({ rubric, scopedWerkprocessen }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
      >
        <BookOpenIcon className="size-3.5" aria-hidden="true" />
        <span>Rubriek</span>
      </button>
      <ScopeReferencePanel
        open={open}
        onClose={() => setOpen(false)}
        rubric={rubric}
        scopedWerkprocessen={scopedWerkprocessen}
      />
    </>
  );
}
