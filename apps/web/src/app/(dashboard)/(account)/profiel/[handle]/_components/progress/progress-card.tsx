"use client";
import * as Headless from "@headlessui/react";
import {
  ChevronDownIcon,
  MapPinIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";
import {
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";
import type { Student } from "@nawadi/core";
import clsx from "clsx";
import dayjs from "dayjs";
import type React from "react";
import { type PropsWithChildren, createContext, useContext } from "react";
import Balancer from "react-wrap-balancer";
import { Badge } from "~/app/(dashboard)/_components/badge";
import { Button } from "~/app/(dashboard)/_components/button";
import { BoatIcon } from "~/app/(dashboard)/_components/icons/boat-icon";
import { CircleIcon } from "~/app/(dashboard)/_components/icons/circle-icon";
import { MedailIcon } from "~/app/(dashboard)/_components/icons/medail-icon";
import { TextLink } from "~/app/(dashboard)/_components/text";
import { Logo } from "~/app/_assets/logo";
import watersportverbondGray from "~/app/_assets/watersportverbond-white.png";
import { AnimatedWave } from "~/app/_components/animated-wave";
import { moduleTypeLabel } from "~/utils/labels";

export type CardType = "course" | "program" | "certificate";

interface ProgressCardContextType<T extends object | null> {
  type: CardType;
  data: T;
}

const ProgressCardContext = createContext<
  ProgressCardContextType<object | null> | undefined
>(undefined);

export function ProgressCardProvider({
  children,
  type,
  data,
}: {
  children: React.ReactNode;
  type: CardType;
  data: object | null;
}) {
  return (
    <ProgressCardContext.Provider value={{ type, data }}>
      {children}
    </ProgressCardContext.Provider>
  );
}

export function useProgressCard<T extends object = object>() {
  const context = useContext(ProgressCardContext);
  if (context === undefined) {
    throw new Error(
      "useProgressCard must be used within a ProgressCardProvider",
    );
  }
  return context as ProgressCardContextType<T>;
}

export function ProgressCard({
  children,
  type,
  data,
}: PropsWithChildren<{
  type: CardType;
  data: object;
}>) {
  const styles: Record<
    CardType,
    {
      borderColor: string;
    }
  > = {
    program: {
      borderColor: "border-sky-200",
    },
    certificate: {
      borderColor: "border-orange-200",
    },
    course: {
      borderColor: "border-blue-200",
    },
  };

  const style = styles[type];

  return (
    <ProgressCardProvider type={type} data={data}>
      <article
        className={clsx(
          "relative pb-2 border rounded-md overflow-hidden",
          style.borderColor,
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
  actionButton,
}: {
  degree: React.ReactNode;
  program: React.ReactNode;
  gearType: React.ReactNode;
  actionButton?: React.ReactNode;
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
      waveColor: string;
    }
  > = {
    program: {
      background: "bg-sky-50/50",
      text: "text-branding-light",
      typeLabel: "Opleiding",
      typeLabelColor: "text-sky-900",
      waveColor: "text-branding-light",
    },
    certificate: {
      background: "bg-orange-50/50",
      text: "text-branding-orange",
      typeLabel: "Diploma",
      typeLabelColor: "text-orange-900",
      waveColor: "text-branding-orange",
    },
    course: {
      background: "bg-blue-50/50",
      text: "text-branding-dark",
      typeLabel: "Cursus",
      typeLabelColor: "text-blue-900",
      waveColor: "text-branding-dark",
    },
  };

  const detail = details[type];

  return (
    <header
      className={clsx(
        "relative flex justify-between items-center sm:items-start",
        "p-2 sm:p-4 pb-8 sm:pb-10",
        detail.background,
      )}
    >
      <div className="flex flex-col gap-y-2 w-full">
        <span
          className={clsx(
            "-mb-1 font-medium sm:text-xs/5 text-sm/5 uppercase tracking-wide",
            detail.typeLabelColor,
          )}
        >
          {detail.typeLabel}
        </span>
        <ProgressCardTitle>
          <ColoredText> {program}</ColoredText>
        </ProgressCardTitle>
        <div className="flex sm:flex-row flex-col sm:items-center gap-2">
          <ProgressCardDescriptiveBadge Icon={ArrowTrendingUpIcon}>
            {`Niveau ${degree}`}
          </ProgressCardDescriptiveBadge>

          <ProgressCardDescriptiveBadge Icon={BoatIcon}>
            {gearType}
          </ProgressCardDescriptiveBadge>
        </div>
      </div>
      <div className="flex sm:flex-row flex-col items-end sm:items-center gap-x-4 gap-y-2 shrink-0">
        <div
          className={clsx("h-8 shrink-0", detail.text)}
          style={{
            aspectRatio: `${watersportverbondGray.width} / ${watersportverbondGray.height}`,
            backgroundColor: "currentColor",
            mask: `url(${watersportverbondGray.src}) no-repeat center/contain`,
            WebkitMask: `url(${watersportverbondGray.src}) no-repeat center/contain`,
          }}
          aria-label="Watersportverbond"
        />
        <Logo className={clsx("size-14 shrink-0", detail.text)} />
        {actionButton}
      </div>
      <AnimatedWave
        offset={itemIndex * -30}
        spacing={3 * itemIndex}
        textColorClassName={detail.waveColor}
      />
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
      <span className="font-semibold text-[11px] uppercase leading-none tracking-wider">
        Niveau
      </span>
      <span className="mt-0.5 font-black text-xl sm:text-2xl lg:text-3xl leading-none">
        {children}
      </span>
    </span>
  );
}

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
      label: string;
      heading: string;
      buttonColor: Parameters<typeof Button>[0]["color"];
      iconClassName: string;
      headingClassName: string;
      textClassName: string;
      waveColor: string;
    }
  > = {
    program: {
      cardClassName: "bg-sky-50/50 border-sky-200",
      iconBackgroundClassName: "bg-sky-100",
      Icon: AcademicCapIcon,
      label: "opleiding",
      heading:
        "Je bent nog geen opleiding gestart... Maar dat kan snel veranderen!",
      buttonColor: "branding-light",
      iconClassName: "text-sky-600",
      headingClassName: "text-sky-950",
      textClassName: "text-sky-950/60",
      waveColor: "text-branding-light",
    },
    certificate: {
      cardClassName: "bg-orange-50/50 border-orange-200",
      iconBackgroundClassName: "bg-orange-100",
      Icon: MedailIcon,
      label: "diploma",
      heading:
        "Je hebt nog geen diploma behaald... Maar dat kan snel veranderen!",
      buttonColor: "branding-orange",
      iconClassName: "text-orange-600",
      headingClassName: "text-orange-950",
      textClassName: "text-orange-950/60",
      waveColor: "text-branding-orange",
    },
    course: {
      cardClassName: "bg-blue-50/50 border-blue-200",
      iconBackgroundClassName: "bg-blue-100",
      Icon: BoatIcon,
      label: "cursus",
      heading: "Je volgt geen actieve cursus... Maar dat kan snel veranderen!",
      buttonColor: "branding-dark",
      iconClassName: "text-blue-600",
      headingClassName: "text-blue-950",
      textClassName: "text-blue-950/60",
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

          <Button
            href="/vaarlocaties"
            color={style.buttonColor}
            className="my-6"
            target="_blank"
          >
            <MapPinIcon className="w-4 h-4" />
            Vind een NWD-erkende locatie
          </Button>

          <p className={clsx("sm:text-sm/6 text-base/6", style.textClassName)}>
            Denk je dat er een {style.label} ontbreekt?{" "}
            <TextLink
              href="/help/artikel/nwd-diplomas-opleidingen-en-cursussen-in-jouw-profiel"
              target="_blank"
            >
              <ColoredText>Bezoek onze hulppagina.</ColoredText>
            </TextLink>
          </p>
        </div>
        <AnimatedWave textColorClassName={style.waveColor} />
      </article>
    </ProgressCardProvider>
  );
}

export function ProgressCardDescriptionList({ children }: PropsWithChildren) {
  return <dl className="gap-x-4 gap-y-2 grid grid-cols-6">{children}</dl>;
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

  return <div className={clsx("px-2 sm:px-4 divide-y", color)}>{children}</div>;
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
          "group/progress-card-disclosure flex justify-between items-center gap-2 data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 -mx-2 sm:-mx-4 px-2 sm:px-4 py-2 sm:py-2.5 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)] text-zinc-950 lg:text-sm text-base",
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
    <ul className={clsx("divide-y lg:text-sm text-base", colors[type])}>
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
  return <ul className={clsx("pl-6", className)}>{children}</ul>;
}

export function ProgressCardStatusIcon({
  progress,
}: {
  progress: number;
}) {
  if (progress >= 100) {
    return <CheckCircleIcon className="flex-shrink-0 size-5 text-green-500" />;
  }

  if (progress > 0) {
    return <MinusCircleIcon className="flex-shrink-0 size-5 text-yellow-500" />;
  }

  return <CircleIcon className="flex-shrink-0 size-5 text-zinc-500" />;
}

export function ModuleDisclosure({
  children,
  module,
  progress,
  certificate,
}: PropsWithChildren<{
  module: Student.Curriculum.$schema.StudentCurriculum["curriculum"]["modules"][number];
  progress: number;
  certificate?: {
    id: string;
    handle: string;
    issuedAt: string;
    location: {
      id: string;
      handle: string;
      name: string | null;
    };
  };
}>) {
  return (
    <Headless.Disclosure as="li">
      <Headless.DisclosureButton className="group/progress-card-status-disclosure relative data-active:bg-zinc-100 data-hover:bg-zinc-50 data-disabled:opacity-50 -mx-2 sm:-mx-4 px-2 sm:px-4 focus:outline-none w-[calc(100%+1rem)] sm:w-[calc(100%+2rem)]">
        <span className="absolute inset-0 rounded-lg group-data-focus/progress-card-status-disclosure:outline-2 group-data-focus/progress-card-status-disclosure:outline-branding-light group-data-focus/progress-card-status-disclosure:outline-offset-2" />
        <div
          className={clsx(
            "flex max-sm:flex-col sm:justify-between sm:items-center py-2",
          )}
        >
          <div className="flex items-center gap-x-2 w-full">
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
      <Headless.DisclosurePanel>
        {certificate ? (
          <div className="mb-2 pl-13">
            <ProgressCardDescriptionList>
              <ProgressCardDescriptionListItem
                label="Diplomanummer"
                className="col-span-full sm:col-span-2"
              >
                {certificate.handle}
              </ProgressCardDescriptionListItem>
              <ProgressCardDescriptionListItem
                label="Datum van afgifte"
                className="col-span-full sm:col-span-2"
              >
                {dayjs(certificate.issuedAt).format("DD-MM-YYYY")}
              </ProgressCardDescriptionListItem>
              <ProgressCardDescriptionListItem
                label="Vaarlocatie van afgifte"
                className="col-span-full sm:col-span-2"
              >
                {certificate.location.name ?? "Onbekend"}
              </ProgressCardDescriptionListItem>
            </ProgressCardDescriptionList>
          </div>
        ) : undefined}
        {children}
      </Headless.DisclosurePanel>
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
        <div className="flex items-start gap-x-2">
          <ProgressCardStatusIcon progress={progress} />
          <span className="font-semibold leading-5">{competency.title}</span>
        </div>
        {competency.requirement && (
          <p className="mt-0.5 pl-7 text-zinc-500 text-justify">
            {competency.requirement}
          </p>
        )}
      </div>
    </div>
  );
}
