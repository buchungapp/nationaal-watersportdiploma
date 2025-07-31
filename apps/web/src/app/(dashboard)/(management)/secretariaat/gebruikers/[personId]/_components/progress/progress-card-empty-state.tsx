import type { PropsWithChildren } from "react";
import {
  type CardType,
  ProgressCardProvider,
} from "~/app/(dashboard)/(account)/profiel/[handle]/_components/progress/progress-card";

import { AcademicCapIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Balancer from "react-wrap-balancer";
import { BoatIcon } from "~/app/(dashboard)/_components/icons/boat-icon";
import { MedailIcon } from "~/app/(dashboard)/_components/icons/medail-icon";
import { AnimatedWave } from "~/app/_components/animated-wave";

export function ProgressCardEmptyState({
  type,
}: PropsWithChildren<{
  type: CardType;
}>) {
  const styles: Record<
    CardType,
    {
      cardClassName: string;
      iconBackgroundClassName: string;
      Icon: React.ElementType;
      heading: string;
      iconClassName: string;
      headingClassName: string;
      waveColor: string;
    }
  > = {
    program: {
      cardClassName: "bg-sky-50/50 border-sky-200",
      iconBackgroundClassName: "bg-sky-100",
      Icon: AcademicCapIcon,
      heading: "Er is nog geen opleiding gestart",
      iconClassName: "text-sky-600",
      headingClassName: "text-sky-950",
      waveColor: "text-branding-light",
    },
    certificate: {
      cardClassName: "bg-orange-50/50 border-orange-200",
      iconBackgroundClassName: "bg-orange-100",
      Icon: MedailIcon,
      heading: "Er is nog geen diploma behaald",
      iconClassName: "text-orange-600",
      headingClassName: "text-orange-950",
      waveColor: "text-branding-orange",
    },
    course: {
      cardClassName: "bg-blue-50/50 border-blue-200",
      iconBackgroundClassName: "bg-blue-100",
      Icon: BoatIcon,
      heading: "Er wordt nog geen actieve cursus gevolgd",
      iconClassName: "text-blue-600",
      headingClassName: "text-blue-950",
      waveColor: "text-branding-dark",
    },
  };

  const style = styles[type];

  return (
    <ProgressCardProvider type={type} data={null}>
      <article
        className={clsx(
          "relative pb-2 border-2 border-dashed rounded-md overflow-hidden",
          style.cardClassName,
        )}
      >
        <div className="flex flex-col items-center mx-auto px-2 sm:px-4 pt-6 pb-10 max-w-lg text-center">
          <div
            className={clsx(
              "flex justify-center items-center rounded-full size-16",
              style.iconBackgroundClassName,
            )}
          >
            <style.Icon className={clsx("size-8", style.iconClassName)} />
          </div>

          <div className="space-y-2 mt-2.5">
            <div>
              <h3
                className={clsx(
                  "font-semibold sm:text-xl/7 text-2xl/7",
                  style.headingClassName,
                )}
              >
                <Balancer>{style.heading}</Balancer>
              </h3>
            </div>
          </div>
        </div>
        <AnimatedWave textColorClassName={style.waveColor} />
      </article>
    </ProgressCardProvider>
  );
}
