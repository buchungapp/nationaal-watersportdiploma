// Client-safe types + pure helpers for the sandbox.
// No imports from ~/lib/nwd or anything server-only. Both server and client
// components / actions import from here, so the file never drags the server
// stack across the RSC boundary.

export type Richting = "instructeur" | "leercoach" | "pvb_beoordelaar";

export type RubricCriterium = {
  id: string;
  title: string;
  omschrijving: string;
  rang: number;
};

export type RubricWerkproces = {
  id: string;
  kerntaakId: string;
  titel: string;
  resultaat: string;
  rang: number;
  criteria: RubricCriterium[];
};

export type RubricTree = {
  profielId: string;
  profielTitel: string;
  richting: Richting;
  niveauRang: number;
  werkprocessen: RubricWerkproces[];
};

export type ProfielSummary = {
  id: string;
  titel: string;
  richting: Richting;
  niveauRang: number;
  werkprocesCount: number;
};

export function richtingLabel(richting: Richting): string {
  switch (richting) {
    case "instructeur":
      return "Instructeur";
    case "leercoach":
      return "Leercoach";
    case "pvb_beoordelaar":
      return "PvB-beoordelaar";
  }
}

// Client-safe mirror of ai_corpus.outline_template shape. Server fetches the
// typed row from the DB and hands it to the client component for the preview
// step. Keep in sync with packages/db/src/schema/ai_corpus/outline-template.ts.
export type OutlineSectionKind =
  | "voorwoord"
  | "zeil_cv"
  | "inleiding"
  | "context"
  | "pvb_werkproces"
  | "reflectie"
  | "bijlagen"
  | "other";

export type OutlineSectionFilledBy = "user" | "ai" | "rubric_driven";

export type OutlineSection = {
  ordinal: number;
  kind: OutlineSectionKind;
  title: string;
  description: string;
  targetWordCountMin: number | null;
  targetWordCountMax: number | null;
  filledBy: OutlineSectionFilledBy;
  werkprocesId: string | null;
  kerntaakId: string | null;
};

export type OutlineTemplate = {
  templateId: string;
  profielId: string;
  profielTitel: string;
  niveauRang: number;
  richting: Richting;
  version: number;
  sections: OutlineSection[];
};
