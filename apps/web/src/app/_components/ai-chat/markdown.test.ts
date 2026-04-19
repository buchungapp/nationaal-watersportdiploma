// Unit tests for the AiChat markdown block parser + inline parser.
//
// These are the non-React parts of the renderer — everything about how
// blocks and inline segments are extracted from a string. The React
// rendering layer is trivial (segments → nodes) so it's not tested here;
// if we want full component tests later, vitest + testing-library can
// drive the SimpleMarkdown component directly.
//
// Run: pnpm test:ai-chat (from apps/web)

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseInlineSegments, splitIntoBlocks } from "./markdown-helpers.ts";

describe("splitIntoBlocks", () => {
  it("returns a single paragraph block for plain text", () => {
    const blocks = splitIntoBlocks("Hello world");
    assert.equal(blocks.length, 1);
    assert.deepEqual(blocks[0], { kind: "p", text: "Hello world" });
  });

  it("splits paragraphs on blank lines", () => {
    const blocks = splitIntoBlocks("First para.\n\nSecond para.");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0]?.kind, "p");
    assert.equal(blocks[1]?.kind, "p");
  });

  it("treats blocks of `- ` lines as unordered lists", () => {
    const blocks = splitIntoBlocks("- first\n- second\n- third");
    assert.equal(blocks.length, 1);
    const block = blocks[0];
    if (block?.kind !== "ul") {
      throw new Error(`expected ul, got ${block?.kind}`);
    }
    assert.deepEqual(block.items, ["first", "second", "third"]);
  });

  it("treats blocks of `1. ` lines as ordered lists", () => {
    const blocks = splitIntoBlocks("1. first\n2. second\n3. third");
    assert.equal(blocks.length, 1);
    const block = blocks[0];
    if (block?.kind !== "ol") {
      throw new Error(`expected ol, got ${block?.kind}`);
    }
    assert.deepEqual(block.items, ["first", "second", "third"]);
  });

  it("does NOT treat mixed lines (bullet + prose) as a list", () => {
    const blocks = splitIntoBlocks("Some intro.\n- a bullet inside");
    assert.equal(blocks.length, 1);
    assert.equal(blocks[0]?.kind, "p");
  });

  it("handles a list followed by a paragraph", () => {
    const blocks = splitIntoBlocks("- one\n- two\n\nAfter the list.");
    assert.equal(blocks.length, 2);
    assert.equal(blocks[0]?.kind, "ul");
    assert.equal(blocks[1]?.kind, "p");
  });

  it("skips empty paragraphs caused by consecutive blank lines", () => {
    const blocks = splitIntoBlocks("first\n\n\n\nsecond");
    assert.equal(blocks.length, 2);
    assert.equal(
      blocks.every((b) => b.kind === "p"),
      true,
    );
  });

  it("handles empty input", () => {
    assert.deepEqual(splitIntoBlocks(""), []);
  });
});

describe("parseInlineSegments", () => {
  it("returns a single text segment for plain text", () => {
    assert.deepEqual(parseInlineSegments("hello"), [
      { kind: "text", text: "hello" },
    ]);
  });

  it("extracts **bold** runs", () => {
    assert.deepEqual(parseInlineSegments("hi **there** friend"), [
      { kind: "text", text: "hi " },
      { kind: "bold", text: "there" },
      { kind: "text", text: " friend" },
    ]);
  });

  it("handles bold at the start", () => {
    assert.deepEqual(parseInlineSegments("**bold** then plain"), [
      { kind: "bold", text: "bold" },
      { kind: "text", text: " then plain" },
    ]);
  });

  it("handles bold at the end", () => {
    assert.deepEqual(parseInlineSegments("plain then **bold**"), [
      { kind: "text", text: "plain then " },
      { kind: "bold", text: "bold" },
    ]);
  });

  it("handles multiple bold runs", () => {
    const segments = parseInlineSegments("**one** and **two** done");
    assert.equal(segments.length, 4);
    assert.equal(segments[0]?.kind, "bold");
    assert.equal(segments[2]?.kind, "bold");
  });

  it("leaves a stray single asterisk alone", () => {
    assert.deepEqual(parseInlineSegments("1 * 2 = 2"), [
      { kind: "text", text: "1 * 2 = 2" },
    ]);
  });

  it("drops empty segments entirely", () => {
    // "**x**" alone would split into ["", "**x**", ""] — the empty
    // strings should be pruned, leaving just the bold segment.
    assert.deepEqual(parseInlineSegments("**x**"), [
      { kind: "bold", text: "x" },
    ]);
  });
});
