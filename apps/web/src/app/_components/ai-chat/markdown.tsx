import type { ReactNode } from "react";
import { parseInlineSegments, splitIntoBlocks } from "./markdown-helpers";

// Minimal, safe markdown renderer for AI chat messages. Handles only the
// primitives our LLM outputs + templates use, and builds React nodes
// (never dangerouslySetInnerHTML) so there's no XSS surface.
//
// Parsing logic lives in ./markdown-helpers.ts (pure TS) so it can be
// unit-tested without a JSX transform. This file is just the React
// rendering layer.

export function SimpleMarkdown({ text }: { text: string }) {
  const blocks = splitIntoBlocks(text);
  return (
    <div className="flex flex-col gap-2">
      {blocks.map((block, i) => {
        if (block.kind === "ul") {
          return (
            <ul key={`ul-${i}`} className="ml-5 list-disc space-y-1">
              {block.items.map((item, j) => (
                <li key={`ul-${i}-li-${j}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        if (block.kind === "ol") {
          return (
            <ol key={`ol-${i}`} className="ml-5 list-decimal space-y-1">
              {block.items.map((item, j) => (
                <li key={`ol-${i}-li-${j}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }
        if (block.kind === "heading") {
          return (
            <Heading key={`h-${i}`} level={block.level}>
              {renderInline(block.text)}
            </Heading>
          );
        }
        if (block.kind === "hr") {
          return (
            <hr
              key={`hr-${i}`}
              className="my-1 border-t border-slate-300/70"
            />
          );
        }
        return (
          <p key={`p-${i}`} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
}

// Render a heading at the given level with size + weight scaled down from
// the default browser defaults — chat bubbles are narrow so h1 at 2em eats
// the bubble. Levels 4–6 collapse onto the same small style; we rarely see
// deeply-nested headings in LLM output.
function Heading({
  level,
  children,
}: { level: 1 | 2 | 3 | 4 | 5 | 6; children: ReactNode }) {
  const cls = "font-semibold text-slate-900";
  if (level === 1) {
    return <h1 className={`mt-1 text-base ${cls}`}>{children}</h1>;
  }
  if (level === 2) {
    return <h2 className={`mt-1 text-sm uppercase tracking-wide ${cls}`}>{children}</h2>;
  }
  if (level === 3) {
    return <h3 className={`mt-1 text-sm ${cls}`}>{children}</h3>;
  }
  return <h4 className={`mt-1 text-xs uppercase tracking-wider ${cls}`}>{children}</h4>;
}

function renderInline(text: string): ReactNode {
  const segments = parseInlineSegments(text);
  return segments.map((s, i) => {
    if (s.kind === "bold") {
      return <strong key={`b-${i}`}>{s.text}</strong>;
    }
    return <span key={`t-${i}`}>{s.text}</span>;
  });
}

// Re-export pure helpers so consumers can parse without pulling React in.
export {
  parseInlineSegments,
  splitIntoBlocks,
  type MarkdownBlock,
  type MarkdownInlineSegment,
} from "./markdown-helpers";
