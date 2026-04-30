"use client";

import { createContext } from "react";
import type {
  GroupDecision,
  PreviewModel,
  RoleSelection,
  RowDecision,
} from "./types";

// React 19 Context for the bulk-import preview. Consumers read it via
// `use(BulkImportPreviewContext)` (no `useContext`, no `forwardRef` —
// Catalyst is on React 19.2.4 across the project).
//
// Shape follows the gstack composition-patterns convention: state,
// actions, meta. The provider is the only place that knows how state
// is implemented (useReducer here, but consumers don't care).

export type BulkImportPreviewContextValue = {
  state: {
    preview: PreviewModel;
    decisions: ReadonlyMap<number, RowDecision>;
    groupDecisions: ReadonlyMap<string, GroupDecision>;
  };
  actions: {
    setRowDecision: (rowIndex: number, decision: RowDecision) => void;
    setGroupDecision: (groupKey: string, decision: GroupDecision) => void;
    reset: () => void;
  };
  meta: {
    locationId: string;
    targetCohortId?: string;
    roles: RoleSelection;
    canSubmit: boolean;
    blockerCount: number;
    blockers: BlockerSummary;
  };
};

export type BlockerSummary = {
  unresolvedCrossRowGroups: number;
  unresolvedAmbiguousMatches: number;
  parseErrors: number;
  total: number;
};

export const BulkImportPreviewContext =
  createContext<BulkImportPreviewContextValue | null>(null);

// Helper for consumers — narrows the value to non-null. Throws a clear
// error when used outside a provider so component-level mistakes surface
// at hot-reload time, not as a confusing null deref.
export function assertPreviewContext(
  ctx: BulkImportPreviewContextValue | null,
): BulkImportPreviewContextValue {
  if (!ctx) {
    throw new Error(
      "BulkImportPreview primitives must render inside <BulkImportPreviewProvider>",
    );
  }
  return ctx;
}

// Stable key derivation for a cross-row group — the provider, the row
// variants, and the resolver all need to agree on this. Sorted rowIndices
// joined with "-" gives a deterministic ID that survives preview refreshes.
export function deriveGroupKey(rowIndices: number[]): string {
  return [...rowIndices].sort((a, b) => a - b).join("-");
}
