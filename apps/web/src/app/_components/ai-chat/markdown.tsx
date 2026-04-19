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
        return (
          <p key={`p-${i}`} className="whitespace-pre-wrap">
            {renderInline(block.text)}
          </p>
        );
      })}
    </div>
  );
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
