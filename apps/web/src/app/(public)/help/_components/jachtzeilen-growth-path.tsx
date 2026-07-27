"use client";

import { ArrowRightIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import Link from "next/link";
import { useMemo, useState } from "react";

type Vaarwater =
  | "binnenwater"
  | "ruim-binnenwater"
  | "wad"
  | "zee";

type Niveau = 1 | 2 | 3 | 4;

type DiplomaType = "kielboot" | Vaarwater;

type Diploma = {
  type: DiplomaType;
  niveau: Niveau;
};

type GrowthStep = {
  type: DiplomaType;
  niveau: Niveau;
  reden: string;
  href?: string;
};

const TYPE_LABEL: Record<DiplomaType, string> = {
  kielboot: "Kielboot",
  binnenwater: "Jachtzeilen Binnenwater",
  "ruim-binnenwater": "Jachtzeilen Ruim binnenwater",
  wad: "Jachtzeilen Waddenzee en Zeeuwse stromen",
  zee: "Jachtzeilen Kustwater en open zee",
};

const TYPE_LABEL_SHORT: Record<DiplomaType, string> = {
  kielboot: "Kielboot",
  binnenwater: "Binnenwater",
  "ruim-binnenwater": "Ruim binnenwater",
  wad: "Waddenzee en Zeeuwse stromen",
  zee: "Kustwater en open zee",
};

const TYPE_HREF: Record<DiplomaType, string> = {
  kielboot: "/diplomalijn/consument/disciplines/kielboot",
  binnenwater: "/diplomalijn/consument/disciplines/jachtzeilen",
  "ruim-binnenwater": "/diplomalijn/consument/disciplines/jachtzeilen",
  wad: "/diplomalijn/consument/disciplines/jachtzeilen",
  zee: "/diplomalijn/consument/disciplines/jachtzeilen",
};

const NIVEAU_NAME: Record<Niveau, string> = {
  1: "Opstapper",
  2: "Bemanningslid",
  3: "Dagschipper",
  4: "Schipper",
};

const VAARWATER_TYPES: Vaarwater[] = [
  "binnenwater",
  "ruim-binnenwater",
  "wad",
  "zee",
];

function formatDiploma({ type, niveau }: Diploma): string {
  return `${TYPE_LABEL[type]} ${niveau}`;
}

function stepsFor(diploma: Diploma): GrowthStep[] {
  const steps: GrowthStep[] = [];
  const { type, niveau } = diploma;

  if (type === "kielboot") {
    // Kielboot N -> JZ Binnenwater N (same level instroom)
    steps.push({
      type: "binnenwater",
      niveau,
      reden:
        "Met een Kielboot-diploma kun je rechtstreeks instromen in Jachtzeilen Binnenwater op hetzelfde niveau.",
      href: TYPE_HREF.binnenwater,
    });
    return steps;
  }

  // Vertical progression within the same water
  if (niveau < 4) {
    const nextNiveau = (niveau + 1) as Niveau;
    steps.push({
      type,
      niveau: nextNiveau,
      reden: `Logische vervolgstap: zelfde vaargebied, één niveau hoger.`,
      href: TYPE_HREF[type],
    });
  }

  // Cross-water progression (source -> next-level in adjacent harder water)
  // No horizontal step at niveau 2, except between Wad and Zee.
  if (type === "binnenwater" && niveau !== 2 && niveau < 4) {
    steps.push({
      type: "ruim-binnenwater",
      niveau: (niveau + 1) as Niveau,
      reden:
        "Stap door naar ruimer water: met Binnenwater op dit niveau kun je beginnen aan Ruim binnenwater één niveau hoger.",
      href: TYPE_HREF["ruim-binnenwater"],
    });
  }

  if (type === "ruim-binnenwater" && niveau !== 2 && niveau < 4) {
    steps.push({
      type: "wad",
      niveau: (niveau + 1) as Niveau,
      reden:
        "Stap door naar zoutwater en getijden: met Ruim binnenwater kun je beginnen aan Waddenzee en Zeeuwse stromen één niveau hoger.",
      href: TYPE_HREF.wad,
    });
  }

  // Wad <-> Zee bi-directional on niveau 1 and 2; and Wad -> Zee also on niveau 3.
  if (type === "wad" && niveau < 4) {
    steps.push({
      type: "zee",
      niveau: (niveau + 1) as Niveau,
      reden:
        "Stap door naar kustwater en open zee: met Wad/Zeeuwse stromen kun je beginnen aan Kustwater en open zee één niveau hoger.",
      href: TYPE_HREF.zee,
    });
  }

  if (type === "zee" && (niveau === 1 || niveau === 2)) {
    steps.push({
      type: "wad",
      niveau: (niveau + 1) as Niveau,
      reden:
        "Bi-directionele overgang op niveau 1 en 2: met Kustwater kun je ook beginnen aan Wad/Zeeuwse stromen één niveau hoger.",
      href: TYPE_HREF.wad,
    });
  }

  return steps;
}

export default function JachtzeilenGrowthPath() {
  const [type, setType] = useState<DiplomaType>("binnenwater");
  const [niveau, setNiveau] = useState<Niveau>(1);

  const diploma: Diploma = { type, niveau };

  const steps = useMemo(() => stepsFor(diploma), [type, niveau]);

  const isTerminal = steps.length === 0;

  return (
    <div className="not-prose my-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6">
      <h3 className="text-base font-semibold text-slate-900">
        Kies jouw huidige diploma
      </h3>
      <p className="mt-1 text-sm text-slate-600">
        Selecteer hieronder het diploma dat je nu hebt. De tool laat zien welke
        vervolgopleidingen daarmee voor jou openstaan.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Type diploma</span>
          <select
            value={type}
            onChange={(event) => {
              const nextType = event.target.value as DiplomaType;
              setType(nextType);
            }}
            className="block w-full rounded-md border-0 bg-white py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-branding-light sm:text-sm"
          >
            <option value="kielboot">{TYPE_LABEL.kielboot}</option>
            <option value="binnenwater">
              {TYPE_LABEL.binnenwater}
            </option>
            <option value="ruim-binnenwater">
              {TYPE_LABEL["ruim-binnenwater"]}
            </option>
            <option value="wad">{TYPE_LABEL.wad}</option>
            <option value="zee">{TYPE_LABEL.zee}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Niveau</span>
          <select
            value={niveau}
            onChange={(event) => {
              const nextNiveau = Number(event.target.value) as Niveau;
              setNiveau(nextNiveau);
            }}
            className="block w-full rounded-md border-0 bg-white py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-branding-light sm:text-sm"
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                Niveau {n}
                {type !== "kielboot"
                  ? ` – ${NIVEAU_NAME[n as Niveau]}`
                  : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-xl bg-white p-4 ring-1 ring-inset ring-slate-200">
        <p className="text-sm text-slate-600">
          Met jouw diploma{" "}
          <span className="font-semibold text-branding-dark">
            {formatDiploma(diploma)}
          </span>{" "}
          {isTerminal ? "zijn er geen vervolgopties binnen de consumentenlijn." : "kun je beginnen aan:"}
        </p>

        {isTerminal ? (
          <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
            <p>
              Je staat aan de top van de consumentendiplomalijn voor dit
              vaargebied. Wil je verder groeien? Bekijk de{" "}
              <Link
                href="/diplomalijn/instructeur"
                className="font-medium text-branding-dark underline"
              >
                instructeurslijn
              </Link>
              {type === "zee" ? (
                <>
                  {" "}of een opleiding die verder reikt dan GMDSS-gebied A1.
                </>
              ) : (
                <>.</>
              )}
            </p>
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {steps.map((step, index) => {
              const key = `${step.type}-${step.niveau}-${index}`;
              return (
                <li key={key}>
                  <StepCard step={step} />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Deze tool toont de logische groeipaden uit onze diplomastructuur. Je
        vaarlocatie kijkt bij aanvang altijd of je in de praktijk op dit niveau
        kunt starten – een individuele niveauinschatting is leidend.
      </p>

      <details className="mt-3 text-xs text-slate-500">
        <summary className="cursor-pointer text-slate-600 hover:text-slate-900">
          Zie alle vaargebieden op dit niveau
        </summary>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          {VAARWATER_TYPES.map((waterType) => (
            <li key={waterType} className={clsx(
              "rounded-md px-2 py-1",
              waterType === type ? "bg-branding-light/10 text-branding-dark" : "text-slate-600",
            )}>
              {TYPE_LABEL_SHORT[waterType]} {niveau}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

function StepCard({ step }: { step: GrowthStep }) {
  const label = `${TYPE_LABEL[step.type]} ${step.niveau}${step.type !== "kielboot" ? ` (${NIVEAU_NAME[step.niveau]})` : ""}`;

  const content = (
    <div className="group flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:border-branding-light hover:bg-branding-light/5">
      <ArrowRightIcon
        className="mt-0.5 size-5 shrink-0 text-branding-light"
        aria-hidden="true"
      />
      <div className="flex-1">
        <p className="font-semibold text-slate-900">{label}</p>
        <p className="mt-0.5 text-sm text-slate-600">{step.reden}</p>
      </div>
    </div>
  );

  if (step.href) {
    return (
      <Link href={step.href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
