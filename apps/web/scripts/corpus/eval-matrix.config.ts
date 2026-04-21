// Canonical eval matrix. Each entry gets run through the eval pipeline when
// `pnpm -C apps/web corpus:eval:matrix` is invoked.
//
// Keep this list stable. Adding/removing entries shifts the baseline; if you
// want to experiment with a different portfolio without disturbing the matrix,
// use `pnpm -C apps/web corpus:eval <file> <profiel>` as a one-off.

export type MatrixEntry = {
  niveau: number;
  portfolio: string;
  profielTitel: string;
  /** Optional: why this one is in the matrix. Shown in the report. */
  note?: string;
};

export const EVAL_MATRIX: MatrixEntry[] = [
  // --- Niveau 3 ---
  {
    niveau: 3,
    portfolio: "alle_niveau_3_bob.json",
    profielTitel: "Instructeur 3",
    note: "Kortste full-niveau-3 portfolio. Snelste iteratie.",
  },
  {
    niveau: 3,
    portfolio: "alle_niveau_3_maurits.json",
    profielTitel: "Instructeur 3",
    note: "Dichtere full-niveau-3. Andere stem dan Bob.",
  },

  // --- Niveau 4 ---
  {
    niveau: 4,
    portfolio: "alle_niveau_4_kevin.json",
    profielTitel: "Instructeur 4",
    note: "Baseline N4 — middenlang, schone tekst.",
  },
  {
    niveau: 4,
    portfolio: "alle_niveau_4_jade.json",
    profielTitel: "Instructeur 4",
    note: "Lang + dichte voice. Stress-test voor scaling.",
  },
  {
    niveau: 4,
    portfolio: "alle_niveau_4_maurits.json",
    profielTitel: "Instructeur 4",
    note: "Zelfde kandidaat als N3-maurits — progressie signal.",
  },
  {
    niveau: 4,
    portfolio: "alle_niveau_4_myrthe.json",
    profielTitel: "Instructeur 4",
    note: "Langst (27k words, 80 paragrafen) — beoordelaar-load test.",
  },
  {
    niveau: 4,
    portfolio: "4.4_tammo.json",
    profielTitel: "Instructeur 4",
    note: "Partial portfolio (kerntaak 4.4 only). Focused-scope eval.",
  },

  // --- Niveau 5: Instructeur 5 (PvB 5.1 Geven van lessen) ---
  {
    niveau: 5,
    portfolio: "5.1_emiel.json",
    profielTitel: "Instructeur 5",
    note: "Emiel als kwaliteitsreferentie aangewezen. Partial (5.1).",
  },
  {
    niveau: 5,
    portfolio: "5.1_floris.json",
    profielTitel: "Instructeur 5",
    note: "Partial (5.1).",
  },
  {
    niveau: 5,
    portfolio: "5.1_jade.json",
    profielTitel: "Instructeur 5",
    note: "Partial (5.1). Jade cross-niveau (ook in N4).",
  },
  {
    niveau: 5,
    portfolio: "5.1_maurits.json",
    profielTitel: "Instructeur 5",
    note: "Partial (5.1). Maurits cross-niveau (N3 + N4 + N5).",
  },

  // --- Niveau 5: Leercoach 5 (PvB 5.3, 5.4, 5.5) ---
  {
    niveau: 5,
    portfolio: "5.3_jade.json",
    profielTitel: "Leercoach 5",
    note: "Partial (5.3 Ontwikkelen opleidingsprogramma's).",
  },
  {
    niveau: 5,
    portfolio: "5.4_emiel.json",
    profielTitel: "Leercoach 5",
    note: "Emiel als kwaliteitsreferentie. Partial (5.4 Coachen).",
  },
  {
    niveau: 5,
    portfolio: "5.4_floris.json",
    profielTitel: "Leercoach 5",
    note: "Partial (5.4 Coachen).",
  },
  {
    niveau: 5,
    portfolio: "5.4_jade.json",
    profielTitel: "Leercoach 5",
    note: "Partial (5.4 Coachen).",
  },
  {
    niveau: 5,
    portfolio: "5.5_jade.json",
    profielTitel: "Leercoach 5",
    note: "Partial (5.5 Managen begeleidingsteam).",
  },
  {
    niveau: 5,
    portfolio: "5.3-5.5-5.7_floris.json",
    profielTitel: "Leercoach 5",
    note: "Mixed partial (5.3 + 5.5 Leercoach 5; 5.7 content valt buiten de Leercoach 5 rubric en wordt niet gescored).",
  },
  {
    niveau: 5,
    portfolio: "alle_niveau_5_kevin.json",
    profielTitel: "Leercoach 5",
    note: "Opleiderscursus-portfolio (oud nummeringschema). Content spans meerdere PvB's; geëvalueerd tegen Leercoach 5 voor maximale coverage van criteria.",
  },

  // --- Niveau 5: Beoordelaar 5 (PvB 5.7 Afnemen Proeven) ---
  {
    niveau: 5,
    portfolio: "5.7_jade.json",
    profielTitel: "Beoordelaar 5",
    note: "Partial (5.7 Afnemen Proeven van Bekwaamheid).",
  },
];
