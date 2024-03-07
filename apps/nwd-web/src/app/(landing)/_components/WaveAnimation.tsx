"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { DoubleLine, Wave } from "~/app/_assets/Wave";
import useWindowDimensions from "~/app/_components/useWindowDimensions";

export default function WaveAnimation({
  begin,
  end,
}: {
  begin: number;
  end: number;
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

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;

    const { top } = ref.current.getBoundingClientRect();
    setBeginOffset(begin + top + window.scrollY);
    setEndOffset(end + top + window.scrollY);
  }, [ref, begin, end, typeof window, width]);

  return (
    <div
      className="text-white w-full relative group py-3 overflow-x-hidden"
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
        <Wave className="h-full" />
      </motion.div>
      <motion.div
        className="absolute top-[12px] translate-x-[240px] right-0"
        style={{
          left: inverseProgress,
        }}
      >
        <DoubleLine className="w-full" />
      </motion.div>
    </div>
  );
}
