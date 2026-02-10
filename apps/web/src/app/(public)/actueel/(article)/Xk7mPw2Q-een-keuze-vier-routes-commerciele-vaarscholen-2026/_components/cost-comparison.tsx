"use client";

import {
  CheckCircleIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/20/solid";
import { useState } from "react";

type Size = "large" | "small";

const SIZES = [
  { id: "large" as const, label: "Grote locatie (>750 diploma's/jaar)" },
  { id: "small" as const, label: "Kleine locatie (150\u2013300 diploma's/jaar)" },
];

// ---------------------------------------------------------------------------
// Cost data
// ---------------------------------------------------------------------------

interface CostData {
  annual: [number, number, number, number]; // NWD, Academy, KSS+CWO, CWO
  oneTime: [number, number, number, number];
  perDiploma: [string, string, string, string];
  disclosure: {
    oneTime: {
      intake: [string, string, string, string];
      investment: [string, string, string, string];
      onboarding: [string, string, string, string];
      totalOneTime: [string, string, string, string];
    };
    annual: {
      contribution: [string, string, string, string];
      kssLicense: [string, string, string, string];
      knwvMembership: [string, string, string, string];
      marketing: [string, string, string, string];
      totalAnnual: [string, string, string, string];
    };
    perDiploma: {
      digital: [string, string, string, string];
      printed: [string, string, string, string];
      totalPerDiploma: [string, string, string, string];
    };
  };
  footnote: string;
  disclosureNote: string;
  sectionLabel: string;
}

const COST_DATA: Record<Size, CostData> = {
  large: {
    annual: [1_950, 2_950, 7_314, 2_889],
    oneTime: [2_000, 795, 544, 214],
    perDiploma: ["€3,35", "€3,65", "€3,55", "€3,55"],
    disclosure: {
      oneTime: {
        intake: ["€750", "€750", "€330 + €214", "€214"],
        investment: ["€1.250", "—", "—", "—"],
        onboarding: ["inbegrepen", "€45 (vlag)", "—", "—"],
        totalOneTime: ["€2.000", "€795", "€544", "€214"],
      },
      annual: {
        contribution: ["€1.000", "€2.950", "€2.889", "€2.889"],
        kssLicense: ["inbegrepen", "inbegrepen", "€4.425", "—"],
        knwvMembership: ["€450", "inbegrepen", "—", "—"],
        marketing: ["€500", "—", "—", "—"],
        totalAnnual: ["€1.950", "€2.950", "€7.314", "€2.889"],
      },
      perDiploma: {
        digital: ["€3,00", "€3,25", "€3,15", "€3,15"],
        printed: ["€0,35", "€0,40", "€0,40", "€0,40"],
        totalPerDiploma: ["€3,35", "€3,65", "€3,55", "€3,55"],
      },
    },
    footnote:
      "Academy categorie 7, CWO categorie 5 (HISWA/KNWV-lidtarief 2025). CWO-tarieven 2026 zijn op het moment van schrijven nog niet openbaar beschikbaar.",
    disclosureNote:
      "NWD-contributie is €650 bij omzet uit zeilcursussen/-kampen onder €100.000 (excl. btw).",
    sectionLabel: "Kosten (o.b.v. >750 diploma's/jaar)",
  },
  small: {
    annual: [1_600, 900, 2_230, 880],
    oneTime: [2_000, 795, 544, 214],
    perDiploma: ["€3,35", "€3,65", "€3,55", "€3,55"],
    disclosure: {
      oneTime: {
        intake: ["€750", "€750", "€330 + €214", "€214"],
        investment: ["€1.250", "—", "—", "—"],
        onboarding: ["inbegrepen", "€45 (vlag)", "—", "—"],
        totalOneTime: ["€2.000", "€795", "€544", "€214"],
      },
      annual: {
        contribution: ["€650", "€900", "€880", "€880"],
        kssLicense: ["inbegrepen", "inbegrepen", "€1.350", "—"],
        knwvMembership: ["€450", "inbegrepen", "—", "—"],
        marketing: ["€500", "—", "—", "—"],
        totalAnnual: ["€1.600", "€900", "€2.230", "€880"],
      },
      perDiploma: {
        digital: ["€3,00", "€3,25", "€3,15", "€3,15"],
        printed: ["€0,35", "€0,40", "€0,40", "€0,40"],
        totalPerDiploma: ["€3,35", "€3,65", "€3,55", "€3,55"],
      },
    },
    footnote:
      "Academy categorie 4, CWO categorie 2 (HISWA/KNWV-lidtarief 2025). CWO-tarieven 2026 zijn op het moment van schrijven nog niet openbaar beschikbaar.",
    disclosureNote:
      "NWD-contributie is €1.000 bij omzet uit zeilcursussen/-kampen boven €100.000 (excl. btw).",
    sectionLabel: "Kosten (o.b.v. 150\u2013300 diploma's/jaar)",
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmt = (n: number) =>
  `€${n.toLocaleString("nl-NL", { minimumFractionDigits: 0 })}`;

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
  const [size, setSize] = useState<Size>("large");
  const data = COST_DATA[size];

  return (
    <div className="not-prose my-12">
      {/* Segmented control */}
      <fieldset className="flex justify-center mb-8">
        <legend className="sr-only">Locatiegrootte</legend>
        <div className="inline-flex rounded-full bg-zinc-100 p-1 dark:bg-zinc-800 touch-manipulation">
          {SIZES.map((s) => (
            <label
              key={s.id}
              className={`relative cursor-pointer rounded-full px-4 py-2 text-sm font-medium transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-branding-light focus-within:ring-offset-2 motion-safe:transition-all motion-safe:duration-200 ${
                size === s.id
                  ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-700 dark:text-zinc-100"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              <input
                type="radio"
                name="location-size"
                value={s.id}
                checked={size === s.id}
                onChange={() => setSize(s.id)}
                className="sr-only"
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* Main comparison table */}
      <div className="overflow-x-auto -mx-4 px-4 lg:mx-0 lg:px-0">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <caption className="sr-only">
            Vergelijking van vier scenario&apos;s voor commerciële vaarscholen
            in 2026
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
                  De standaard voor commerciële vaarscholen
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
                {data.sectionLabel}
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
                {fmt(data.annual[0])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.annual[1])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.annual[2])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.annual[3])}
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
                {fmt(data.oneTime[0])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.oneTime[1])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.oneTime[2])}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {fmt(data.oneTime[3])}
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
                {data.perDiploma[0]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {data.perDiploma[1]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {data.perDiploma[2]}
              </td>
              <td className="p-3 text-center tabular-nums text-zinc-700 dark:text-zinc-300">
                {data.perDiploma[3]}
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
              <NeutralCell>—</NeutralCell>
              <NeutralCell>—</NeutralCell>
              <NeutralCell>—</NeutralCell>
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
        {data.footnote} Bekijk de volledige kostenopbouw hieronder.
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
                  {data.disclosure.oneTime.intake}
                </DisclosureRow>
                <DisclosureRow label="Investeringsbijdrage">
                  {data.disclosure.oneTime.investment}
                </DisclosureRow>
                <DisclosureRow label="Onboardingpakket (vlag, gevelbord)">
                  {data.disclosure.oneTime.onboarding}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal eenmalig">
                  {data.disclosure.oneTime.totalOneTime}
                </DisclosureTotalRow>

                {/* Annual section */}
                <tr className="bg-zinc-50 dark:bg-zinc-800/50">
                  <td
                    colSpan={5}
                    className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
                  >
                    {data.sectionLabel.replace("Kosten", "Jaarlijks")}
                  </td>
                </tr>
                <DisclosureRow label="Contributie / jaarbijdrage">
                  {data.disclosure.annual.contribution}
                </DisclosureRow>
                <DisclosureRow label="Licentiegeld KSS">
                  {data.disclosure.annual.kssLicense}
                </DisclosureRow>
                <DisclosureRow label="Bijzonder lidmaatschap KNWV">
                  {data.disclosure.annual.knwvMembership}
                </DisclosureRow>
                <DisclosureRow label="Marketingbijdrage">
                  {data.disclosure.annual.marketing}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal jaarlijks">
                  {data.disclosure.annual.totalAnnual}
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
                  {data.disclosure.perDiploma.digital}
                </DisclosureRow>
                <DisclosureRow label="Voorbedrukt fysiek diploma">
                  {data.disclosure.perDiploma.printed}
                </DisclosureRow>
                <DisclosureTotalRow label="Totaal per diploma">
                  {data.disclosure.perDiploma.totalPerDiploma}
                </DisclosureTotalRow>
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 text-xs text-zinc-400 dark:text-zinc-500 space-y-1">
            <p>* {data.footnote}</p>
            <p>{data.disclosureNote}</p>
          </div>
        </div>
      </details>
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
  children: [string, string, string, string];
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
            : children[0] === "—"
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
              : children[i] === "—"
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
  children: [string, string, string, string];
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
