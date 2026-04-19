// Corpus scripts — shared types + filename parsing.
// Runs outside the Next.js app. Standalone node modules.

import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the corpus dir relative to this script's location so it works
// regardless of the shell's cwd (pnpm --filter cds into the package).
// shared.ts lives at apps/web/scripts/corpus/shared.ts → repo root is 4 levels up.
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(SCRIPT_DIR, "..", "..", "..", "..");

export const CORPUS_ROOT = join(REPO_ROOT, ".tmp", "portfolio-corpus");
export const GOLDEN_DIR = join(CORPUS_ROOT, "golden");
export const RAW_DIR = join(CORPUS_ROOT, "raw");
export const EXTRACTED_DIR = join(CORPUS_ROOT, "extracted");
export const ANONYMIZED_DIR = join(CORPUS_ROOT, "anonymized");
export const REPORTS_DIR = join(CORPUS_ROOT, "reports");
// Golden datasets: cached (extracted + synthesized) pairs per matrix entry.
// Rebuild by deleting individual .json files or the whole directory.

export type ParsedFilename = {
  file: string;
  inferredNiveau: number | null;
  kerntaakCodes: string[]; // e.g. ["4.1"] or ["5.3", "5.5", "5.7"], [] for full-niveau portfolios
  isFullNiveau: boolean;
  kandidaatName: string;
};

// Filenames in the corpus follow two shapes:
//   alle_niveau_3_bob.pdf        -> full portfolio for niveau 3
//   4.1_maurits.pdf              -> kerntaak 4.1 only
//   5.3-5.5-5.7_floris.pdf       -> kerntaken 5.3 + 5.5 + 5.7
const FULL_NIVEAU = /^alle_niveau_(\d+)_([a-zA-Z]+)\.pdf$/;
const KERNTAAK_BUNDLE = /^(\d+\.\d+(?:-\d+\.\d+)*)_([a-zA-Z]+)\.pdf$/;

export function parseFilename(file: string): ParsedFilename {
  const full = FULL_NIVEAU.exec(file);
  if (full?.[1] && full[2]) {
    return {
      file,
      inferredNiveau: Number(full[1]),
      kerntaakCodes: [],
      isFullNiveau: true,
      kandidaatName: full[2].toLowerCase(),
    };
  }
  const bundle = KERNTAAK_BUNDLE.exec(file);
  if (bundle?.[1] && bundle[2]) {
    const codes = bundle[1].split("-");
    const niveau = codes[0] ? Number(codes[0].split(".")[0]) : null;
    return {
      file,
      inferredNiveau: Number.isFinite(niveau) ? niveau : null,
      kerntaakCodes: codes,
      isFullNiveau: false,
      kandidaatName: bundle[2].toLowerCase(),
    };
  }
  return {
    file,
    inferredNiveau: null,
    kerntaakCodes: [],
    isFullNiveau: false,
    kandidaatName: "unknown",
  };
}

export function listRawPdfs(): string[] {
  return readdirSync(RAW_DIR)
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .sort();
}

export type ExtractedPortfolio = {
  sourceFile: string;
  parsed: ParsedFilename;
  pageCount: number;
  rawText: string;
  charCount: number;
  extractedAt: string;
};

// AnonymizedPortfolio deliberately does NOT extend ExtractedPortfolio.
// We explicitly whitelist the safe fields so `rawText` cannot leak into the
// anonymised output via object spread. Adding a field to ExtractedPortfolio
// should never automatically appear in AnonymizedPortfolio — verify by hand.
export type AnonymizedPortfolio = {
  sourceFile: string;
  parsed: ParsedFilename;
  pageCount: number;
  charCount: number;
  extractedAt: string;
  anonymizedAt: string;
  anonymizationMethod: "regex-only" | "regex+llm";
  anonymizedText: string;
  redactedEntities: {
    firstNames: string[];
    locations: string[];
    verenigingen: string[];
    datesYears: string[];
    other: string[];
  };
};
