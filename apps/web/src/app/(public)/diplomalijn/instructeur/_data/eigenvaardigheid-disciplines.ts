// Canonical list of disciplines that have an eigenvaardigheidslijn (NWD A/B/C).
// Handles match `discipline.handle` in the database where seeded.
// Source: packages/scripts/src/tmp/import-instructeurskwalificaties.ts
//
// Used in:
//  - _components/eigenvaardigheid-matrix.tsx (landing overview)
//  - _components/side-nav.tsx (sidebar sub-section)
//  - [discipline]/page.tsx (title fallback if not in DB)

export const EIGENVAARDIGHEID_DISCIPLINES: ReadonlyArray<{
  handle: string;
  title: string;
}> = [
  { handle: "catamaran", title: "Catamaran" },
  { handle: "jachtzeilen", title: "Jachtzeilen" },
  { handle: "kajuitzeilen", title: "Kajuitzeilen" },
  { handle: "kielboot", title: "Kielboot" },
  { handle: "windsurfen", title: "Windsurfen" },
  { handle: "zwaardboot-1-mans", title: "Zwaardboot 1-mans" },
  { handle: "zwaardboot-2-mans", title: "Zwaardboot 2-mans" },
];
