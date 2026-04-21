"use client";

import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/20/solid";
import { Fragment, type ReactNode, useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import {
  PanesContext,
  type PanesContextValue,
  usePanesContext,
} from "./panes-context";

// Panes compound. Owns the visibility state for the three-column
// layout (Rubriek | Chat | Document) and exposes it via context so
// that toolbar toggles, the pane-split layout, and any future
// consumer can read/toggle without ChatShell threading props
// through UnifiedToolbar.
//
// Usage:
//
//   <Panes.Provider hasRubriek={...} hasDoc={...} chatId={id}>
//     <UnifiedToolbar>
//       <Panes.RubriekToggle />
//       <Panes.ChatToggle />
//       <Panes.DocToggle />
//     </UnifiedToolbar>
//
//     <Panes.Layout
//       rubriek={<ScopeReference.Pane />}
//       chat={chatBody}
//       doc={<PortfolioPane … />}
//     />
//   </Panes.Provider>

// ---- Provider ----

type ProviderProps = {
  /** True when rubric metadata is available for this chat. */
  hasRubriek: boolean;
  /** True when a portfolio is attached to this chat. */
  hasDoc: boolean;
  /** Stable per-chat id — persists resize-handle drag positions. */
  chatId: string;
  /**
   * Initial Document pane state. Callers pass `true` when a portfolio
   * exists so the doc opens alongside the chat by default; `false`
   * for legacy chats with no portfolio.
   */
  initialDocOpen: boolean;
  /**
   * Initial Chat pane state. Defaults to true. Callers pass `false`
   * when the user is landing on the chat in "edit mode" (e.g. via
   * `?focus=doc` from the portfolio detail page) — the doc pane
   * takes the full width, the chat is still one toggle away, and the
   * stream continues running behind the scenes regardless.
   */
  initialChatOpen?: boolean;
  children: ReactNode;
};

function Provider({
  hasRubriek,
  hasDoc,
  chatId,
  initialDocOpen,
  initialChatOpen = true,
  children,
}: ProviderProps) {
  // Rubriek defaults closed — it's secondary reference material, user
  // opens it when they need to scan the werkprocessen. Chat is usually
  // the hero (default-open) but callers can start it collapsed for
  // document-focused entry. Doc defaults open iff a portfolio exists.
  const [rubriekOpen, setRubriekOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(initialChatOpen);
  const [docOpen, setDocOpen] = useState(initialDocOpen);

  // Count currently-visible panes, gating on whether each pane's
  // feature is actually available (a pane can never be "visible"
  // when the feature is missing even if its flag is true).
  const visibleCount =
    (rubriekOpen && hasRubriek ? 1 : 0) +
    (chatOpen ? 1 : 0) +
    (docOpen && hasDoc ? 1 : 0);

  const value = useMemo<PanesContextValue>(
    () => ({
      state: { rubriekOpen, chatOpen, docOpen, visibleCount },
      actions: {
        // Each toggle guards the "at least one pane visible"
        // invariant locally — clicking the hide-toggle of the last
        // visible pane is a no-op (explicit hand-off: the user must
        // show another pane first). We capture `visibleCount` via
        // closure; click handlers read the render-time value, which
        // is the correct "current count".
        toggleRubriek: () => {
          setRubriekOpen((v) => (v && visibleCount <= 1 ? v : !v));
        },
        toggleChat: () => {
          setChatOpen((v) => (v && visibleCount <= 1 ? v : !v));
        },
        toggleDoc: () => {
          setDocOpen((v) => (v && visibleCount <= 1 ? v : !v));
        },
      },
      meta: { hasRubriek, hasDoc, chatId },
    }),
    [rubriekOpen, chatOpen, docOpen, visibleCount, hasRubriek, hasDoc, chatId],
  );

  return (
    <PanesContext.Provider value={value}>{children}</PanesContext.Provider>
  );
}

// ---- Toggle pieces ----
//
// Each toggle reads the Panes context directly — no props. This keeps
// the toolbar's UnifiedToolbar free of pane-specific state/callbacks
// and makes the toggle contract self-contained: if the feature is
// unavailable, the toggle renders null.

function RubriekToggle() {
  const {
    state: { rubriekOpen },
    actions: { toggleRubriek },
    meta: { hasRubriek },
  } = usePanesContext();
  if (!hasRubriek) return null;
  return (
    <PaneToggleButton
      active={rubriekOpen}
      onClick={toggleRubriek}
      icon={<BookOpenIcon className="size-3.5" aria-hidden="true" />}
      activeLabel="Rubriek verbergen"
      inactiveLabel="Rubriek tonen"
    >
      Rubriek
    </PaneToggleButton>
  );
}

function ChatToggle() {
  const {
    state: { chatOpen },
    actions: { toggleChat },
    meta: { hasRubriek, hasDoc },
  } = usePanesContext();
  // Chat toggle only makes sense when there's somewhere else to hand
  // off to — otherwise hiding chat would leave nothing on screen.
  if (!hasRubriek && !hasDoc) return null;
  return (
    <PaneToggleButton
      active={chatOpen}
      onClick={toggleChat}
      icon={<ChatBubbleLeftRightIcon className="size-3.5" aria-hidden="true" />}
      activeLabel="Chat verbergen"
      inactiveLabel="Chat tonen"
    >
      Chat
    </PaneToggleButton>
  );
}

function DocToggle() {
  const {
    state: { docOpen },
    actions: { toggleDoc },
    meta: { hasDoc },
  } = usePanesContext();
  if (!hasDoc) return null;
  return (
    <PaneToggleButton
      active={docOpen}
      onClick={toggleDoc}
      icon={<DocumentTextIcon className="size-3.5" aria-hidden="true" />}
      activeLabel="Document verbergen"
      inactiveLabel="Document tonen"
    >
      Document
    </PaneToggleButton>
  );
}

// ---- Layout ----

type VisiblePane = {
  key: "rubriek" | "chat" | "doc";
  node: ReactNode;
  defaultSize: number;
  minSize: number;
};

function Layout({
  rubriek,
  chat,
  doc,
}: {
  /** Rubriek pane contents — typically `<ScopeReference.Pane />`. */
  rubriek: ReactNode;
  /** Chat pane contents — the `AiChat.Frame` subtree. */
  chat: ReactNode;
  /** Document pane contents — typically `<PortfolioPane … />`. */
  doc: ReactNode;
}) {
  const {
    state: { rubriekOpen, chatOpen, docOpen },
    meta: { hasRubriek, hasDoc, chatId },
  } = usePanesContext();

  // Build a flat list of visible panes in left-to-right order. This
  // lets us generate the correct number of Separators (N-1 between N
  // panes) with a single map — no 2^3 switch statement.
  const panes: VisiblePane[] = [];

  if (rubriekOpen && hasRubriek) {
    panes.push({ key: "rubriek", node: rubriek, defaultSize: 26, minSize: 20 });
  }
  if (chatOpen) {
    panes.push({ key: "chat", node: chat, defaultSize: 40, minSize: 25 });
  }
  if (docOpen && hasDoc) {
    panes.push({ key: "doc", node: doc, defaultSize: 34, minSize: 25 });
  }

  // Invariant says this never happens (Provider's toggle guards block
  // closing the last pane), but render an empty flex cell defensively
  // instead of returning null so the parent's flex math stays stable.
  if (panes.length === 0) {
    return <div className="flex flex-1" />;
  }

  // Single pane → no Group, just a solo flex column. Avoids the
  // resizable-panels overhead when there's nothing to resize.
  if (panes.length === 1) {
    const only = panes[0];
    return <div className="flex flex-1 flex-col">{only?.node}</div>;
  }

  // Multiple panes → resizable Group. The Group id encodes the
  // currently-visible set so each configuration persists its own
  // split sizes: (rubriek+chat), (chat+doc), (rubriek+chat+doc)
  // each remember independently.
  const groupId = `leercoach-split-${chatId}-${panes.map((p) => p.key).join("-")}`;

  return (
    <Group
      orientation="horizontal"
      id={groupId}
      className="flex min-w-0 flex-1"
    >
      {panes.map((p, i) => (
        <Fragment key={p.key}>
          {i > 0 ? (
            <Separator className="group/resize relative flex w-1.5 shrink-0 items-stretch bg-transparent transition-colors hover:bg-slate-200 data-[dragging=true]:bg-slate-300">
              <span
                aria-hidden="true"
                // Visual 1-px divider centred in the 6-px hit area.
                // Background brightens on hover + drag for a natural
                // "grab me" cue.
                className="pointer-events-none absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200 group-hover/resize:bg-slate-400 group-data-[dragging=true]/resize:bg-slate-500"
              />
            </Separator>
          ) : null}
          <Panel
            defaultSize={p.defaultSize}
            minSize={p.minSize}
            className="flex min-w-0 flex-col"
          >
            {p.node}
          </Panel>
        </Fragment>
      ))}
    </Group>
  );
}

// ---- PaneToggleButton (internal) ----
//
// Shared trigger shape for the three pane visibility toggles.
// aria-pressed communicates the "active = currently shown" state to
// assistive tech; the title swap gives sighted users a hover hint of
// what clicking does next. Design-wise this is intentionally compact
// (size-8-ish, icon + small label) so three of them in a row don't
// overwhelm the toolbar.
//
// Lives here rather than in UnifiedToolbar because Panes is now the
// only consumer — moving it alongside the Toggle compound pieces
// keeps the visual family collocated.

function PaneToggleButton({
  active,
  onClick,
  icon,
  children,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      title={active ? activeLabel : inactiveLabel}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium shadow-sm transition-colors ${
        active
          ? "border-blue-300 bg-blue-50 text-blue-900"
          : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-900"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </button>
  );
}

// ---- Compound export ----

export const Panes = {
  Provider,
  RubriekToggle,
  ChatToggle,
  DocToggle,
  Layout,
};
