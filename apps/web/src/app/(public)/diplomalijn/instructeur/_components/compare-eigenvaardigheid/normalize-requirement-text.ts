// cspell:words Mojibake effici iënt

function tryDecodeLatin1AsUtf8(text: string): string | null {
  try {
    const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0) & 0xff);
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function repairQuestionMarkMojibake(text: string): string {
  return (
    text
      // "één" — two UTF-8 é bytes often become four literal question marks
      .replace(/\?{4}n\b/gi, "één")
      .replace(/\uFFFD{2}n\b/gi, "één")
      // "creëert", "reëel" — ë between e's
      .replace(/e\?\?e/gi, "eëe")
      // "efficiënt" and similar -iënt words
      .replace(/effici\?{2}nt/gi, "efficiënt")
      .replace(/effici\?nt/gi, "efficiënt")
      .replace(/([a-z]{4,})\?{2}nt\b/gi, "$1ënt")
      // Remaining ?? between letters (e.g. diaeresis in Dutch)
      .replace(/([a-z])\?\?([a-z])/gi, "$1ë$2")
      // Single ë / é that became ??
      .replace(/\?{2}/g, (match, offset, full) => {
        const after = full.slice(
          offset + match.length,
          offset + match.length + 2,
        );
        if (after === "nt") return "ë";
        if (after.startsWith("n")) return "é";
        return match;
      })
  );
}

/**
 * Normalize requirement text from the database.
 * Legacy imports sometimes stored UTF-8 as Latin-1 (e.g. "efficiÃ«nt") or
 * replaced multibyte chars with "?" (e.g. "één" → "????n").
 */
export function normalizeRequirementText(text: string | null): string | null {
  if (!text) return text;

  let result = text;

  if (/Ã.|Â.|\?\?|\uFFFD/.test(result)) {
    const decoded = tryDecodeLatin1AsUtf8(result);
    if (decoded && !decoded.includes("\uFFFD")) {
      result = decoded;
    }
  }

  result = repairQuestionMarkMojibake(result);

  return result
    .replace(/Ã«/g, "ë")
    .replace(/Ã©/g, "é")
    .replace(/Ã¯/g, "ï")
    .replace(/Ã¶/g, "ö")
    .replace(/Ã¼/g, "ü")
    .replace(/â€™/g, "'")
    .replace(/â€œ/g, '"')
    .replace(/â€/g, '"');
}
