"use client";

import { useCallback, useMemo, useReducer } from "react";
import {
  type BlockerSummary,
  BulkImportPreviewContext,
  type BulkImportPreviewContextValue,
  deriveGroupKey,
} from "./context";
import type {
  CandidateMatch,
  CrossRowGroup,
  GroupDecision,
  PreviewModel,
  RoleSelection,
  RowDecision,
} from "./types";

// Score thresholds — must stay in sync with packages/core/src/models/user/
// _internal/duplicate-scoring.ts SCORE_THRESHOLDS. Hardcoded here so the UI
// doesn't need a server roundtrip to render score band styling.
const STRONG_THRESHOLD = 150;
const PERFECT_THRESHOLD = 200;

type State = {
  preview: PreviewModel;
  decisions: Map<number, RowDecision>;
  groupDecisions: Map<string, GroupDecision>;
};

type Action =
  | { type: "set_row"; rowIndex: number; decision: RowDecision }
  | { type: "set_group"; groupKey: string; decision: GroupDecision }
  | { type: "refresh"; preview: PreviewModel }
  | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "set_row": {
      const next = new Map(state.decisions);
      next.set(action.rowIndex, action.decision);
      return { ...state, decisions: next };
    }
    case "set_group": {
      const groupDecisions = new Map(state.groupDecisions);
      groupDecisions.set(action.groupKey, action.decision);
      // Lower group decision to per-row decisions so the commit payload
      // can stay row-keyed (the server contract). When the operator picks
      // "same person", every row in the group gets the same use_existing
      // (or shared create_new) decision.
      const rowDecisions = new Map(state.decisions);
      const group = state.preview.matches.crossRowGroups.find(
        (g) => deriveGroupKey(g.rowIndices) === action.groupKey,
      );
      if (group) {
        if (action.decision.kind === "same_person") {
          for (const rowIndex of group.rowIndices) {
            rowDecisions.set(
              rowIndex,
              action.decision.targetPersonId
                ? {
                    kind: "use_existing",
                    personId: action.decision.targetPersonId,
                  }
                : {
                    kind: "create_new",
                    shareNewPersonWithGroup: action.groupKey,
                  },
            );
          }
        } else {
          // different_people → per-row decisions from the override panel.
          for (const rowIndex of group.rowIndices) {
            const perRow = action.decision.perRow[rowIndex];
            if (perRow) rowDecisions.set(rowIndex, perRow);
          }
        }
      }
      return { ...state, groupDecisions, decisions: rowDecisions };
    }
    case "refresh": {
      // Keep decisions whose rowIndex still appears in the new preview.
      // Drop the rest — the rows changed, the operator's prior choice
      // may not apply.
      const validRowIndices = new Set(
        action.preview.parsedRows.map((r) => r.rowIndex),
      );
      const decisions = new Map<number, RowDecision>();
      for (const [rowIndex, decision] of state.decisions) {
        if (validRowIndices.has(rowIndex)) decisions.set(rowIndex, decision);
      }
      // Same for group decisions — re-derive group keys against new groups.
      const validGroupKeys = new Set(
        action.preview.matches.crossRowGroups.map((g) =>
          deriveGroupKey(g.rowIndices),
        ),
      );
      const groupDecisions = new Map<string, GroupDecision>();
      for (const [key, dec] of state.groupDecisions) {
        if (validGroupKeys.has(key)) groupDecisions.set(key, dec);
      }
      return { preview: action.preview, decisions, groupDecisions };
    }
    case "reset":
      return {
        preview: state.preview,
        decisions: new Map(),
        groupDecisions: new Map(),
      };
  }
}

