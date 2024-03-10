import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { LineWave } from "~/app/_assets/Wave";
import WaveAnimation from "./WaveAnimation";

export default function PageHero({
  children,
  className,
  animated = true,
  ...props
}: ComponentProps<"section"> & { animated?: boolean }) {
  return (
    <section
      {...props}
      id="heading"
      className={twMerge("w-full bg-branding-light py-12 rounded-b-[3rem] grid gap-12", className)}
    >
      {children}
      <div className="w-full">
        {animated ? (
          <WaveAnimation begin={0} end={-100} id="heading" />
        ) : (
          <LineWave progress={"70%"} />
        )}
      </div>
    </section>
  );
}
