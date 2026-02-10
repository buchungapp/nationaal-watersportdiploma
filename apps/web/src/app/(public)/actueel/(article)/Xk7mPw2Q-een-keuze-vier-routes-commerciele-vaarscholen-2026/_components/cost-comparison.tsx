"use client";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";

// ---------------------------------------------------------------------------
// Category data (7 tiers matching Academy cat 1-7 / CWO Mini - cat 5)
// ---------------------------------------------------------------------------

interface CategoryData {
  label: string;
  valueText: string;
  tickLabel: string;
  sectionLabel: string;
  /** [NWD, Academy, KSS+CWO, CWO] */
  annual: [number, number, number, number];
  disclosure: {
    contribution: [string, string, string, string];
    kssLicense: [string, string, string, string];
    knwvMembership: [string, string, string, string];
    marketing: [string, string, string, string];
    totalAnnual: [string, string, string, string];
  };
  footnote: string;
  disclosureNote: string;
}

const CWO_DISCLAIMER =
  "(HISWA/KNWV-lidtarief 2025). CWO-tarieven 2026 zijn op het moment van schrijven nog niet openbaar beschikbaar.";

const NWD_NOTE_LOW =
  "Vanaf 150 diploma\u2019s per jaar gaan we uit van het hogere NWD-tarief (contributie \u20AC1.000). Bij een omzet uit zeilcursussen/-kampen onder \u20AC100.000 (excl. btw) is de contributie \u20AC650.";

const NWD_NOTE_HIGH =
  "NWD-contributie is \u20AC650 bij omzet uit zeilcursussen/-kampen onder \u20AC100.000 (excl. btw).";

