"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Line, Wave } from "~/app/_assets/Wave";

export default function WaveAnimation() {
  const { scrollY } = useScroll();
  const left = useTransform(scrollY, [128, 600], ["70%", "10%"]);

  return (
    <div className="text-white w-full relative group py-3 overflow-x-hidden">
      <Line className="w-full" />
      <motion.div
        className="absolute top-0 bg-branding-light"
        style={{
          left,
        }}
      >
        <Wave className="h-full" />
      </motion.div>
      {/* duration-700 transition-transform translate-x-1/2 group-hover:translate-x-[calc(100vw-240px-240px)] */}
    </div>
  );
}
