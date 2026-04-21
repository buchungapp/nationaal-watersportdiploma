"use client";

// Shared context for the ScopeReference compound (Provider + Pane).
// Only carries `meta` — the pane's open/close state lives up in
// ChatShell alongside docPaneOpen/chatPaneOpen so the three pane
// toggles in the toolbar are symmetric and the "at least one pane
// visible" guard can see all three at once.

import { createContext, use } from "react";
import type { LeercoachRubric, LeercoachWerkproces } from "../_lib/rubric";

export type ScopeReferenceMeta = {
  rubric: LeercoachRubric;
  /** Werkprocessen already filtered server-side to the chat's scope. */
  scopedWerkprocessen: LeercoachWerkproces[];
  /** Chat id used to POST the synthesis endpoint. */
  chatId: string;
};

export type ScopeReferenceContextValue = {
  meta: ScopeReferenceMeta;
};

export const ScopeReferenceContext =
  createContext<ScopeReferenceContextValue | null>(null);

export function useScopeReferenceContext(): ScopeReferenceContextValue {
  const ctx = use(ScopeReferenceContext);
  if (!ctx) {
    throw new Error(
      "ScopeReference pieces must be used inside <ScopeReference.Provider>.",
    );
  }
  return ctx;
}
