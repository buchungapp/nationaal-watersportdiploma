// Shared types for the bulk-import preview UI. Mirrors the shape returned by
// the previewBulkImportAction server action — kept in a separate module so
// the provider, primitives, and row variants all import from one place.

export type ParsedPersonRow = {
  rowIndex: number;
  email: string;
  firstName: string;
  lastNamePrefix: string | null;
  lastName: string;
  dateOfBirth: Date;
  birthCity: string;
  birthCountry: string;
};

export type ParseError = {
  rowIndex: number;
  error: string;
};

export type CandidateMatch = {
  personId: string;
  score: number;
  reasons: string[];
  firstName: string;
  lastName: string | null;
  lastNamePrefix: string | null;
  dateOfBirth: string | null;
  birthCity: string | null;
  certificateCount: number;
  lastDiplomaIssuedAt: string | null;
  isAlreadyInTargetCohort: boolean;
};

export type CrossRowGroup = {
  rowIndices: number[];
  sharedCandidatePersonIds: string[];
};

export type PreviewMatches = {
  matchesByRow: { rowIndex: number; candidates: CandidateMatch[] }[];
  crossRowGroups: CrossRowGroup[];
};

// Per-row decision the operator makes. Mirrors the server-side decision
// schema in `apps/web/src/app/_actions/person/bulk-import-actions.ts`.
export type RowDecision =
  | { kind: "create_new"; shareNewPersonWithGroup?: string }
  | { kind: "use_existing"; personId: string }
  | {
      kind: "skip";
      reason:
        | "cohort_conflict"
        | "cross_row_conflict"
        | "parse_error"
        | "operator";
    };

// Group-level decision the operator makes via the cross-row resolver. The
// provider lowers this to per-row RowDecisions when building the commit
// payload.
export type GroupDecision =
  | {
      kind: "same_person";
      // null when the group is paste-only (no existing match — operator
      // will create one new shared person).
      targetPersonId: string | null;
    }
  | {
      kind: "different_people";
      // Per-row decisions inside the override panel.
      perRow: Record<number, RowDecision>;
    };

// Row status taxonomy from the design doc. Drives which row variant
// component renders and how the preview list sorts.
export type RowStatus =
  | "no-match"
  | "weak-match"
  | "strong-match"
  | "perfect-match"
  | "multi-match"
  | "already-in-cohort"
  | "parse-error"
  | "in-cross-row-group";

// Top-level preview model — what previewBulkImportAction returns and the
// provider drives off of.
export type PreviewModel = {
  previewToken: string;
  attempt: 1 | 2 | 3;
  parsedRows: ParsedPersonRow[];
  parseErrors: ParseError[];
  matches: PreviewMatches;
};

export type RoleSelection = ("student" | "instructor" | "location_admin")[];
