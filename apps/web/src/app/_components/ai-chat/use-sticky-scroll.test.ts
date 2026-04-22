// Tests for the pure decision helper behind useStickyScroll.
//
// The hook itself needs a DOM to test (scroll listeners + layout effect) —
// we'd set up vitest + jsdom + testing-library for that and run the whole
// hook in a simulated viewport. Not done yet; flagged in the commit msg.
//
// For now we cover the threshold logic directly so the "scroll hijack"
// regression we just fixed in ChatShell stays fixed even if someone tunes
// the threshold later.

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isNearBottom } from "./use-sticky-scroll.ts";

describe("isNearBottom", () => {
  it("returns true when scrolled exactly to the bottom", () => {
    // scrollHeight=1000, clientHeight=500, scrollTop=500 → distance=0
    assert.equal(
      isNearBottom(
        { scrollHeight: 1000, scrollTop: 500, clientHeight: 500 },
        80,
      ),
      true,
    );
  });

  it("returns true within the threshold (just above bottom)", () => {
    // distance = 1000 - 450 - 500 = 50; threshold 80 → still sticky
    assert.equal(
      isNearBottom(
        { scrollHeight: 1000, scrollTop: 450, clientHeight: 500 },
        80,
      ),
      true,
    );
  });

  it("returns false past the threshold", () => {
    // distance = 1000 - 300 - 500 = 200; threshold 80 → released
    assert.equal(
      isNearBottom(
        { scrollHeight: 1000, scrollTop: 300, clientHeight: 500 },
        80,
      ),
      false,
    );
  });

  it("returns false at the top of a long container", () => {
    assert.equal(
      isNearBottom(
        { scrollHeight: 10000, scrollTop: 0, clientHeight: 500 },
        80,
      ),
      false,
    );
  });

  it("returns true when the whole container fits in the viewport (no scroll needed)", () => {
    // scrollHeight == clientHeight, scrollTop=0 → distance=0
    assert.equal(
      isNearBottom({ scrollHeight: 400, scrollTop: 0, clientHeight: 400 }, 80),
      true,
    );
  });

  it("tightens the sticky zone when threshold is small", () => {
    // distance = 60; threshold 50 → not sticky anymore
    assert.equal(
      isNearBottom(
        { scrollHeight: 1000, scrollTop: 440, clientHeight: 500 },
        50,
      ),
      false,
    );
  });
});
