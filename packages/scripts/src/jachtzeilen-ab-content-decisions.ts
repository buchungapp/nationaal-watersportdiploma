export type CombinedLagerwalDecision =
  | "split-existing-competencies"
  | "create-combined-competency";

export type RrpDecision = "reuse-reglementen" | "create-rrp-competency";

export interface JachtzeilenAbContentDecisions {
  revision: string;
  ambiguousOvRequired: "required-inland-optional-waddenzee-and-sea" | null;
  blankVoRequired: boolean | null;
  combinedLagerwal: CombinedLagerwalDecision | null;
  rrp: RrpDecision | null;
}

/**
 * Content decisions are intentionally explicit. The import refuses to plan or
 * execute while a value is null, so editorial ambiguity cannot silently become
 * production data.
 */
export const JACHTZEILEN_AB_CONTENT_DECISIONS = {
  revision: "2601",
  ambiguousOvRequired: "required-inland-optional-waddenzee-and-sea",
  blankVoRequired: false,
  combinedLagerwal: "split-existing-competencies",
  rrp: "create-rrp-competency",
} satisfies JachtzeilenAbContentDecisions;
