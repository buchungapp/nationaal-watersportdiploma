"use client";

import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import Link from "next/link";

interface Discipline {
  id: string;
  handle: string;
  title: string | null;
}

interface Course {
  id: string;
  handle: string;
  title: string | null;
  disciplineId: string;
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

export default function DiplomaTabs({
  disciplines,
  courses,
}: {
  disciplines: Discipline[];
  courses: Course[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = disciplines[activeIndex];

  if (!active) return null;

  const displayTitle = active.title ?? active.handle;
  const description =
    disciplineDescriptions[active.handle] ??
    `Bekijk de cursussen binnen ${displayTitle}.`;

  const activeCourses = courses.filter((c) => c.disciplineId === active.id);

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
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-10">
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
              Alle cursussen bekijken
              <span aria-hidden="true">{"\u2192"}</span>
            </Link>
          </div>

          {/* Right: courses for this discipline */}
          <div className="border-t pt-5 lg:border-t-0 lg:border-l lg:border-slate-200 lg:pl-10 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-3">
              Cursussen
            </p>
            {activeCourses.length > 0 ? (
              <div className="grid gap-1">
                {activeCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/diplomalijn/consument/disciplines/${active.handle}/${course.handle}`}
                    className="group flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 -mx-3 transition-colors hover:bg-slate-50"
                  >
                    <span className="text-sm font-medium text-slate-700 group-hover:text-branding-dark transition-colors">
                      {course.title ?? course.handle}
                    </span>
                    <ChevronRightIcon className="size-4 shrink-0 text-slate-300 group-hover:text-branding-dark transition-colors" />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">
                Nog geen cursussen beschikbaar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