const CATEGORIES: CategoryData[] = [
  {
    label: "1\u201330 diploma\u2019s per jaar",
    valueText: "1 tot 30 diploma\u2019s per jaar",
    tickLabel: "1-30",
    sectionLabel: "Kosten (o.b.v. 1\u201330 diploma\u2019s/jaar)",
    annual: [1_600, 195, 482, 189],
    disclosure: {
      contribution: ["\u20AC650", "\u20AC195", "\u20AC189", "\u20AC189"],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC293", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: ["\u20AC1.600", "\u20AC195", "\u20AC482", "\u20AC189"],
    },
    footnote: `Academy categorie 1, CWO categorie Mini ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_LOW,
  },
  {
    label: "30\u201360 diploma\u2019s per jaar",
    valueText: "30 tot 60 diploma\u2019s per jaar",
    tickLabel: "30-60",
    sectionLabel: "Kosten (o.b.v. 30\u201360 diploma\u2019s/jaar)",
    annual: [1_600, 325, 802, 314],
    disclosure: {
      contribution: ["\u20AC650", "\u20AC325", "\u20AC314", "\u20AC314"],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC488", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: ["\u20AC1.600", "\u20AC325", "\u20AC802", "\u20AC314"],
    },
    footnote: `Academy categorie 2, CWO categorie 0 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_LOW,
  },
  {
    label: "60\u2013150 diploma\u2019s per jaar",
    valueText: "60 tot 150 diploma\u2019s per jaar",
    tickLabel: "60-150",
    sectionLabel: "Kosten (o.b.v. 60\u2013150 diploma\u2019s/jaar)",
    annual: [1_600, 450, 1_114, 439],
    disclosure: {
      contribution: ["\u20AC650", "\u20AC450", "\u20AC439", "\u20AC439"],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC675", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: ["\u20AC1.600", "\u20AC450", "\u20AC1.114", "\u20AC439"],
    },
    footnote: `Academy categorie 3, CWO categorie 1 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_LOW,
  },
  {
    label: "150\u2013300 diploma\u2019s per jaar",
    valueText: "150 tot 300 diploma\u2019s per jaar",
    tickLabel: "150-300",
    sectionLabel: "Kosten (o.b.v. 150\u2013300 diploma\u2019s/jaar)",
    annual: [1_950, 900, 2_230, 880],
    disclosure: {
      contribution: ["\u20AC1.000", "\u20AC900", "\u20AC880", "\u20AC880"],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC1.350", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: ["\u20AC1.950", "\u20AC900", "\u20AC2.230", "\u20AC880"],
    },
    footnote: `Academy categorie 4, CWO categorie 2 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_HIGH,
  },
  {
    label: "300\u2013500 diploma\u2019s per jaar",
    valueText: "300 tot 500 diploma\u2019s per jaar",
    tickLabel: "300-500",
    sectionLabel: "Kosten (o.b.v. 300\u2013500 diploma\u2019s/jaar)",
    annual: [1_950, 1_500, 3_695, 1_445],
    disclosure: {
      contribution: [
        "\u20AC1.000",
        "\u20AC1.500",
        "\u20AC1.445",
        "\u20AC1.445",
      ],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC2.250", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: [
        "\u20AC1.950",
        "\u20AC1.500",
        "\u20AC3.695",
        "\u20AC1.445",
      ],
    },
    footnote: `Academy categorie 5, CWO categorie 3 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_HIGH,
  },
  {
    label: "500\u2013750 diploma\u2019s per jaar",
    valueText: "500 tot 750 diploma\u2019s per jaar",
    tickLabel: "500-750",
    sectionLabel: "Kosten (o.b.v. 500\u2013750 diploma\u2019s/jaar)",
    annual: [1_950, 1_950, 4_810, 1_885],
    disclosure: {
      contribution: [
        "\u20AC1.000",
        "\u20AC1.950",
        "\u20AC1.885",
        "\u20AC1.885",
      ],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC2.925", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: [
        "\u20AC1.950",
        "\u20AC1.950",
        "\u20AC4.810",
        "\u20AC1.885",
      ],
    },
    footnote: `Academy categorie 6, CWO categorie 4 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_HIGH,
  },
  {
    label: "Meer dan 750 diploma\u2019s per jaar",
    valueText: "meer dan 750 diploma\u2019s per jaar",
    tickLabel: "750+",
    sectionLabel: "Kosten (o.b.v. >750 diploma\u2019s/jaar)",
    annual: [1_950, 2_950, 7_314, 2_889],
    disclosure: {
      contribution: [
        "\u20AC1.000",
        "\u20AC2.950",
        "\u20AC2.889",
        "\u20AC2.889",
      ],
      kssLicense: ["inbegrepen", "inbegrepen", "\u20AC4.425", "\u2014"],
      knwvMembership: ["\u20AC450", "inbegrepen", "\u2014", "\u2014"],
      marketing: ["\u20AC500", "\u2014", "\u2014", "\u2014"],
      totalAnnual: [
        "\u20AC1.950",
        "\u20AC2.950",
        "\u20AC7.314",
        "\u20AC2.889",
      ],
    },
    footnote: `Academy categorie 7, CWO categorie 5 ${CWO_DISCLAIMER}`,
    disclosureNote: NWD_NOTE_HIGH,
  },
];

// ---------------------------------------------------------------------------
// Shared data (identical across all categories)
// ---------------------------------------------------------------------------

const SHARED = {
  oneTime: [2_000, 795, 544, 214] as [number, number, number, number],
  perDiploma: ["\u20AC3,35", "\u20AC3,65", "\u20AC3,55", "\u20AC3,55"] as [
    string,
    string,
    string,
    string,
  ],
  disclosure: {
    oneTime: {
      intake: ["\u20AC750", "\u20AC750", "\u20AC330 + \u20AC214", "\u20AC214"],
      investment: ["\u20AC1.250", "\u2014", "\u2014", "\u2014"],
      onboarding: ["inbegrepen", "\u20AC45 (vlag)", "\u2014", "\u2014"],
      totalOneTime: ["\u20AC2.000", "\u20AC795", "\u20AC544", "\u20AC214"],
    },
    perDiploma: {
      digital: ["\u20AC3,00", "\u20AC3,25", "\u20AC3,15", "\u20AC3,15"],
      printed: ["\u20AC0,35", "\u20AC0,40", "\u20AC0,40", "\u20AC0,40"],
      totalPerDiploma: [
        "\u20AC3,35",
        "\u20AC3,65",
        "\u20AC3,55",
        "\u20AC3,55",
      ],
    },
  },
} as const;

