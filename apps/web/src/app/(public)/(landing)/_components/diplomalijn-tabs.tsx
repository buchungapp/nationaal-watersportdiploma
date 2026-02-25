"use client";

import { useState } from "react";
import Link from "next/link";

interface Discipline {
  id: string;
  handle: string;
  title: string | null;
}

const disciplineDescriptions: Record<string, string> = {
  "zwaardboot-1-mans":
    "Leer solo zeilen op een lichte, wendbare zwaardboot. Ideaal om de basis van het zeilen onder de knie te krijgen.",
  "zwaardboot-2-mans":
    "Samen zeilen op een tweepersoons zwaardboot. Leer samenwerken als stuurman en bemanning.",
  kielboot:
    "Ontdek het zeilen op een stabiele kielboot. Geschikt voor wie comfortabel wil leren zeilen op groter water.",
  catamaran:
    "Vaar op twee rompen en ervaar de snelheid van een catamaran. Voor wie van actie en uitdaging houdt.",
  windsurfen:
    "Combineer wind en golven op een surfplank met zeil. Een dynamische manier om het water te verkennen.",
  jachtzeilen:
    "Leer navigeren en zeilen op een zeiljacht. Van opstapper tot zelfstandig schipper op open water.",
  bijboot:
    "Leer varen met een bijboot. De ideale basis voor het begeleiden op het water.",
};

const levels = [
  {
    number: 1,
    label: "Kennismaken",
    description: "De eerste stappen op het water",
  },
  {
    number: 2,
    label: "Basis",
    description: "Zelfstandig varen onder begeleiding",
  },
  {
    number: 3,
    label: "Gevorderd",
    description: "Varen in wisselende omstandigheden",
  },
  {
    number: 4,
    label: "Zelfstandig",
    description: "Zelfstandig en verantwoord het water op",
  },
];

export default function DiplomaTabs({
  disciplines,
}: {
  disciplines: Discipline[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = disciplines[activeIndex];

  if (!active) return null;

  const displayTitle = active.title ?? active.handle;
  const description =
    disciplineDescriptions[active.handle] ??
    `Bekijk de cursussen binnen ${displayTitle}.`;

  return (
    <div className="grid gap-6">
      {/* Discipline pills */}
      <div className="flex flex-wrap gap-2">
        {disciplines.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActiveIndex(i)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              i === activeIndex
                ? "bg-branding-dark text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {d.title ?? d.handle}
          </button>
        ))}
      </div>

      {/* Two-column content area */}
      <div className="rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px] lg:gap-10">
          {/* Left: discipline info */}
          <div className="grid content-start gap-4">
            <div className="grid gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                {displayTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {description}
              </p>
            </div>
            <Link
              href={`/diplomalijn/consument/disciplines/${active.handle}`}
              className="self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors"
            >
              Bekijk cursussen
              <span aria-hidden="true">{"\u2192"}</span>
            </Link>
          </div>

          {/* Right: 4 levels progression */}
          <div className="border-t pt-5 lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-10 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
              4 niveaus
            </p>
            <div className="grid gap-3">
              {levels.map((level) => (
                <div key={level.number} className="flex items-start gap-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-branding-light/10 text-xs font-bold text-branding-light">
                    {level.number}
                  </span>
                  <div className="grid gap-0.5 min-w-0">
                    <span className="text-sm font-semibold text-slate-900">
                      {level.label}
                    </span>
                    <span className="text-xs text-slate-500 leading-relaxed">
                      {level.description}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
