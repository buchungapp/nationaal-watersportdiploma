import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { EIGENVAARDIGHEID_DISCIPLINES as disciplines } from "../_data/eigenvaardigheid-disciplines";

const columns: Array<{ key: "a" | "b" | "c"; label: string; chip: string }> = [
  { key: "a", label: "NWD A", chip: "bg-branding-light/15 text-branding-dark" },
  { key: "b", label: "NWD B", chip: "bg-branding-light/20 text-branding-dark" },
  { key: "c", label: "NWD C", chip: "bg-branding-dark/15 text-branding-dark" },
];

function href(handle: string) {
  return `/diplomalijn/instructeur/eigenvaardigheid/${handle}`;
}

export function EigenvaardigheidMatrix() {
  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* Desktop */}
      <div className="hidden sm:block">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Discipline
          </span>
          {columns.map((col) => (
            <span
              key={col.key}
              className={`inline-flex w-fit items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${col.chip}`}
            >
              {col.label}
            </span>
          ))}
          <span className="sr-only">Bekijk</span>
        </div>
        <div className="divide-y divide-slate-100">
          {disciplines.map((d) => (
            <Link
              key={d.handle}
              href={href(d.handle)}
              className="group grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center gap-2 px-4 py-3 transition-colors hover:bg-branding-light/5"
            >
              <span className="text-sm font-medium text-slate-900 group-hover:text-branding-dark">
                {d.title}
              </span>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                NWD A
              </span>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                NWD B
              </span>
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
                NWD C
              </span>
              <ArrowRightIcon
                className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-branding-dark"
                aria-hidden="true"
              />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile */}
      <div className="flex flex-col divide-y divide-slate-100 sm:hidden">
        {disciplines.map((d) => (
          <Link
            key={d.handle}
            href={href(d.handle)}
            className="flex flex-col gap-2 px-4 py-3 transition-colors hover:bg-branding-light/5"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{d.title}</p>
              <ArrowRightIcon
                className="size-4 text-slate-400"
                aria-hidden="true"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {columns.map((col) => (
                <span
                  key={col.key}
                  className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${col.chip}`}
                >
                  {col.label}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </div>

      <div className="border-t border-slate-200 bg-slate-50/50 px-4 py-2.5 text-xs text-slate-500">
        NWD A en B worden verzorgd door erkende opleidingslocaties en kennen een
        vaste modulestructuur. NWD C wordt vastgesteld tijdens een
        afrondingsweekend door twee Instructeurs 5 en heeft geen vaste modules.
      </div>
    </div>
  );
}
