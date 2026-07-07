const levels: Array<{
  code: string;
  nlqf?: string;
  eqf?: string;
  note?: string;
}> = [
  { code: "I1", note: "Niet ingeschaald" },
  { code: "I2", nlqf: "NLQF 4", eqf: "EQF 4" },
  { code: "I3", nlqf: "NLQF 5", eqf: "EQF 5" },
  { code: "I4", nlqf: "NLQF 6", eqf: "EQF 6" },
  { code: "I5", nlqf: "NLQF 7", eqf: "EQF 7" },
];

export function NlqfSummary() {
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-2.5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          KSS-instructeursniveaus in NLQF / EQF (samenvatting)
        </p>
      </div>
      <div className="flex flex-wrap gap-2 p-4">
        {levels.map(({ code, nlqf, eqf, note }) => (
          <div
            key={code}
            className="flex min-w-[7rem] flex-col gap-0.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          >
            <span className="font-mono text-xs font-semibold text-branding-dark">
              {code}
            </span>
            <span className="text-xs text-slate-700">
              {note ?? `${nlqf} · ${eqf}`}
            </span>
          </div>
        ))}
      </div>
      <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
        L4/L5 en B4/B5 volgen dezelfde NLQF-inschaling op rang 4 en 5. Volledige
        inschaling: NLQF-database.
      </p>
    </div>
  );
}
