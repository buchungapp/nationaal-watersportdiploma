"use client";

import { useState } from "react";
import Link from "next/link";

interface Discipline {
  id: string;
  handle: string;
  title: string;
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
};

export default function DiplomaTabs({
  disciplines,
}: {
  disciplines: Discipline[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = disciplines[activeIndex];

  if (!active) return null;

  const description =
    disciplineDescriptions[active.handle] ??
    `Bekijk de cursussen binnen ${active.title}.`;

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
            {d.title}
          </button>
        ))}
      </div>

      {/* Active discipline content */}
      <div className="rounded-xl border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="grid gap-2 min-w-0">
            <h3 className="text-lg font-bold text-slate-900">
              {active.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              {description}
            </p>
          </div>
          <Link
            href={`/diplomalijn/consument/disciplines/${active.handle}`}
            className="shrink-0 self-start rounded-full bg-branding-dark/5 px-4 py-2 text-sm font-bold text-branding-dark hover:bg-branding-dark/10 inline-flex items-center gap-1.5 transition-colors"
          >
            Bekijk cursussen
            <span aria-hidden="true">{"\u2192"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
