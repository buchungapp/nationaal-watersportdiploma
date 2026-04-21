"use client";

// Shared context for the Panes compound (Provider / Toggles / Layout).
// Follows the {state, actions, meta} interface from
// vercel-composition-patterns so any descendant — the toolbar's
// individual toggle buttons, the pane-split layout, or a future
// keyboard-shortcut listener — can read pane visibility and act on
// it without prop drilling through the shell.
//
// The three panes (Rubriek, Chat, Document) are independent: any
// subset can be visible, but the provider enforces a "at least one
// visible" invariant so the shell never goes blank. That invariant
// only needs to be expressed once (in the provider), which is the
// core reason to lift this state here instead of threading six
// boolean props down to the toolbar.

import { createContext, use } from "react";

export type PanesState = {
  /** True iff the Rubriek pane is currently visible. */
  rubriekOpen: boolean;
  /** True iff the Chat pane is currently visible. */
  chatOpen: boolean;
  /** True iff the Document pane is currently visible. */
  docOpen: boolean;
  /**
   * Number of panes currently visible, with the "has feature" guards
   * already applied. Consumers use this to style the shell (e.g. hide
   * the resize handles when only one pane is visible); the
   * at-least-one guard inside the actions uses it to decide whether
   * a hide-toggle should be a no-op.
   */
  visibleCount: number;
};

export type PanesActions = {
  /**
   * Flip Rubriek visibility. No-op when it would close the last
   * visible pane (explicit hand-off: open another pane first).
   */
  toggleRubriek: () => void;
  /** Flip Chat visibility. Same no-op-on-last-visible guard. */
  toggleChat: () => void;
  /** Flip Document visibility. Same no-op-on-last-visible guard. */
  toggleDoc: () => void;
};

export type PanesMeta = {
  /** Whether the chat has rubric metadata loaded — drives toggle visibility. */
  hasRubriek: boolean;
  /** Whether the chat has a portfolio attached — drives toggle visibility. */
  hasDoc: boolean;
  /**
   * Chat id — used as a persistence key for the resizable-panels
   * Group so each chat remembers its own split sizes.
   */
  chatId: string;
};

export type PanesContextValue = {
  state: PanesState;
  actions: PanesActions;
  meta: PanesMeta;
};

export const PanesContext = createContext<PanesContextValue | null>(null);

export function usePanesContext(): PanesContextValue {
  const ctx = use(PanesContext);
  if (!ctx) {
    throw new Error("Panes pieces must be used inside <Panes.Provider>.");
  }
  return ctx;
}
