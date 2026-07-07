export function InstructiegroepDiagram() {
  return (
    <div className="not-prose rounded-xl border border-slate-200 bg-slate-50 p-6">
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 text-center">
        <div className="w-full rounded-lg border border-branding-dark/20 bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Federatie
          </p>
          <p className="mt-0.5 text-sm font-semibold text-slate-900">
            Watersportverbond / NWD
          </p>
        </div>
        <div className="h-6 w-px bg-slate-300" aria-hidden="true" />
        <div className="w-full rounded-lg border border-branding-light/40 bg-branding-light/5 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-branding-dark">
            Instructiegroep
          </p>
          <p className="mt-0.5 text-sm text-slate-700">
            bijv. Afstandsinstructie
          </p>
        </div>
        <div className="flex w-full justify-center gap-2" aria-hidden="true">
          <div className="h-4 w-px bg-slate-300" />
          <div className="h-4 w-px bg-slate-300" />
          <div className="h-4 w-px bg-slate-300" />
        </div>
        <div className="grid w-full grid-cols-3 gap-2">
          {["Zwaardboot", "Catamaran", "Windsurf"].map((d) => (
            <div
              key={d}
              className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs font-medium text-slate-700"
            >
              {d}
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          PvB in één discipline binnen de groep geldt voor de rest — mits je
          aan de eigenvaardigheidseisen voldoet.
        </p>
      </div>
    </div>
  );
}
