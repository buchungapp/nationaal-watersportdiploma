// KSS kerntaken carry their display code baked into `titel` — e.g.
// "PvB 4.1 - Geven van lessen". `rang` is an ordering integer, NOT the
// display code: rang 41 shows as "4.1", rang 48 as "4.8". This helper
// parses the titel and returns the code + a stripped label so the UI
// can render "Kerntaak {code} — {label}" consistently.
//
// Falls back to `{ code: null, label: titel }` when the prefix isn't
// recognisable (e.g. future titel conventions), so the UI still shows
// *something* readable.

const TITEL_PATTERN = /^PvB\s+(\d+(?:\.\d+)?)\s*[-–—]\s*(.+)$/;

export function parseKerntaakTitel(titel: string): {
  code: string | null;
  label: string;
} {
  const m = titel.match(TITEL_PATTERN);
  // Both captures are required by the pattern, so m[1]/m[2] are
  // defined whenever `m` is truthy. Non-null assertion satisfies the
  // compiler without a redundant runtime check.
  if (m) return { code: m[1]!, label: m[2]!.trim() };
  return { code: null, label: titel };
}

// Werkproces titel pattern: "Werkproces 5.3.1 Adviseert over
// opleidingsprogramma's" → code "5.3.1", label "Adviseert over
// opleidingsprogramma's". Separator is whitespace (no dash). Some
// seed rows use ":" or "-" defensively. Falls back to the raw titel
// when the prefix isn't recognised so the UI never renders an empty
// label.
const WERKPROCES_TITEL_PATTERN =
  /^Werkproces\s+(\d+(?:\.\d+)+)\s*[:\-–—]?\s*(.+)$/i;

export function parseWerkprocesTitel(titel: string): {
  code: string | null;
  label: string;
} {
  const m = titel.match(WERKPROCES_TITEL_PATTERN);
  // See parseKerntaakTitel above — both captures required by the
  // regex, non-null assertion is safe when `m` is truthy.
  if (m) return { code: m[1]!, label: m[2]!.trim() };
  return { code: null, label: titel };
}
