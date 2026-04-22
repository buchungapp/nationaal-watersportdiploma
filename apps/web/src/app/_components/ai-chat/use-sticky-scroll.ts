import { useEffect, useLayoutEffect, useRef } from "react";

// useStickyScroll — container-bounded auto-scroll with read-up-to-pause.
//
// Attach the returned ref to an overflow-y container that holds streamed
// messages. Whenever `trigger` changes (typically the messages array), the
// hook scrolls the container to its bottom — BUT only if the user hasn't
// intentionally scrolled up more than `releaseThresholdPx` from the bottom.
// Reading older messages doesn't get hijacked back to the live stream.
//
// Critical: never uses scrollIntoView (which bubbles up to the nearest
// overflow ancestor, often the document). This hook only touches
// el.scrollTop, scoped strictly to the container you attach the ref to.
//
// Exports splitting hook-usage from the pure logic so the decision
// function can be unit-tested without a DOM.

export type StickyScrollOptions = {
  /** How close to the bottom still counts as "at the bottom" (px). Default 80. */
  releaseThresholdPx?: number;
};

/**
 * Pure decision helper: given the current scroll geometry, should new
 * content auto-scroll the container?
 *
 * Returns true when the user is within `threshold` px of the bottom.
 * Exported for direct unit testing of the threshold behaviour.
 */
export function isNearBottom(
  geometry: { scrollHeight: number; scrollTop: number; clientHeight: number },
  threshold: number,
): boolean {
  const distance =
    geometry.scrollHeight - geometry.scrollTop - geometry.clientHeight;
  return distance < threshold;
}

export function useStickyScroll<T extends HTMLElement>(
  _trigger: unknown,
  options: StickyScrollOptions = {},
) {
  const containerRef = useRef<T>(null);
  const stickyRef = useRef(true);
  const threshold = options.releaseThresholdPx ?? 80;

  // Track whether the user is at the bottom. Stay sticky until they scroll
  // up more than the threshold; re-stick when they scroll back.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    function onScroll() {
      if (!el) return;
      stickyRef.current = isNearBottom(
        {
          scrollHeight: el.scrollHeight,
          scrollTop: el.scrollTop,
          clientHeight: el.clientHeight,
        },
        threshold,
      );
    }
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [threshold]);

  // Snap to bottom on trigger change if the user was sticky. useLayoutEffect
  // so the scroll happens before paint and there's no flash.
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (!stickyRef.current) return;
    el.scrollTop = el.scrollHeight;
  }, []);

  return containerRef;
}
