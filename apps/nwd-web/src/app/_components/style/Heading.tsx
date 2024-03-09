import clsx from "clsx";
import { ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { LineWave } from "~/app/_assets/Wave";
import WaveAnimation from "./WaveAnimation";

export default function Heading({
  children,
  className,
  animated = true,
  ...props
}: ComponentProps<"section"> & { animated?: boolean }) {
  const bg = className?.split(" ").filter((c) => c.includes("bg-"));

  return (
    <>
      <div className={clsx("w-full h-32 -z-10 -mt-9", bg)}></div>
      <section
        {...props}
        className={twMerge("w-full py-12 rounded-b-[3rem] grid gap-12", className)}
      >
        {children}
        <div className="w-full">
          {animated ? <WaveAnimation begin={-600} end={-100} /> : <LineWave progress={"70%"} />}
        </div>
      </section>
    </>
  );
}
