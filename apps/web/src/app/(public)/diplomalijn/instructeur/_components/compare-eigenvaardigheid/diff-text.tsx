"use client";

import { diffWords } from "diff";
import { useMemo } from "react";

/** Renders B-side text with word-level diff — only highlights additions, skips removed parts. */
export function DiffText({ aText, bText }: { aText: string; bText: string }) {
  const parts = useMemo(() => diffWords(aText, bText), [aText, bText]);

  return (
    <>
      {parts.map((part, index) => {
        if (part.removed) {
          return null;
        }

        if (part.added) {
          return (
            <mark
              key={index}
              className="rounded bg-[rgba(0,71,171,0.14)] px-0.5 font-semibold text-branding-dark"
            >
              <span className="sr-only">nieuw op B: </span>
              {part.value}
            </mark>
          );
        }

        return <span key={index}>{part.value}</span>;
      })}
    </>
  );
}
