// Pure string-parsing helpers for the AiChat markdown renderer. No React,
// no JSX — kept in a .ts file so node --test --experimental-strip-types
// can run them directly without a JSX transform.

export type MarkdownBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] };

export type MarkdownInlineSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string };

/**
 * Split a raw string into block-level markdown primitives:
 * paragraphs, unordered lists (`- item`), and ordered lists (`1. item`).
 *
 * Blocks are separated by blank lines. A paragraph whose every non-empty
 * line starts with `- ` or `1. ` is treated as a list; mixed blocks stay
 * as plain paragraphs.
 */
export function splitIntoBlocks(text: string): MarkdownBlock[] {
  const paragraphs = text.split(/\n\s*\n/);
  const blocks: MarkdownBlock[] = [];
  for (const para of paragraphs) {
    const lines = para.split("\n");
    const nonEmpty = lines.filter((l) => l.trim() !== "");
    if (nonEmpty.length === 0) continue;

    const isBullet = nonEmpty.every((l) => /^\s*-\s+/.test(l));
    const isNumber = nonEmpty.every((l) => /^\s*\d+\.\s+/.test(l));

    if (isBullet) {
      blocks.push({
        kind: "ul",
        items: nonEmpty.map((l) => l.replace(/^\s*-\s+/, "")),
      });
    } else if (isNumber) {
      blocks.push({
        kind: "ol",
        items: nonEmpty.map((l) => l.replace(/^\s*\d+\.\s+/, "")),
      });
    } else {
      blocks.push({ kind: "p", text: para });
    }
  }
  return blocks;
}

/**
 * Parse an inline string into text + bold segments. Plain text is one
 * "text" segment; `**x**` becomes a "bold" segment. No other inline
 * primitives (italic, code, links) — we can add them when we need them.
 *
 * Segments with empty text are dropped so callers don't have to filter
 * ("**x**" by itself becomes a single bold segment, not ["", bold, ""]).
 */
export function parseInlineSegments(text: string): MarkdownInlineSegment[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  const segments: MarkdownInlineSegment[] = [];
  for (const part of parts) {
    if (part === "") continue;
    const match = /^\*\*([^*]+)\*\*$/.exec(part);
    if (match?.[1]) {
      segments.push({ kind: "bold", text: match[1] });
    } else {
      segments.push({ kind: "text", text: part });
    }
  }
  return segments;
}
