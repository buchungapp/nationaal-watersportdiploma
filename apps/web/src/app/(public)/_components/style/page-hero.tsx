import type { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";

import { LineWave } from "~/app/(public)/_assets/wave";
import WaveAnimation from "./wave-animation";

export default function PageHero({
  children,
  className,
  animated = true,
  ...props
}: ComponentProps<"header"> & { animated?: boolean }) {
  return (
    <header
      {...props}
      id="heading"
      className={twMerge(
        "grid w-full gap-12 rounded-b-[3rem] bg-branding-light py-12",
        className,
      )}
    >
      {children}
      <div className="w-full">
        {animated ? (
          <WaveAnimation begin={0} end={-100} id="heading" />
        ) : (
          <LineWave progress={"70%"} />
        )}
      </div>
    </header>
  );
}
