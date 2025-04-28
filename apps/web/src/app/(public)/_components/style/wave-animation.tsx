"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { DoubleLine, Wave } from "~/app/(public)/_assets/wave";
import useWindowDimensions from "~/app/(public)/_hooks/use-window-dimensions";

export default function WaveAnimation({
  begin,
  end,
  id,
}: {
  begin: number;
  end: number;
  id?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const [beginOffset, setBeginOffset] = useState(begin);
  const [endOffset, setEndOffset] = useState(end);
  const inverseProgress = useTransform(
    scrollY,
    [beginOffset, endOffset],
    ["70%", "10%"],
  );

  const { width } = useWindowDimensions();

  const isClient = typeof window !== "undefined";

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!ref.current || !isClient) return;

    const { top } = ref.current.getBoundingClientRect();

    if (id) {
      const el = document.getElementById(id);
      if (el) {
        const { height } = el.getBoundingClientRect();
        setBeginOffset(begin + top - height + window.scrollY);
        setEndOffset(end + top + window.scrollY);
        return;
      }
    }

    setBeginOffset(begin + top + window.scrollY);
    setEndOffset(end + top + window.scrollY);
  }, [id, ref, begin, end, isClient, width]);

  return (
    <div
      className="group relative w-full overflow-x-hidden py-3 text-white"
      ref={ref}
    >
      <motion.div
        style={{
          width: inverseProgress,
        }}
      >
        <DoubleLine className="w-full" />
      </motion.div>
      <motion.div
        className="absolute top-0"
        style={{
          left: inverseProgress,
        }}
      >
        <Wave className="h-7" />
      </motion.div>
      <motion.div
        className="absolute right-0 top-[12px] translate-x-[240px]"
        style={{
          left: inverseProgress,
        }}
      >
        <DoubleLine className="w-full" />
      </motion.div>
    </div>
  );
}
