"use client";

import type { ReactNode } from "react";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { GridList } from "~/app/(dashboard)/_components/grid-list-v2";

interface ScrollableGridListProps {
  children: ReactNode;
  className?: string;
}

export function ScrollableGridList({
  children,
  className,
}: ScrollableGridListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Subscribe function - sets up listeners for overflow changes
  const subscribe = useCallback((callback: () => void) => {
    const container = containerRef.current;
    if (!container) return () => {};

    const resizeObserver = new ResizeObserver(callback);
    resizeObserver.observe(container);

    // Also listen for content changes that might affect overflow
    const mutationObserver = new MutationObserver(callback);
    mutationObserver.observe(container, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  // Snapshot function - returns current overflow state
  const getSnapshot = useCallback(() => {
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollHeight > container.clientHeight;
  }, []);

  // Server snapshot - assume no overflow on server
  const getServerSnapshot = () => false;

  const hasOverflow = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  return (
    <div className="relative">
      <div ref={containerRef} className={className}>
        <GridList
          className={`${hasOverflow ? "pb-8" : ""} @lg/grid-list:grid-cols-2 gap-3 lg:gap-4`}
        >
          {children}
        </GridList>
      </div>
      {/* Fade overlay that only shows when there's overflow */}
      {hasOverflow && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
