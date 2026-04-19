import { Streamdown } from "streamdown";

// Markdown renderer for AI chat messages.
//
// We use streamdown (vercel/streamdown) because:
//   1. It handles partial / unterminated markdown mid-stream without the
//      "raw ** then suddenly bold" flicker that react-markdown (and our
//      previous hand-rolled SimpleMarkdown) produced while tokens were
//      still arriving.
//   2. It bundles GFM (tables, task lists), KaTeX math, Shiki syntax
//      highlighting, and safe-link handling — everything we'd otherwise
//      glue together around react-markdown as our markdown needs grow.
//   3. It's a 100%-compatible drop-in for the `components` override API
//      if we later want to customize specific element renderers.
//
// The Tailwind v4 `@source` directive in globals.css keeps streamdown's
// prestyled utility classes from being purged.
//
// History: this used to be a 120-line hand-rolled parser + renderer
// (SimpleMarkdown). That grew through paragraph, list, bold, heading,
// and hr support before we hit code-block / table / partial-stream
// needs and decided a purpose-built lib was worth the ~50KB gzipped.

export function SimpleMarkdown({ text }: { text: string }) {
  return <Streamdown>{text}</Streamdown>;
}
