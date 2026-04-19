"use client";

import type {
  OutlineSection,
  OutlineSectionFilledBy,
  OutlineSectionKind,
  OutlineTemplate,
} from "../types";
import { richtingLabel } from "../types";

type Props = {
  outline: OutlineTemplate;
  onContinue: () => void;
  onBack: () => void;
  disabled?: boolean;
};

const KIND_LABEL: Record<OutlineSectionKind, string> = {
  voorwoord: "Voorwoord",
  zeil_cv: "Zeil-CV",
  inleiding: "Inleiding",
  context: "Context",
  pvb_werkproces: "PvB-werkproces",
  reflectie: "Reflectie",
  bijlagen: "Bijlagen",
  other: "Overig",
};

const FILLED_BY_BADGE: Record<
  OutlineSectionFilledBy,
  { label: string; className: string }
> = {
  user: {
    label: "Jij schrijft",
    className: "bg-amber-100 text-amber-900 border-amber-300",
  },
  ai: {
    label: "AI schrijft",
    className: "bg-blue-100 text-blue-900 border-blue-300",
  },
  rubric_driven: {
    label: "Uit de rubriek",
    className: "bg-slate-100 text-slate-800 border-slate-300",
  },
};

function formatWordRange(min: number | null, max: number | null): string {
  if (min === null && max === null) return "";
  if (min !== null && max !== null) return `~${min}–${max} woorden`;
  if (min !== null) return `≥ ${min} woorden`;
  if (max !== null) return `≤ ${max} woorden`;
  return "";
}

export function OutlinePreview({
  outline,
  onContinue,
  onBack,
  disabled,
}: Props) {
  const userSections = outline.sections.filter(
    (s) => s.filledBy === "user",
  ).length;
  const aiSections = outline.sections.filter((s) => s.filledBy === "ai").length;

  // Estimate total length bands (only for sections with both min and max)
  const totalMin = outline.sections
    .map((s) => s.targetWordCountMin ?? 0)
    .reduce((a, b) => a + b, 0);
  const totalMax = outline.sections
    .map((s) => s.targetWordCountMax ?? 0)
    .reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Stap 1 van 3 · Structuur
        </p>
        <h2 className="mt-1 text-xl font-bold text-slate-900">
          Zo wordt jouw {outline.profielTitel} portfolio opgebouwd
        </h2>
        <p className="mt-2 text-sm text-slate-700">
          Hieronder zie je de volledige structuur voor een{" "}
          {richtingLabel(outline.richting).toLowerCase()} niveau{" "}
          {outline.niveauRang} portfolio. {aiSections} van de{" "}
          {outline.sections.length} secties wordt straks automatisch gegenereerd
          op basis van jouw antwoorden, {userSections} secties schrijf je zelf
          (voorwoord, CV, reflectie, bijlagen). Totale richtlengte: circa{" "}
          {totalMin.toLocaleString("nl-NL")}–{totalMax.toLocaleString("nl-NL")}{" "}
          woorden.
        </p>
      </div>

      <ol className="flex flex-col gap-3">
        {outline.sections.map((section) => (
          <OutlineSectionRow key={section.ordinal} section={section} />
        ))}
      </ol>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onContinue}
          disabled={disabled}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Door naar de vragen
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          Ander profiel kiezen
        </button>
      </div>
    </div>
  );
}

function OutlineSectionRow({ section }: { section: OutlineSection }) {
  const badge = FILLED_BY_BADGE[section.filledBy];
  const range = formatWordRange(
    section.targetWordCountMin,
    section.targetWordCountMax,
  );
  return (
    <li className="flex flex-col gap-1.5 rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
          {section.ordinal + 1}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${badge.className}`}
        >
          {badge.label}
        </span>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {KIND_LABEL[section.kind]}
        </span>
        {range ? (
          <span className="text-xs text-slate-500">· {range}</span>
        ) : null}
      </div>
      <h3 className="text-base font-semibold text-slate-900">
        {section.title}
      </h3>
      <p className="text-sm text-slate-700">{section.description}</p>
    </li>
  );
}