export function BulkImportPreviewProvider({
  initialPreview,
  locationId,
  targetCohortId,
  roles,
  children,
}: {
  initialPreview: PreviewModel;
  locationId: string;
  targetCohortId?: string;
  roles: RoleSelection;
  children: React.ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    preview: initialPreview,
    decisions: new Map(),
    groupDecisions: new Map(),
  });

  const setRowDecision = useCallback(
    (rowIndex: number, decision: RowDecision) =>
      dispatch({ type: "set_row", rowIndex, decision }),
    [],
  );

  const setGroupDecision = useCallback(
    (groupKey: string, decision: GroupDecision) =>
      dispatch({ type: "set_group", groupKey, decision }),
    [],
  );

  const refreshPreview = useCallback(
    (next: PreviewModel) => dispatch({ type: "refresh", preview: next }),
    [],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  // Derived meta: blocker counts, canSubmit boolean. Computed here once
  // per state change so consumers (the sticky footer chip, the disabled
  // submit button) read primitives, not subscribe to the whole map.
  const meta = useMemo(() => {
    const blockers = computeBlockers(state);
    return {
      locationId,
      targetCohortId,
      roles,
      blockerCount: blockers.total,
      blockers,
      canSubmit: blockers.total === 0,
    };
  }, [state, locationId, targetCohortId, roles]);

  const value: BulkImportPreviewContextValue = useMemo(
    () => ({
      state: {
        preview: state.preview,
        decisions: state.decisions,
        groupDecisions: state.groupDecisions,
      },
      actions: {
        setRowDecision,
        setGroupDecision,
        refreshPreview,
        reset,
      },
      meta,
    }),
    [state, setRowDecision, setGroupDecision, refreshPreview, reset, meta],
  );

  return (
    <BulkImportPreviewContext value={value}>{children}</BulkImportPreviewContext>
  );
}

// Helpers — also used by individual row variants when they need to know
// their own status without taking a context dependency. Pure functions of
// the inputs, no React.

export function classifyRow(
  rowIndex: number,
  preview: PreviewModel,
  groupDecisions: ReadonlyMap<string, GroupDecision>,
): {
  status:
    | "no-match"
    | "weak-match"
    | "strong-match"
    | "perfect-match"
    | "multi-match"
    | "already-in-cohort"
    | "parse-error"
    | "in-cross-row-group";
  groupKey?: string;
  candidates: CandidateMatch[];
} {
  const parseError = preview.parseErrors.find((e) => e.rowIndex === rowIndex);
  if (parseError) return { status: "parse-error", candidates: [] };

  const inGroup = preview.matches.crossRowGroups.find((g) =>
    g.rowIndices.includes(rowIndex),
  );
  if (inGroup) {
    const groupKey = deriveGroupKey(inGroup.rowIndices);
    const groupDecision = groupDecisions.get(groupKey);
    // Once the operator picks "different people", the row leaves the
    // group and behaves as an individual row.
    if (groupDecision?.kind !== "different_people") {
      return {
        status: "in-cross-row-group",
        groupKey,
        candidates:
          preview.matches.matchesByRow.find((m) => m.rowIndex === rowIndex)
            ?.candidates ?? [],
      };
    }
  }

  const candidates =
    preview.matches.matchesByRow.find((m) => m.rowIndex === rowIndex)
      ?.candidates ?? [];

  if (candidates.length === 0) return { status: "no-match", candidates };
  if (candidates[0]?.isAlreadyInTargetCohort) {
    return { status: "already-in-cohort", candidates };
  }
  if (candidates.length >= 2) return { status: "multi-match", candidates };
  // Single match — band by score.
  const top = candidates[0]?.score ?? 0;
  if (top >= PERFECT_THRESHOLD) return { status: "perfect-match", candidates };
  if (top >= STRONG_THRESHOLD) return { status: "strong-match", candidates };
  return { status: "weak-match", candidates };
}

function computeBlockers(state: State): BlockerSummary {
  const { preview, decisions, groupDecisions } = state;
  let unresolvedCrossRowGroups = 0;
  let unresolvedAmbiguousMatches = 0;

  // Cross-row groups: blocker until operator confirms either same_person
  // or different_people for that group.
  for (const group of preview.matches.crossRowGroups) {
    const key = deriveGroupKey(group.rowIndices);
    if (!groupDecisions.has(key)) unresolvedCrossRowGroups += 1;
  }

  // Ambiguous matches: rows with ≥2 candidates above threshold and no
  // decision yet (and not part of a resolved cross-row group).
  for (const match of preview.matches.matchesByRow) {
    const inGroup = preview.matches.crossRowGroups.find((g) =>
      g.rowIndices.includes(match.rowIndex),
    );
    if (inGroup) continue; // tracked under cross-row blocker
    if (match.candidates.length < 2) continue;
    if (decisions.has(match.rowIndex)) continue;
    unresolvedAmbiguousMatches += 1;
  }

  const parseErrors = preview.parseErrors.length;

  // Parse errors auto-default to skip — they don't block submit. They
  // surface in the header summary as informational ("rijen die we niet
  // konden lezen — worden overgeslagen") so the operator knows what
  // happens, but the button stays enabled.
  return {
    unresolvedCrossRowGroups,
    unresolvedAmbiguousMatches,
    parseErrors,
    total: unresolvedCrossRowGroups + unresolvedAmbiguousMatches,
  };
}
