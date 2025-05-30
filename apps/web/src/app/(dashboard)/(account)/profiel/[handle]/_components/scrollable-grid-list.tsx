"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { GridList } from "~/app/(dashboard)/_components/grid-list-v2";

interface ScrollableGridListProps {
  children: ReactNode;
  className?: string;
}

export function ScrollableGridList({
  children,
  className,
}: ScrollableGridListProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      const container = scrollContainerRef.current;
      if (container) {
        const hasVerticalOverflow =
          container.scrollHeight > container.clientHeight;
        setHasOverflow(hasVerticalOverflow);
      }
    };

    checkOverflow();

    // Use ResizeObserver for better performance than window resize listener
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (scrollContainerRef.current) {
      resizeObserver.observe(scrollContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <div ref={scrollContainerRef} className={className}>
        <GridList>{children}</GridList>
      </div>
      {/* Fade overlay that only shows when there's overflow */}
      {hasOverflow && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white via-white/80 to-transparent pointer-events-none" />
      )}
    </div>
  );
}
