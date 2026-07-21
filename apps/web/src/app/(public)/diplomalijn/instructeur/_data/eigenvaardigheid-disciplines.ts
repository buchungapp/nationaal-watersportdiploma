// Fallback list for sidebar + discipline page titles when not in the DB yet.
// The eigenvaardigheid matrix on the hub page is loaded from the database.
//
// Handles match `discipline.handle` in the database where seeded.
// Source: packages/scripts/src/tmp/import-instructeurskwalificaties.ts

export const EIGENVAARDIGHEID_DISCIPLINES: ReadonlyArray<{
  handle: string;
  title: string;
}> = [
  { handle: "catamaran", title: "Catamaran" },
  { handle: "jachtzeilen", title: "Jachtzeilen" },
  { handle: "kielboot", title: "Kielboot" },
  { handle: "windsurfen", title: "Windsurfen" },
  { handle: "zwaardboot-1-mans", title: "Zwaardboot 1-mans" },
  { handle: "zwaardboot-2-mans", title: "Zwaardboot 2-mans" },
  { handle: "bijboot", title: "Bijboot" },
];
