import { z } from "zod";

// Shape of one question returned by the question generator.
// A question can reference multiple criteria — the plan deliberately allows
// many-to-many, so Phase 2's 30-cap can merge adjacent criteria.
export const QuestionSchema = z.object({
  id: z.string().min(1),
  werkprocesId: z.string().uuid(),
  werkprocesTitel: z.string().min(1),
  criteriumIds: z.array(z.string().uuid()).min(1),
  prompt: z.string().min(10),
});

export const QuestionsPayloadSchema = z.object({
  questions: z.array(QuestionSchema).min(3).max(15),
});

// Per-werkproces draft shape — one LLM call returns one of these.
//
// Length floor history:
//   initial -> min(80)   (arbitrary)
//   Stage 1 -> min(200)  (calibrated on corpus paragraph distribution across
//                         ALL niveaus, but over-aggregated — forced padding)
//   Stage A -> min(80)   (baseline eval showed +124% length overshoot on real
//                         portfolios; the hard floor was fighting the data.
//                         Now a minimal sanity floor; length is meant to be
//                         driven by what the kandidaat actually said.)
// Do not raise this back without a matrix eval showing real bewijs length is
// consistently higher than 80 words on the target niveau.
export const WerkprocesDraftSchema = z.object({
  werkprocesId: z.string().uuid(),
  werkprocesTitel: z.string().min(1),
  criteria: z
    .array(
      z.object({
        criteriumId: z.string().uuid(),
        criteriumTitel: z.string().min(1),
        bewijs: z.string().min(80),
      }),
    )
    .min(1),
});

export type Question = z.infer<typeof QuestionSchema>;
export type QuestionsPayload = z.infer<typeof QuestionsPayloadSchema>;
export type WerkprocesDraft = z.infer<typeof WerkprocesDraftSchema>;
