export function EvBVsCTable() {
  const rows = [
    {
      label: "Toets",
      b: "NWD B-examen op erkende opleidingslocatie",
      c: "Beoordeling door 2× Instructeur 5 (vaak tijdens C-weekend)",
    },
    {
      label: "Training",
      b: "Opleiding + voorbereiding op examen",
      c: "Interne training + NWD C afrondingsweekend",
    },
    {
      label: "Vereist voor",
      b: "Instructeur 3",
      c: "Instructeur 4",
    },
    {
      label: "Examenvorm",
      b: "Vaste examenopdracht per discipline",
      c: "Geen vaste examenvorm — beoordeling op vaardigheid",
    },
  ] as const;

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="px-4 py-2.5" />
        <span className="border-l border-slate-200 px-4 py-2.5">NWD B</span>
        <span className="border-l border-slate-200 px-4 py-2.5">NWD C</span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div key={row.label} className="grid grid-cols-[1fr_1fr_1fr] text-sm">
            <span className="px-4 py-3 font-medium text-slate-900">
              {row.label}
            </span>
            <span className="border-l border-slate-100 px-4 py-3 text-slate-600">
              {row.b}
            </span>
            <span className="border-l border-slate-100 px-4 py-3 text-slate-600">
              {row.c}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
