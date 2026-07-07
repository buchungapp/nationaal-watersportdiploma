export function KssVsEvCards() {
  const rows = [
    {
      label: "Wat meet het?",
      kss: "Didactiek — lesgeven, begeleiden, beoordelen",
      ev: "Eigenvaardigheid — wat je zelf kunt op het water",
    },
    {
      label: "Hoe getoetst?",
      kss: "Proeven van Bekwaamheid (PvB) per kerntaak",
      ev: "NWD A/B-examen of NWD C afrondingsweekend",
    },
    {
      label: "Waar zichtbaar?",
      kss: "Diplomaregister (I/L/B kwalificaties)",
      ev: "NWD-diploma per discipline (A, B, C)",
    },
    {
      label: "Raamwerk",
      kss: "KSS — Kwalificatiestructuur Sport",
      ev: "NWD consumenten- en instructeurslijn",
    },
  ] as const;

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span className="px-4 py-2.5" />
        <span className="border-l border-slate-200 px-4 py-2.5">KSS (didactiek)</span>
        <span className="border-l border-slate-200 px-4 py-2.5">
          NWD (eigenvaardigheid)
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[1fr_1fr_1fr] text-sm"
          >
            <span className="px-4 py-3 font-medium text-slate-900">
              {row.label}
            </span>
            <span className="border-l border-slate-100 px-4 py-3 text-slate-600">
              {row.kss}
            </span>
            <span className="border-l border-slate-100 px-4 py-3 text-slate-600">
              {row.ev}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
