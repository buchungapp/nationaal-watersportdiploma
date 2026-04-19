// Pure string-parsing helpers for the AiChat markdown renderer. No React,
// no JSX — kept in a .ts file so node --test --experimental-strip-types
// can run them directly without a JSX transform.

export type MarkdownBlock =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "hr" };

export type MarkdownInlineSegment =
  | { kind: "text"; text: string }
  | { kind: "bold"; text: string };

// A line of just `---`, `***`, or `___` is a horizontal rule. Require 3+ of
// the same char on their own line; leaves single dashes in prose alone.
const HR_LINE = /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/;
// `# heading`, `## heading`, up to 6. Captures level + text.
const HEADING_LINE = /^(#{1,6})\s+(.+?)\s*$/;

/**
 * Split a raw string into block-level markdown primitives:
 *   - paragraphs
 *   - unordered lists (`- item`)
 *   - ordered lists (`1. item`)
 *   - headings (`## Heading`) — level 1–6
 *   - horizontal rules (`---`, `***`, `___`)
 *
 * Blocks are separated by blank lines. A paragraph whose every non-empty
 * line starts with `- ` or `1. ` is treated as a list; a single-line
 * paragraph that matches the heading or hr pattern is treated as such.
 * Everything else falls through to a plain paragraph.
 */
export function splitIntoBlocks(text: string): MarkdownBlock[] {
  const paragraphs = text.split(/\n\s*\n/);
  const blocks: MarkdownBlock[] = [];
  for (const para of paragraphs) {
    const lines = para.split("\n");
    const nonEmpty = lines.filter((l) => l.trim() !== "");
    if (nonEmpty.length === 0) continue;

    // Single-line special blocks: heading + hr.
    if (nonEmpty.length === 1) {
      const only = nonEmpty[0] ?? "";
      if (HR_LINE.test(only)) {
        blocks.push({ kind: "hr" });
        continue;
      }
      const hm = HEADING_LINE.exec(only);
      if (hm?.[1] && hm[2]) {
        const level = Math.min(
          6,
          Math.max(1, hm[1].length),
        ) as MarkdownBlock extends { kind: "heading"; level: infer L }
          ? L
          : never;
        blocks.push({ kind: "heading", level, text: hm[2] });
        continue;
      }
    }

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