const DEFAULT_CATEGORY = 6; // 750+

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  `\u20AC${n.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`;

function IconCell({
  variant,
  children,
  highlight,
}: {
  variant: "check" | "warning" | "x" | "danger" | "neutral";
  children: React.ReactNode;
  highlight?: boolean;
}) {
  const colors: Record<typeof variant, string> = {
    check: "text-emerald-600 dark:text-emerald-500 font-medium",
    warning: "text-amber-600 dark:text-amber-500",
    x: "text-zinc-400",
    danger: "text-red-600 dark:text-red-500",
    neutral: "",
  };

  const Icon =
    variant === "check"
      ? CheckCircleIcon
      : variant === "warning" || variant === "danger"
        ? ExclamationTriangleIcon
        : variant === "x"
          ? XCircleIcon
          : null;

  return (
    <td
      className={`p-3 ${highlight ? "bg-branding-light/5 dark:bg-branding-dark/10" : ""}`}
    >
      <div className={`flex items-center gap-2 ${colors[variant]}`}>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <span className="h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span
          className={`flex-1 text-center ${variant === "neutral" ? "text-zinc-700 dark:text-zinc-300" : ""}`}
        >
          {children}
        </span>
      </div>
    </td>
  );
}

function NeutralCell({
  children,
  muted,
  highlight,
}: {
  children: React.ReactNode;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <td
      className={`p-3 ${highlight ? "bg-branding-light/5 dark:bg-branding-dark/10" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span
          className={`flex-1 text-center ${muted ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-700 dark:text-zinc-300"}`}
        >
          {children}
        </span>
      </div>
    </td>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CostComparison() {
  const [catIndex, setCatIndex] = useState(DEFAULT_CATEGORY);
  // biome-ignore lint/style/noNonNullAssertion: catIndex is bounded by CATEGORIES.length
  const cat = CATEGORIES[catIndex]!;

  return (
    <div className="not-prose my-12">
      {/* Range slider */}
      <div className="mb-8 px-2">
        <label
          htmlFor="category-slider"
          className="block text-center text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-4"
        >
          {cat.label}
        </label>
        <input
          id="category-slider"
          type="range"
          min={0}
          max={CATEGORIES.length - 1}
          step={1}
          value={catIndex}
          onChange={(e) => setCatIndex(Number(e.target.value))}
          aria-valuetext={cat.valueText}
          className="category-slider w-full touch-manipulation focus-visible:outline-none"
        />
        <div
          className="mt-2 flex justify-between text-xs text-zinc-400 dark:text-zinc-500 select-none"
          aria-hidden="true"
        >
          {CATEGORIES.map((c, i) => (
            <span
              key={c.tickLabel}
              className={`transition-colors duration-150 ${
                i === catIndex
                  ? "font-medium text-zinc-900 dark:text-zinc-100"
                  : ""
              } ${i !== 0 && i !== 3 && i !== CATEGORIES.length - 1 ? "hidden sm:inline" : ""}`}
            >
              {c.tickLabel}
            </span>
          ))}
        </div>
      </div>

      {/* Main comparison table */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <caption className="sr-only">
            Vergelijking van vier scenario&apos;s voor commerci&#235;le
            vaarscholen in 2026
          </caption>

          <thead>
            <tr>
              <th className="w-48 p-3 text-left font-medium text-zinc-600 dark:text-zinc-400" />
              <th className="p-3 text-center bg-branding-light/10 dark:bg-branding-dark/20 border-t-4 border-branding-orange rounded-t-lg">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-branding-orange text-white text-xs font-medium mb-2">
                  Aanbevolen
                </div>
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  NWD Lidmaatschap
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  De standaard voor commerci&#235;le vaarscholen
                </div>
              </th>
              <th className="p-3 text-center bg-zinc-50 dark:bg-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Watersport Academy
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Platform voor verenigingen
                </div>
              </th>
              <th className="p-3 text-center bg-zinc-50 dark:bg-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  KSS + CWO*
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Dubbele kosten, beperkte erkenning
                </div>
              </th>
              <th className="p-3 text-center bg-zinc-50 dark:bg-zinc-800">
                <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                  CWO zonder KSS*
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  Geen erkende opleiding
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
            {/* Cost section header */}
            <tr className="bg-zinc-100 dark:bg-zinc-900">
              <td
                colSpan={5}
                className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wide"
              >
                {cat.sectionLabel}
              </td>
            </tr>
            {/* Annual */}
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                Jaarlijkse bijdrage
              </th>
              <td className="p-3 text-center bg-branding-light/5 dark:bg-branding-dark/10 tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {fmt(cat.annual[0])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(cat.annual[1])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(cat.annual[2])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(cat.annual[3])}
              </td>
            </tr>
            {/* One-time */}
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                Eenmalige kosten
              </th>
              <td className="p-3 text-center bg-branding-light/5 dark:bg-branding-dark/10 tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(SHARED.oneTime[0])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(SHARED.oneTime[1])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(SHARED.oneTime[2])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(SHARED.oneTime[3])}
              </td>
            </tr>
            {/* Per diploma */}
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                Per diploma
              </th>
              <td className="p-3 text-center bg-branding-light/5 dark:bg-branding-dark/10 tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                {SHARED.perDiploma[0]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {SHARED.perDiploma[1]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {SHARED.perDiploma[2]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {SHARED.perDiploma[3]}
              </td>
            </tr>

            {/* Recognition section */}
            <tr className="bg-zinc-100 dark:bg-zinc-900">
              <td
                colSpan={5}
                className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wide"
              >
                Erkenning &amp; kwaliteit
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>Eigenvaardigheidslijn</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Het diplomasysteem voor consumenten
                </div>
              </th>
              <IconCell variant="check" highlight>
                Modern
              </IconCell>
              <IconCell variant="check">Modern</IconCell>
              <IconCell variant="x">Verouderd</IconCell>
              <IconCell variant="x">Verouderd</IconCell>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>Diplomalijn</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Status volgens het Watersportverbond
                </div>
              </th>
              <IconCell variant="check" highlight>
                Nationale standaard
              </IconCell>
              <IconCell variant="check">Nationale standaard</IconCell>
              <IconCell variant="x">Geen standaard</IconCell>
              <IconCell variant="x">Geen standaard</IconCell>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>KSS-instructeurs</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Opleiden via Kwalificatiestructuur Sport
                </div>
              </th>
              <IconCell variant="check" highlight>
                Inbegrepen
              </IconCell>
              <IconCell variant="check">Inbegrepen</IconCell>
              <IconCell variant="warning">Via losse licentie</IconCell>
              <IconCell variant="x">Niet mogelijk</IconCell>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>Aansprakelijkheidsverzekering</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Vereist KSS-gekwalificeerde instructeurs
                </div>
              </th>
              <IconCell variant="check" highlight>
                Voldoet
              </IconCell>
              <IconCell variant="check">Voldoet</IconCell>
              <IconCell variant="check">Voldoet</IconCell>
              <IconCell variant="danger">Mogelijk niet gedekt</IconCell>
            </tr>

            {/* Support section */}
            <tr className="bg-zinc-100 dark:bg-zinc-900">
              <td
                colSpan={5}
                className="px-3 py-2 font-semibold text-zinc-700 dark:text-zinc-300 text-xs uppercase tracking-wide"
              >
                Ondersteuning &amp; toekomst
              </td>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>Inspraak</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Mede-eigenaar diplomalijn, strategisch partner KNWV
                </div>
              </th>
              <IconCell variant="check" highlight>
                Mede-eigenaar + ALV
              </IconCell>
              <IconCell variant="warning">
                Indirect, geen stemrecht
              </IconCell>
              <IconCell variant="x">Geen</IconCell>
              <IconCell variant="x">Geen</IconCell>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                Marketing
              </th>
              <IconCell variant="check" highlight>
                Gezamenlijk
              </IconCell>
              <NeutralCell>{"\u2014"}</NeutralCell>
              <NeutralCell>{"\u2014"}</NeutralCell>
              <NeutralCell>{"\u2014"}</NeutralCell>
            </tr>
            <tr>
              <th
                scope="row"
                className="p-3 text-left font-medium text-zinc-600 dark:text-zinc-400"
              >
                <div>Diplomaregistratie</div>
                <div className="text-xs font-normal text-zinc-400 dark:text-zinc-500 mt-0.5">
                  Online systeem voor locaties en cursisten
                </div>
              </th>
              <IconCell variant="check" highlight>
                Gebouwd voor grote locaties
              </IconCell>
              <NeutralCell>Via Watersportverbond</NeutralCell>
              <NeutralCell muted>CWO legacy</NeutralCell>
              <NeutralCell muted>CWO legacy</NeutralCell>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footnote */}
      <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
        {"* "}
        {cat.footnote} Bekijk de volledige kostenopbouw hieronder.
      </p>

      {/* Disclosure */}
      <details className="mt-6 rounded-lg border border-zinc-200 dark:border-zinc-700 group">
        <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 select-none list-none [&::-webkit-details-marker]:hidden flex items-center gap-2">
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 group-open:rotate-90" />
          Bekijk de volledige kostenopbouw per scenario
        </summary>
        <div className="border-t border-zinc-200 dark:border-zinc-700">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <caption className="sr-only">
                Volledige kostenopbouw per scenario
              </caption>
              <thead>
                <tr>
                  <th className="w-48 px-3 py-2 text-left text-xs font-medium text-zinc-500 dark:text-zinc-400" />
                  <th className="px-3 py-2 text-right text-xs font-medium text-zinc-900 dark:text-zinc-100 bg-branding-light/5 dark:bg-branding-dark/10">
                    NWD
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Academy
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    KSS + CWO*
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    CWO alleen*
                  </th>
                </tr>
              </thead>
              <tbody className="text-zinc-600 dark:text-zinc-400">
                {/* One-time section */}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td
                    colSpan={5}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                  >
                    Eenmalig
                  </td>
                </tr>
                <DisclosureRow label="Intake">
                  {SHARED.disclosure.oneTime.intake}
                </DisclosureRow>
                <DisclosureRow label="Investeringsbijdrage">
                  {SHARED.disclosure.oneTime.investment}
                </DisclosureRow>
                <DisclosureRow label="Onboardingpakket (vlag, gevelbord)">
                  {SHARED.disclosure.oneTime.onboarding}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal eenmalig">
                  {SHARED.disclosure.oneTime.totalOneTime}
                </DisclosureTotalRow>

                {/* Annual section */}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td
                    colSpan={5}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                  >
                    {cat.sectionLabel.replace("Kosten", "Jaarlijks")}
                  </td>
                </tr>
                <DisclosureRow label="Contributie / jaarbijdrage">
                  {cat.disclosure.contribution}
                </DisclosureRow>
                <DisclosureRow label="Licentiegeld KSS">
                  {cat.disclosure.kssLicense}
                </DisclosureRow>
                <DisclosureRow label="Bijzonder lidmaatschap KNWV">
                  {cat.disclosure.knwvMembership}
                </DisclosureRow>
                <DisclosureRow label="Marketingbijdrage">
                  {cat.disclosure.marketing}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal jaarlijks">
                  {cat.disclosure.totalAnnual}
                </DisclosureTotalRow>

                {/* Per diploma section */}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td
                    colSpan={5}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                  >
                    Per diploma
                  </td>
                </tr>
                <DisclosureRow label="Registratie (digitaal)">
                  {SHARED.disclosure.perDiploma.digital}
                </DisclosureRow>
                <DisclosureRow label="Voorbedrukt fysiek diploma">
                  {SHARED.disclosure.perDiploma.printed}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal per diploma">
                  {SHARED.disclosure.perDiploma.totalPerDiploma}
                </DisclosureTotalRow>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
            <p>* {cat.footnote}</p>
            <p>{cat.disclosureNote}</p>
          </div>
        </div>
      </details>

      {/* Slider styling */}
      <style>{`
        .category-slider {
          -webkit-appearance: none;
          appearance: none;
          height: 6px;
          border-radius: 3px;
          background: linear-gradient(
            to right,
            var(--color-branding-light) 0%,
            var(--color-branding-light) ${(catIndex / (CATEGORIES.length - 1)) * 100}%,
            #d4d4d8 ${(catIndex / (CATEGORIES.length - 1)) * 100}%,
            #d4d4d8 100%
          );
          outline: none;
          cursor: pointer;
        }
        :is(.dark) .category-slider {
          background: linear-gradient(
            to right,
            var(--color-branding-dark) 0%,
            var(--color-branding-dark) ${(catIndex / (CATEGORIES.length - 1)) * 100}%,
            #3f3f46 ${(catIndex / (CATEGORIES.length - 1)) * 100}%,
            #3f3f46 100%
          );
        }
        .category-slider:focus-visible {
          box-shadow: 0 0 0 2px white, 0 0 0 4px var(--color-branding-light);
          border-radius: 3px;
        }
        .category-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-branding-light);
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 150ms, box-shadow 150ms;
        }
        .category-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        .category-slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--color-branding-light);
          border: 2px solid white;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          cursor: pointer;
          transition: transform 150ms, box-shadow 150ms;
        }
        .category-slider::-moz-range-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        .category-slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          .category-slider::-webkit-slider-thumb,
          .category-slider::-moz-range-thumb {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Disclosure row helpers
// ---------------------------------------------------------------------------

function DisclosureRow({
  label,
  children,
}: {
  label: string;
  children: readonly [string, string, string, string];
}) {
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-800">
      <th scope="row" className="px-3 py-1.5 text-left font-normal">
        {label}
      </th>
      <td
        className={`px-3 py-1.5 text-right bg-branding-light/5 dark:bg-branding-dark/10 ${
          children[0] === "inbegrepen"
            ? "text-zinc-500 dark:text-zinc-400 italic text-xs"
            : children[0] === "\u2014"
              ? "text-zinc-400"
              : "tabular-nums"
        }`}
      >
        {children[0]}
      </td>
      {[1, 2, 3].map((i) => (
        <td
          key={i}
          className={`px-3 py-1.5 text-right ${
            children[i] === "inbegrepen"
              ? "text-zinc-500 dark:text-zinc-400 italic text-xs"
              : children[i] === "\u2014"
                ? "text-zinc-400"
                : "tabular-nums"
          }`}
        >
          {children[i]}
        </td>
      ))}
    </tr>
  );
}

function DisclosureTotalRow({
  label,
  children,
}: {
  label: string;
  children: readonly [string, string, string, string];
}) {
  return (
    <tr className="border-t border-zinc-200 dark:border-zinc-700">
      <th
        scope="row"
        className="px-3 py-1.5 text-left font-medium text-zinc-900 dark:text-zinc-100"
      >
        {label}
      </th>
      <td className="px-3 py-1.5 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100 bg-branding-light/5 dark:bg-branding-dark/10">
        {children[0]}
      </td>
      {[1, 2, 3].map((i) => (
        <td
          key={i}
          className="px-3 py-1.5 text-right tabular-nums font-medium text-zinc-900 dark:text-zinc-100"
        >
          {children[i]}
        </td>
      ))}
    </tr>
  );
}
