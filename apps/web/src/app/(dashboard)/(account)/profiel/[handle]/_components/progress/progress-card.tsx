"use client";
import * as Headless from "@headlessui/react";
import {
  ChevronDownIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";
import {
  AcademicCapIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import Image from "next/image";
import type React from "react";
import { type PropsWithChildren, createContext, useContext } from "react";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { BoatIcon } from "~/app/(dashboard)/_components/icons/boat-icon";
import { CircleIcon } from "~/app/(dashboard)/_components/icons/circle-icon";
import { MedailIcon } from "~/app/(dashboard)/_components/icons/medail-icon";
import { Logo } from "~/app/_assets/logo";
import watersportverbondGray from "~/app/_assets/watersportverbond-gray.png";
import dayjs from "~/lib/dayjs";

type CardType = "cursus" | "opleiding" | "diploma";

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
  return (
    <ProgressCardProvider type={type}>
      <article className="relative pt-4 border border-zinc-200 rounded-md">
        {children}
      </article>
    </ProgressCardProvider>
  );
}

export function ProgressCardHeader({ children }: PropsWithChildren) {
  return (
    <header className="items-center gap-2 grid grid-cols-[1fr_fit-content(--spacing(15))] grid-rows-[fit-content(--spacing(15))_1fr] mb-4 px-4">
      {children}
    </header>
  );
}

export function ProgressCardTypeBadge() {
  const { type } = useProgressCard();

  const Icon =
    type === "opleiding"
      ? AcademicCapIcon
      : type === "diploma"
        ? MedailIcon
        : BoatIcon;
  const text =
    type === "opleiding"
      ? "Opleiding"
      : type === "diploma"
        ? "Diploma"
        : "Cursus";

  return (
    <span
      className={clsx(
        "max-sm:self-end row-start-1",
        "inline-flex items-center gap-x-2 px-3 py-1 rounded-full w-fit font-semibold sm:text-xs/5 text-sm/5 uppercase",
        "bg-zinc-600/10 text-zinc-700 group-data-hover:bg-zinc-600/20 dark:bg-white/5 dark:text-zinc-400 dark:group-data-hover:bg-white/10",
      )}
    >
      <Icon
        className={clsx(
          "size-5",
          type === "opleiding" && "text-branding-light",
          type === "diploma" && "text-branding-orange",
          type === "cursus" && "text-branding-dark",
        )}
      />
      {text}
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

export function ProgressCardTitleColored({ children }: PropsWithChildren) {
  const { type } = useProgressCard();
  return (
    <span
      className={clsx(
        type === "cursus" && "text-branding-dark",
        type === "opleiding" && "text-branding-light",
        type === "diploma" && "text-branding-orange",
      )}
    >
      {children}
    </span>
  );
}

export function ProgressCardDegree({ children }: PropsWithChildren) {
  const { type } = useProgressCard();
  return (
    <span
      className={clsx(
        "flex justify-center items-center sm:row-span-2 rounded-full size-15 font-black text-3xl",
        type === "cursus" && "bg-branding-dark/20 text-branding-dark",
        type === "opleiding" && "bg-branding-light/20 text-branding-light",
        type === "diploma" && "bg-branding-orange/20 text-branding-orange",
      )}
    >
      {children}
    </span>
  );
}

export function ProgressCardDescriptionList({ children }: PropsWithChildren) {
  return <dl className="flex max-sm:flex-col mb-4 px-4">{children}</dl>;
}

export function ProgressCardDescriptionListItem({
  children,
  label,
}: PropsWithChildren<{ label: string }>) {
  return (
    <div className="flex flex-col flex-1 gap-2 px-2 py-1 border border-zinc-200 max-sm:not-first:border-t-0 sm:not-first:border-l-0 border-dashed">
      <dt className="text-zinc-500 lg:text-sm text-base">{label}</dt>
      <dd className="font-medium text-zinc-950 lg:text-sm text-base">
        {children}
      </dd>
    </div>
  );
}

export function ProgressCardBadge({ children }: PropsWithChildren) {
  const { type } = useProgressCard();
  return (
    <span
      className={clsx(
        "px-2.5 py-0.5 rounded-full font-normal text-zinc-700 text-xs",
        type === "opleiding" && "bg-branding-light/10",
        type === "diploma" && "bg-branding-orange/10",
        type === "cursus" && "bg-branding-dark/10",
      )}
    >
      {children}
    </span>
  );
}

export function ProgressCardDisclosure({
  children,
  header,
  disabled,
}: PropsWithChildren<{ header: React.ReactNode; disabled?: boolean }>) {
  return (
    <Headless.Disclosure>
      <Headless.DisclosureButton
        disabled={disabled}
        className="group/progress-card-disclosure relative flex justify-between items-center gap-2 data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 px-4 py-4 border-zinc-200 border-t last:rounded-b-md focus:outline-none w-full text-zinc-950 lg:text-sm text-base"
      >
        <span className="absolute inset-0 mx-2 rounded-lg group-data-focus/progress-card-disclosure:outline-2 group-data-focus/progress-card-disclosure:outline-branding-light group-data-focus/progress-card-disclosure:outline-offset-2" />
        <div className="flex items-center gap-2 font-medium">{header}</div>
        <ChevronDownIcon className="size-4 text-zinc-500 group-data-open/progress-card-disclosure:rotate-180 transition-transform" />
      </Headless.DisclosureButton>
      <Headless.DisclosurePanel className="px-4">
        {children}
      </Headless.DisclosurePanel>
    </Headless.Disclosure>
  );
}

export function ProgressCardStatusList({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return (
    <ul className={clsx("lg:text-sm text-base", className)}>{children}</ul>
  );
}

export function ProgressCardStatusSubList({
  children,
  className,
}: PropsWithChildren<{
  className?: string;
}>) {
  return <ul className={clsx("sm:pl-13", className)}>{children}</ul>;
}

export function ProgressCardStatusIcon({
  progress,
}: {
  progress: number;
}) {
  return progress >= 100 ? (
    <CheckCircleIcon className="size-5 text-green-500" />
  ) : progress > 0 ? (
    <MinusCircleIcon className="size-5 text-yellow-500" />
  ) : (
    <CircleIcon className="size-5 text-zinc-500" />
  );
}

export function ProgressCardStatus({
  children,
  progress,
  title,
  subtitle,
  updatedAt,
  icon,
}: (
  | PropsWithChildren
  | {
      children?: never;
    }
) & {
  progress: number;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  updatedAt?: string;
  icon?: React.ReactNode;
}) {
  const status = (
    <div
      className={clsx(
        "flex max-sm:flex-col sm:justify-between sm:items-center py-2",
      )}
    >
      <div
        className={clsx(
          "flex gap-2",
          subtitle ? "items-start" : "items-center",
        )}
      >
        {children ? (
          <Button plain className="-m-2">
            <MinusIcon className="hidden group-data-open/progress-card-status-disclosure:block size-4 text-zinc-500" />
            <PlusIcon className="group-data-open/progress-card-status-disclosure:hidden block size-4 text-zinc-500" />
          </Button>
        ) : null}
        {icon ?? <ProgressCardStatusIcon progress={progress} />}
        <div className="flex flex-col">
          <span className="font-semibold">{title}</span>
          {subtitle && <span className="text-zinc-500">{subtitle}</span>}
        </div>
      </div>
      <Badge
        color={progress >= 100 ? "green" : progress > 0 ? "yellow" : "zinc"}
        className={clsx(!children && "max-sm:ml-6", "w-fit")}
      >
        {progress >= 100
          ? `Behaald ${updatedAt ? `op ${dayjs(updatedAt).format("DD-MM-YYYY")}` : ""}`
          : updatedAt
            ? `Laatst bijgewerkt op ${dayjs(updatedAt).format("DD-MM-YYYY")}`
            : "Nog niet behaald"}
      </Badge>
    </div>
  );

  return children ? (
    <Headless.Disclosure as="li">
      <Divider />

      <Headless.DisclosureButton className="group/progress-card-status-disclosure relative data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 focus:outline-none w-full">
        <span className="absolute inset-0 rounded-lg group-data-focus/progress-card-status-disclosure:outline-2 group-data-focus/progress-card-status-disclosure:outline-branding-light group-data-focus/progress-card-status-disclosure:outline-offset-2" />
        {status}
      </Headless.DisclosureButton>
      <Headless.DisclosurePanel>{children}</Headless.DisclosurePanel>
    </Headless.Disclosure>
  ) : (
    status
  );
}

export function ProgressCardFooter({
  children,
  waveOffset,
  waveSpacing,
}: PropsWithChildren<{ waveOffset?: number; waveSpacing?: number }>) {
  return (
    <footer className="group/progress-card-footer peer/progress-card-footer relative flex justify-between bg-neutral-100 px-4 py-2 border-zinc-200 border-t last:rounded-b-md overflow-hidden">
      <Wave offset={waveOffset} spacing={waveSpacing} />
      <div className="z-10 flex items-center gap-2">
        <Logo className="size-8 text-zinc-500" />
        <Image
          src={watersportverbondGray}
          className="w-auto h-8"
          alt="Watersportverbond"
        />
      </div>
      <div className="flex gap-2">{children}</div>
    </footer>
  );
}

function Wave({
  className,
  offset = 0,
  spacing = 0,
}: { className?: string; offset?: number; spacing?: number }) {
  const { type } = useProgressCard();

  const waveColor =
    type === "opleiding"
      ? "text-branding-light"
      : type === "diploma"
        ? "text-branding-orange"
        : "text-branding-dark";

  return (
    <div
      className={clsx(
        "absolute inset-0 opacity-40 overflow-hidden",
        className,
        waveColor,
      )}
    >
      <div className="absolute inset-0 flex">
        <Wave1
          className="absolute opacity-20 animate-wave-fast"
          style={{ animationDelay: `${offset + spacing}s` }}
        />
        <Wave1
          className="absolute opacity-20 translate-x-full animate-wave-fast"
          style={{ animationDelay: `${offset + spacing}s` }}
        />
      </div>
      <div className="absolute inset-0 flex">
        <Wave2
          className="absolute opacity-25 animate-wave-medium"
          style={{ animationDelay: `${offset + spacing * 2}s` }}
        />
        <Wave2
          className="absolute opacity-25 translate-x-full animate-wave-medium"
          style={{ animationDelay: `${offset + spacing * 2}s` }}
        />
      </div>
      <div className="absolute inset-0 flex">
        <Wave3
          className="absolute opacity-30 animate-wave-slow"
          style={{ animationDelay: `${offset + spacing * 3}s` }}
        />
        <Wave3
          className="absolute opacity-30 translate-x-full animate-wave-slow"
          style={{ animationDelay: `${offset + spacing * 3}s` }}
        />
      </div>
    </div>
  );
}

function Wave1(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      width="910"
      height="55"
      viewBox="0 0 910 55"
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
      height="60"
      viewBox="0 0 1066 60"
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
      height="50"
      viewBox="0 0 869 50"
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
