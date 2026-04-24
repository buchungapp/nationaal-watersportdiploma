import {
  CheckCircleIcon,
  ClockIcon,
  MinusCircleIcon,
} from "@heroicons/react/24/outline";

// PROTOTYPE STATE — hardcoded pending DB seed for NWD A/B/C degrees.
// Canonical discipline list comes from:
// packages/scripts/src/tmp/import-instructeurskwalificaties.ts
// "Eigen vaardigheid - {discipline}" rows (~line 261 onwards).
//
// When NWD A/B/C are added to the `degree` table (rang 5/6/7) and
// linked via `program` rows, replace this hardcoded list with a
// query like: Course.Program.list({ filter: { degreeRang: { gte: 5 } } }).

type Availability = "beschikbaar" | "in-ontwikkeling" | "nvt";

type DisciplineRow = {
  title: string;
  a: Availability;
  b: Availability;
  c: Availability;
};

const rows: DisciplineRow[] = [
  { title: "Catamaran", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Jachtzeilen (non-tidal)", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Jachtzeilen (tidal)", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Kajuitzeilen", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Kielboot", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Windsurfen", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Zwaardboot eenmans", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
  { title: "Zwaardboot tweemans", a: "beschikbaar", b: "beschikbaar", c: "in-ontwikkeling" },
];

function StatusChip({ status }: { status: Availability }) {
  if (status === "beschikbaar") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
        <CheckCircleIcon className="size-3" aria-hidden="true" />
        Beschikbaar
      </span>
    );
  }
  if (status === "in-ontwikkeling") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
        <ClockIcon className="size-3" aria-hidden="true" />
        In ontwikkeling
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
      <MinusCircleIcon className="size-3" aria-hidden="true" />
      N.v.t.
    </span>
  );
}

const columns: Array<{ key: "a" | "b" | "c"; label: string; chip: string }> = [
  {
    key: "a",
    label: "NWD A",
    chip: "bg-branding-light/15 text-branding-dark",
  },
  {
    key: "b",
    label: "NWD B",
    chip: "bg-branding-light/20 text-branding-dark",
  },
  {
    key: "c",
    label: "NWD C",
    chip: "bg-branding-dark/15 text-branding-dark",
  },
];

export function EigenvaardigheidMatrix() {
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr] gap-0 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Discipline
          </span>
          {columns.map((col) => (
            <span
              key={col.key}
              className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${col.chip}`}
              >
                {col.label}
              </span>
            </span>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {rows.map((row) => (
            <div
              key={row.title}
              className="grid grid-cols-[1.4fr_1fr_1fr_1fr] items-center gap-0 px-4 py-3"
            >
              <span className="text-sm font-medium text-slate-900">
                {row.title}
              </span>
              <StatusChip status={row.a} />
              <StatusChip status={row.b} />
              <StatusChip status={row.c} />
            </div>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col divide-y divide-slate-100 sm:hidden">
        {rows.map((row) => (
          <div key={row.title} className="flex flex-col gap-2 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">{row.title}</p>
            <div className="flex flex-col gap-1.5">
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex items-center justify-between gap-3"
                >
                  <span
                    className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${col.chip}`}
                  >
                    {col.label}
                  </span>
                  <StatusChip status={row[col.key]} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
        NWD A en B worden verzorgd door erkende opleidingslocaties. NWD C wordt
        vastgesteld tijdens een afrondingsweekend door twee Instructeurs 5.
      </div>
    </div>
  );
}
