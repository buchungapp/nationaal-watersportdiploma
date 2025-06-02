"use client";
import * as Headless from "@headlessui/react";
import {
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";
import {
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import type { Student } from "@nawadi/core";
import clsx from "clsx";
import type React from "react";
import { type PropsWithChildren, createContext, useContext } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { BoatIcon } from "~/app/(dashboard)/_components/icons/boat-icon";
import { CircleIcon } from "~/app/(dashboard)/_components/icons/circle-icon";
import { Logo } from "~/app/_assets/logo";
import watersportverbondGray from "~/app/_assets/watersportverbond-white.png";
import { moduleTypeLabel } from "~/utils/labels";

type CardType = "course" | "program" | "certificate";

interface ProgressCardContextType {
  type: CardType;
}

const ProgressCardContext = createContext<ProgressCardContextType | undefined>(
  undefined,
);

function ProgressCardProvider({
  children,
  type,
}: {
  children: React.ReactNode;
  type: CardType;
}) {
  return (
    <ProgressCardContext.Provider value={{ type }}>
      {children}
    </ProgressCardContext.Provider>
  );
}

function useProgressCard() {
  const context = useContext(ProgressCardContext);
  if (context === undefined) {
    throw new Error(
      "useProgressCard must be used within a ProgressCardProvider",
    );
  }
  return context;
}

export function ProgressCard({
  children,
  type,
}: PropsWithChildren<{
  type: CardType;
}>) {
  const colors: Record<CardType, string> = {
    program: "border-sky-200",
    certificate: "border-orange-200",
    course: "border-blue-200",
  };

  return (
    <ProgressCardProvider type={type}>
      <article
        className={clsx(
          "relative border rounded-md overflow-hidden pb-2",
          colors[type],
        )}
      >
        {children}
      </article>
    </ProgressCardProvider>
  );
}

export function ProgressCardHeader({
  degree,
  program,
  gearType,
  itemIndex = 0,
}: {
  degree: React.ReactNode;
  program: React.ReactNode;
  gearType: React.ReactNode;
  itemIndex: number;
}) {
  const { type } = useProgressCard();

  const details: Record<
    CardType,
    {
      background: string;
      text: string;
      typeLabel: string;
      typeLabelColor: string;
    }
  > = {
    program: {
      background: "bg-sky-50",
      text: "text-branding-light",
      typeLabel: "Opleiding",
      typeLabelColor: "text-sky-900",
    },
    certificate: {
      background: "bg-orange-50",
      text: "text-branding-orange",
      typeLabel: "Diploma",
      typeLabelColor: "text-orange-900",
    },
    course: {
      background: "bg-blue-50",
      text: "text-branding-dark",
      typeLabel: "Cursus",
      typeLabelColor: "text-blue-900",
    },
  };

  const detail = details[type];

  return (
    <header
      className={clsx(
        "flex justify-between relative",
        "p-2 sm:p-4 pb-8 sm:pb-10",
        detail.background,
      )}
    >
      <div className="flex flex-col gap-y-2 w-full">
        <span
          className={clsx(
            "font-medium tracking-wide sm:text-xs/5 text-sm/5 uppercase -mb-1",
            detail.typeLabelColor,
          )}
        >
          {detail.typeLabel}
        </span>
        <ProgressCardTitle>
          <ColoredText> {program}</ColoredText>
        </ProgressCardTitle>
        <div className="flex gap-x-2 items-center">
          <ProgressCardDescriptiveBadge Icon={ArrowTrendingUpIcon}>
            {`Niveau ${degree}`}
          </ProgressCardDescriptiveBadge>

          <ProgressCardDescriptiveBadge Icon={BoatIcon}>
            {gearType}
          </ProgressCardDescriptiveBadge>
        </div>
      </div>
      <div className="flex items-center gap-x-4 shrink-0">
        <div
          className={clsx("shrink-0 h-8", detail.text)}
          style={{
            aspectRatio: `${watersportverbondGray.width} / ${watersportverbondGray.height}`,
            backgroundColor: "currentColor",
            mask: `url(${watersportverbondGray.src}) no-repeat center/contain`,
            WebkitMask: `url(${watersportverbondGray.src}) no-repeat center/contain`,
          }}
          aria-label="Watersportverbond"
        />
        <Logo className={clsx("size-14 shrink-0", detail.text)} />
      </div>
      <Wave offset={itemIndex * -30} spacing={3 * itemIndex} />
    </header>
  );
}

function ProgressCardDescriptiveBadge({
  Icon,
  children,
}: PropsWithChildren<{ Icon: React.ElementType }>) {
  const { type } = useProgressCard();

  const typeDetails: Record<CardType, { className: string }> = {
    program: {
      className: "text-branding-light",
    },
    certificate: {
      className: "text-branding-orange",
    },
    course: {
      className: "text-branding-dark",
    },
  };

  const { className } = typeDetails[type];

  return (
    <span
      className={clsx(
        "max-sm:col-span-2 row-start-1",
        "inline-flex items-center gap-x-2 px-3 py-1 rounded-full w-fit font-semibold tracking-wide sm:text-xs/5 text-sm/5 uppercase",
        "bg-white",
        className,
      )}
    >
      <Icon className="size-5" />
      {children}
    </span>
  );
}

export function ProgressCardTitle({ children }: PropsWithChildren) {
  return (
    <h3 className="flex max-sm:flex-col gap-x-3 max-sm:col-span-2 row-start-2 font-semibold text-zinc-950 text-xl">
      {children}
    </h3>
  );
}

export function ColoredText({ children }: PropsWithChildren) {
  const { type } = useProgressCard();
  return (
    <span
      className={clsx(
        type === "course" && "text-branding-dark",
        type === "program" && "text-branding-light",
        type === "certificate" && "text-branding-orange",
      )}
    >
      {children}
    </span>
  );
}

export function ProgressCardDegree({ children }: PropsWithChildren) {
  const { type } = useProgressCard();

  const colors: Record<CardType, string> = {
    program: "bg-branding-light/20 text-branding-light",
    certificate: "bg-branding-orange/20 text-branding-orange",
    course: "bg-branding-dark/20 text-branding-dark",
  };

  const color = colors[type];

  return (
    <span
      className={clsx(
        "flex flex-col justify-center items-center sm:row-span-2 max-sm:row-start-3 rounded-full size-16 sm:size-18",
        color,
      )}
    >
      <span className="text-[11px] font-semibold tracking-wider uppercase leading-none">
        Niveau
      </span>
      <span className="text-xl sm:text-2xl lg:text-3xl font-black leading-none mt-0.5">
        {children}
      </span>
    </span>
  );
}

export function ProgressCardDescriptionList({ children }: PropsWithChildren) {
  return <dl className="grid grid-cols-6 gap-x-4 gap-y-2">{children}</dl>;
}

export function ProgressCardDescriptionListItem({
  children,
  label,
  className,
}: PropsWithChildren<{
  label: string;
  className?: string;
}>) {
  return (
    <div className={clsx("flex flex-col gap-y-1 py-1", className)}>
      <dt className="text-zinc-500 lg:text-sm text-base">{label}</dt>
      <dd className="font-medium text-zinc-950 lg:text-sm text-base">
        {children}
      </dd>
    </div>
  );
}

export function ProgressCardBadge({ children }: PropsWithChildren) {
  const { type } = useProgressCard();

  const colors: Record<CardType, Parameters<typeof Badge>[0]["color"]> = {
    program: "branding-light",
    certificate: "branding-orange",
    course: "branding-dark",
  };

  const color = colors[type];

  return <Badge color={color}>{children}</Badge>;
}

export function ProgressCardDisclosures({ children }: PropsWithChildren) {
  const { type } = useProgressCard();

  const colors: Record<CardType, string> = {
    program: "divide-sky-200",
    certificate: "divide-orange-200",
    course: "divide-blue-200",
  };

  const color = colors[type];

  return <div className={clsx("divide-y px-2 sm:px-4", color)}>{children}</div>;
}

export function ProgressCardDisclosure({
  children,
  header,
  disabled,
}: PropsWithChildren<{ header: React.ReactNode; disabled?: boolean }>) {
  return (
    <Headless.Disclosure as="div">
      <Headless.DisclosureButton
        disabled={disabled}
        className={clsx(
          "group/progress-card-disclosure flex justify-between items-center gap-2 data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 py-2 sm:py-2.5 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] text-zinc-950 lg:text-sm text-base -mx-2 sm:-mx-4 px-2 sm:px-4",
        )}
      >
        <div className="flex items-center gap-2 font-medium">{header}</div>
        <ChevronDownIcon className="size-4 text-zinc-500 group-data-open/progress-card-disclosure:rotate-180 transition-transform" />
      </Headless.DisclosureButton>
      <Headless.DisclosurePanel className="pb-4">
        {children}
      </Headless.DisclosurePanel>
    </Headless.Disclosure>
  );
}

export function ProgressCardStatusList({ children }: PropsWithChildren) {
  const { type } = useProgressCard();

  const colors: Record<CardType, string> = {
    program: "divide-sky-100",
    certificate: "divide-orange-100",
    course: "divide-blue-100",
  };

  return (
    <ul className={clsx("lg:text-sm text-base divide-y", colors[type])}>
      {children}
    </ul>
  );
}

export function ProgressCardStatusSubList({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return <ul className={clsx("sm:pl-6", className)}>{children}</ul>;
}

export function ProgressCardStatusIcon({
  progress,
}: {
  progress: number;
}) {
  if (progress >= 100) {
    return <CheckCircleIcon className="size-5 text-green-500 flex-shrink-0" />;
  }

  if (progress > 0) {
    return <MinusCircleIcon className="size-5 text-yellow-500 flex-shrink-0" />;
  }

  return <CircleIcon className="size-5 text-zinc-500 flex-shrink-0" />;
}

export function ModuleDisclosure({
  children,
  module,
  progress,
}: PropsWithChildren<{
  module: Student.Curriculum.$schema.StudentCurriculum["curriculum"]["modules"][number];
  progress: number;
}>) {
  return (
    <Headless.Disclosure as="li">
      <Headless.DisclosureButton className="group/progress-card-status-disclosure relative data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] -mx-2 sm:-mx-4 px-2 sm:px-4">
        <span className="absolute inset-0 rounded-lg group-data-focus/progress-card-status-disclosure:outline-2 group-data-focus/progress-card-status-disclosure:outline-branding-light group-data-focus/progress-card-status-disclosure:outline-offset-2" />
        <div
          className={clsx(
            "flex max-sm:flex-col sm:justify-between sm:items-center py-2",
          )}
        >
          <div className="flex gap-x-2 items-center w-full">
            <div>
              <MinusIcon className="hidden group-data-open/progress-card-status-disclosure:block size-4 text-zinc-500" />
              <PlusIcon className="group-data-open/progress-card-status-disclosure:hidden block size-4 text-zinc-500" />
            </div>
            <ProgressCardStatusIcon progress={progress} />
            <div className="flex flex-1 justify-between gap-x-2">
              <span className="font-semibold">{module.title}</span>
              <span className="text-zinc-500">
                {moduleTypeLabel(module.type)}
              </span>
            </div>
          </div>
        </div>
      </Headless.DisclosureButton>
      <Headless.DisclosurePanel>{children}</Headless.DisclosurePanel>
    </Headless.Disclosure>
  );
}

export function Competency({
  competency,
  progress,
}: {
  competency: Student.Curriculum.$schema.StudentCurriculum["curriculum"]["modules"][number]["competencies"][number];
  progress: number;
}) {
  return (
    <div
      className={clsx(
        "flex max-sm:flex-col sm:justify-between sm:items-center py-2",
      )}
    >
      <div className="flex flex-col">
        <div className="flex gap-x-2 items-start">
          <ProgressCardStatusIcon progress={progress} />
          <span className="font-semibold leading-5">{competency.title}</span>
        </div>
        {competency.requirement && (
          <p className="text-zinc-500 pl-7 mt-0.5">{competency.requirement}</p>
        )}
      </div>
    </div>
  );
}

function Wave({
  offset = 0,
  spacing = 0,
}: { offset?: number; spacing?: number }) {
  const { type } = useProgressCard();

  const waveColors: Record<CardType, string> = {
    program: "text-branding-light",
    certificate: "text-branding-orange",
    course: "text-branding-dark",
  };

  const waveColor = waveColors[type];

  return (
    <div
      className={clsx(
        "absolute bottom-0 left-0 right-0 h-8 pointer-events-none z-0",
        waveColor,
      )}
    >
      <div className="absolute opacity-40 inset-0 flex">
        <Wave1
          className="absolute bottom-0"
          style={{
            animationName: "wave-reversed",
            animationDelay: `${offset + spacing}s`,
            animationDuration: "60s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave1
          className="absolute bottom-0 -translate-x-full"
          style={{
            animationName: "wave-reversed",
            animationDelay: `${offset + spacing}s`,
            animationDuration: "60s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
      <div className="absolute opacity-20 inset-0 flex">
        <Wave2
          className="absolute bottom-0"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 2}s`,
            animationDuration: "40s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave2
          className="absolute bottom-0 translate-x-full"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 2}s`,
            animationDuration: "40s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
      <div className="absolute text-white inset-0 flex">
        <Wave3
          className="absolute bottom-0"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 3}s`,
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
        <Wave3
          className="absolute bottom-0 translate-x-full"
          style={{
            animationName: "wave",
            animationDelay: `${offset + spacing * 3}s`,
            animationDuration: "100s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        />
      </div>
    </div>
  );
}

function Wave1(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="910"
      height="28"
      viewBox="0 0 910 28"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M18.9583 19.7058L0 22.4286V55H18.9583H113.75H227.5H341.25H455H568.75H682.5H796.25H891.042H910V26.5V22.5C910 22.5 868 26.5 844.5 28.5C796.638 32.5734 730.455 37.3299 682.5 30.5714C664.983 28.1027 647.467 22.104 629.95 16.1053C609.55 9.11908 589.15 2.13292 568.75 0.72277C543.461 -1.09321 518.172 5.54649 492.883 12.1862C480.256 15.5017 467.628 18.8172 455 21.0799C417.083 27.7723 379.167 25.2277 341.25 19.7058C328.571 17.8934 315.893 15.7766 303.214 13.6598C277.976 9.44611 252.738 5.23242 227.5 3.42009C189.583 0.79911 151.667 3.34375 113.75 7.49152C81.9259 10.8447 50.1018 15.3271 29.487 18.2307C25.5404 18.7866 22.0046 19.2846 18.9583 19.7058Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Wave2(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="1066"
      height="30"
      viewBox="0 0 1066 30"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 5C90 -6 179.207 5.25907 266.5 10.2202C310.917 12.8425 355.333 20.685 399.75 25.9052C444.167 31.2234 488.583 33.6742 533 27.2286C577.417 20.685 621.833 5 666.25 7.62234C710.667 10.1467 755.083 31.2234 799.5 36.37C843.917 41.5167 888.333 31.2234 932.75 23.3073C977.167 15.5383 1021.58 10.1467 1043.79 7.62234L1066 5V59.8976H1043.79C1021.58 59.8976 977.167 59.8976 932.75 59.8976C888.333 59.8976 843.917 59.8976 799.5 59.8976C755.083 59.8976 710.667 59.8976 666.25 59.8976C621.833 59.8976 577.417 59.8976 533 59.8976C488.583 59.8976 444.167 59.8976 399.75 59.8976C355.333 59.8976 310.917 59.8976 266.5 59.8976C222.083 59.8976 177.667 59.8976 133.25 59.8976C88.8333 59.8976 44.417 59.8976 22.208 59.8976H0V5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function Wave3(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="869"
      height="25"
      viewBox="0 0 869 25"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M0 1.99998C67.8123 -2.88737 148.729 2.3874 217.25 6.56427C253.458 8.85712 289.667 15.7143 325.875 20.2786C362.083 24.9286 398.292 27.0714 434.5 21.4357C470.708 15.7143 506.917 1.99998 543.125 4.29284C579.333 6.49998 615.542 24.9286 651.75 29.4286C687.958 33.9286 724.167 24.9286 760.375 18.0071C796.583 11.2143 832.792 6.49998 850.896 4.29284L869 1.99998V50H850.896C832.792 50 796.583 50 760.375 50C724.167 50 687.958 50 651.75 50C615.542 50 579.333 50 543.125 50C506.917 50 470.708 50 434.5 50C398.292 50 362.083 50 325.875 50C289.667 50 253.458 50 217.25 50C181.042 50 144.833 50 108.625 50C72.4167 50 36.2083 50 18.1042 50H0V1.99998Z"
        fill="currentColor"
      />
    </svg>
  );
}
