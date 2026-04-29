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

// Reducer owns ONLY operator decisions. The preview itself is a prop on
// the provider — it can change between renders (race-recovery refresh from
// the server) and we read the latest prop straight through, deriving the
// effective decision maps from prop+raw-state during render. No useEffect
// to sync, per the React docs' "You Might Not Need an Effect" guidance.
type State = {
  decisions: Map<number, RowDecision>;
  groupDecisions: Map<string, GroupDecision>;
};

type Action =
  | {
      type: "set_row";
      rowIndex: number;
      decision: RowDecision;
    }
  | {
      type: "set_group";
      groupKey: string;
      decision: GroupDecision;
      // Caller passes the current preview so the reducer can lower a
      // group decision to its per-row decisions atomically.
      preview: PreviewModel;
    }
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
      const group = action.preview.matches.crossRowGroups.find(
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
      return { groupDecisions, decisions: rowDecisions };
    }
    case "reset":
      return {
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
  const [rawState, dispatch] = useReducer(reducer, {
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
      dispatch({
        type: "set_group",
        groupKey,
        decision,
        preview: initialPreview,
      }),
    [initialPreview],
  );

  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  // Garbage-collect decisions that no longer apply to the current preview,
  // then merge in auto-defaults for rows the operator hasn't touched.
  // Calculated during render — the parent can swap previewModel after a
  // race-detected refresh and consumers see a consistent view in one pass,
  // no useEffect needed (per the React docs' "You Might Not Need an
  // Effect" — synchronizing state with props, AND filling in default
  // state, both belong in render rather than in mount-time Effects).
  //
  // Defaults: no-match → create_new; already-in-cohort → skip(cohort);
  // single strong-match → use_existing(top candidate); parse-error →
  // skip(parse_error). Operator's explicit choice always wins.
  const filtered = useMemo(() => {
    const validRowIndices = new Set(
      initialPreview.parsedRows.map((r) => r.rowIndex),
    );
    const decisions = new Map<number, RowDecision>();
    for (const [rowIndex, decision] of rawState.decisions) {
      if (validRowIndices.has(rowIndex)) decisions.set(rowIndex, decision);
    }
    const validGroupKeys = new Set(
      initialPreview.matches.crossRowGroups.map((g) =>
        deriveGroupKey(g.rowIndices),
      ),
    );
    const groupDecisions = new Map<string, GroupDecision>();
    for (const [key, dec] of rawState.groupDecisions) {
      if (validGroupKeys.has(key)) groupDecisions.set(key, dec);
    }

    // Auto-defaults for rows without an explicit operator decision.
    for (const row of initialPreview.parsedRows) {
      if (decisions.has(row.rowIndex)) continue;
      const cls = classifyRow(row.rowIndex, initialPreview, groupDecisions);
      const def = computeDefaultDecision(cls);
      if (def) decisions.set(row.rowIndex, def);
    }
    // Parse-error rows live in parseErrors, not parsedRows.
    for (const pe of initialPreview.parseErrors) {
      if (decisions.has(pe.rowIndex)) continue;
      decisions.set(pe.rowIndex, { kind: "skip", reason: "parse_error" });
    }

    return { decisions, groupDecisions };
  }, [initialPreview, rawState]);

  // Derived meta: blocker counts, canSubmit boolean. Computed here once
  // per state change so consumers (the sticky footer chip, the disabled
  // submit button) read primitives, not subscribe to the whole map.
  const meta = useMemo(() => {
    const blockers = computeBlockers(initialPreview, filtered);
    return {
      locationId,
      targetCohortId,
      roles,
      blockerCount: blockers.total,
      blockers,
      canSubmit: blockers.total === 0,
    };
  }, [initialPreview, filtered, locationId, targetCohortId, roles]);

  const value: BulkImportPreviewContextValue = useMemo(
    () => ({
      state: {
        preview: initialPreview,
        decisions: filtered.decisions,
        groupDecisions: filtered.groupDecisions,
      },
      actions: {
        setRowDecision,
        setGroupDecision,
        reset,
      },
      meta,
    }),
    [initialPreview, filtered, setRowDecision, setGroupDecision, reset, meta],
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
    // Once the operator picks AND CONFIRMS "different people", the row
    // leaves the group and behaves as an individual row. While the
    // override panel is open with un-confirmed drafts, keep rendering
    // the row inside the group card.
    const isConfirmedSplit =
      groupDecision?.kind === "different_people" && groupDecision.confirmed;
    if (!isConfirmedSplit) {
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

function computeBlockers(
  preview: PreviewModel,
  filtered: { decisions: Map<number, RowDecision>; groupDecisions: Map<string, GroupDecision> },
): BlockerSummary {
  const { decisions, groupDecisions } = filtered;
  let unresolvedCrossRowGroups = 0;
  let unresolvedAmbiguousMatches = 0;

  // Cross-row groups: blocker until operator confirms either same_person
  // or different_people for that group.
  for (const group of preview.matches.crossRowGroups) {
    const key = deriveGroupKey(group.rowIndices);
    const dec = groupDecisions.get(key);
    if (!dec) {
      unresolvedCrossRowGroups += 1;
      continue;
    }
    // different_people stays a blocker until the operator clicks Bevestig
    // in the override panel — auto-seeded drafts shouldn't count as solved.
    if (dec.kind === "different_people" && !dec.confirmed) {
      unresolvedCrossRowGroups += 1;
    }
  }

  // Ambiguous matches: rows that need an explicit operator decision.
  // Three cases qualify:
  //   1. ≥2 candidates above threshold (classic multi-match)
  //   2. Single perfect-match (score >= 200) — twin-guard requires
  //      explicit confirmation since exact name + DOB could be a twin.
  //   3. Single weak-match (score < STRONG_THRESHOLD) — the system isn't
  //      confident enough to preselect "use existing" but a candidate
  //      surfaced. Without explicit operator input the SingleMatchRow
  //      shows "Maak een keuze om verder te gaan" but submit was
  //      silently allowing through, dropping the row from the commit
  //      payload entirely. Bugbot caught this on PR #462.
  // Rows in a cross-row group are tracked under the cross-row blocker
  // count instead.
  for (const match of preview.matches.matchesByRow) {
    const inGroup = preview.matches.crossRowGroups.find((g) =>
      g.rowIndices.includes(match.rowIndex),
    );
    if (inGroup) continue;
    if (decisions.has(match.rowIndex)) continue;
    if (match.candidates.length >= 2) {
      unresolvedAmbiguousMatches += 1;
      continue;
    }
    const top = match.candidates[0];
    if (!top || top.isAlreadyInTargetCohort) continue;
    if (top.score >= PERFECT_THRESHOLD) {
      unresolvedAmbiguousMatches += 1;
    } else if (top.score < STRONG_THRESHOLD) {
      unresolvedAmbiguousMatches += 1;
    }
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

// Auto-default for a row based on its classification. Returns null when
// the operator must explicitly decide (multi-match, weak-match, perfect-
// match awaiting confirmation, in-cross-row-group). Pure function — used
// by the provider during render to fill in the decision map without a
// mount-time Effect.
function computeDefaultDecision(
  cls: ReturnType<typeof classifyRow>,
): RowDecision | null {
  switch (cls.status) {
    case "no-match":
      return { kind: "create_new" };
    case "already-in-cohort":
      return { kind: "skip", reason: "cohort_conflict" };
    case "strong-match":
      // Single strong match → preselect the candidate. The operator can
      // still override via the candidate radios.
      if (cls.candidates.length === 1 && cls.candidates[0]) {
        return {
          kind: "use_existing",
          personId: cls.candidates[0].personId,
        };
      }
      return null;
    case "perfect-match":
      // Twin-guard: perfect-match (score >= 200) deliberately does NOT
      // preselect. Exact name + DOB could be twins/family; the row
      // variant tells the operator to "kies expliciet".
      return null;
    case "weak-match":
    case "multi-match":
    case "in-cross-row-group":
    case "parse-error":
      return null;
  }
}
