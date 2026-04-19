"use client";

import type { ProfielSummary } from "../types";
import { richtingLabel } from "../types";

type Props = {
  profielen: ProfielSummary[];
  value: string | null;
  onChange: (profielId: string) => void;
  disabled?: boolean;
};

export function ProfielSelector({
  profielen,
  value,
  onChange,
  disabled,
}: Props) {
  type Richting = ProfielSummary["richting"];
  const groups = profielen.reduce<Record<Richting, ProfielSummary[]>>(
    (acc, profiel) => {
      if (!acc[profiel.richting]) acc[profiel.richting] = [];
      acc[profiel.richting].push(profiel);
      return acc;
    },
    { instructeur: [], leercoach: [], pvb_beoordelaar: [] },
  );

  const groupOrder: Richting[] = [
    "instructeur",
    "leercoach",
    "pvb_beoordelaar",
  ];

  return (
    <label className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-slate-800">
        Kwalificatieprofiel
      </span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-60 [&_optgroup]:font-semibold"
      >
        <option value="" disabled>
          Kies een profiel…
        </option>
        {groupOrder.map((richting) => {
          const items = groups[richting];
          if (!items || items.length === 0) return null;
          return (
            <optgroup key={richting} label={richtingLabel(richting)}>
              {items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.titel} ({p.werkprocesCount} werkprocessen)
                </option>
              ))}
            </optgroup>
          );
        })}
      </select>
    </label>
  );
}
