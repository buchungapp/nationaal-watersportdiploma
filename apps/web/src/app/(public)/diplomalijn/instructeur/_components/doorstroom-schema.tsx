import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

// Niveau x richting grid — 5 rows x 3 columns — honest to the KSS structure.
// Each filled cell is a link to that niveau page. Empty cells stay empty so
// the progression and the branch-off points (L/B start at niveau 4) read
// directly from the visual, no legend or arrows needed.

type Role = "instructeur" | "leercoach" | "beoordelaar";

type Cell = {
  code: string;
  title: string;
  sub: string;
  age: string;
  href: string;
};

const roleTokens: Record<
  Role,
  { chip: string; ringHover: string; accent: string; dot: string }
> = {
  instructeur: {
    chip: "bg-branding-light text-white",
    ringHover: "hover:ring-branding-light/40",
    accent: "bg-branding-light/30",
    dot: "bg-branding-light",
  },
  leercoach: {
    chip: "bg-branding-orange text-white",
    ringHover: "hover:ring-branding-orange/40",
    accent: "bg-branding-orange/30",
    dot: "bg-branding-orange",
  },
  beoordelaar: {
    chip: "bg-branding-dark text-white",
    ringHover: "hover:ring-branding-dark/40",
    accent: "bg-branding-dark/30",
    dot: "bg-branding-dark",
  },
};

const grid: Record<1 | 2 | 3 | 4 | 5, Partial<Record<Role, Cell>>> = {
  1: {
    instructeur: {
      code: "I1",
      title: "Wal/Waterhulp",
      sub: "Assisteert bij lessen",
      age: "12+",
      href: "/diplomalijn/instructeur/niveau-1",
    },
  },
  2: {
    instructeur: {
      code: "I2",
      title: "Instructeur 2",
      sub: "Lesgeven onder supervisie",
      age: "16+",
      href: "/diplomalijn/instructeur/niveau-2",
    },
  },
  3: {
    instructeur: {
      code: "I3",
      title: "Instructeur 3",
      sub: "Zelfstandig lesgeven & toetsen",
      age: "17+",
      href: "/diplomalijn/instructeur/niveau-3",
    },
  },
  4: {
    instructeur: {
      code: "I4",
      title: "Instructeur 4",
      sub: "Opleider van instructeurs",
      age: "18+",
      href: "/diplomalijn/instructeur/niveau-4",
    },
    leercoach: {
      code: "L4",
      title: "Leercoach 4",
      sub: "Opleider I1–I3",
      age: "18+",
      href: "/diplomalijn/instructeur/leercoach/niveau-4",
    },
    beoordelaar: {
      code: "B4",
      title: "PvB-beoordelaar 4",
      sub: "Eigen locatie",
      age: "18+",
      href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-4",
    },
  },
  5: {
    instructeur: {
      code: "I5",
      title: "Instructeur 5",
      sub: "Examinator NWD C",
      age: "18+",
      href: "/diplomalijn/instructeur/niveau-5",
    },
    leercoach: {
      code: "L5",
      title: "Leercoach 5",
      sub: "Eindverantwoordelijk",
      age: "18+",
      href: "/diplomalijn/instructeur/leercoach/niveau-5",
    },
    beoordelaar: {
      code: "B5",
      title: "PvB-beoordelaar 5",
      sub: "Extern",
      age: "18+",
      href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-5",
    },
  },
};

const columns: Array<{ role: Role; label: string }> = [
  { role: "instructeur", label: "Instructeur" },
  { role: "leercoach", label: "Leercoach" },
  { role: "beoordelaar", label: "PvB-beoordelaar" },
];

function GridCell({ cell, role }: { cell: Cell; role: Role }) {
  const t = roleTokens[role];
  return (
    <Link
      href={cell.href}
      className={`group relative flex min-h-[88px] flex-col justify-between gap-1 rounded-lg bg-white p-3 ring-1 ring-slate-200 transition-all ${t.ringHover} hover:ring-2`}
    >
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 h-full w-1 rounded-l-lg ${t.accent}`}
      />
      <div className="flex items-start justify-between gap-2 pl-1.5">
        <div className="min-w-0">
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${t.chip}`}
          >
            {cell.code}
          </span>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {cell.title}
          </p>
        </div>
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-slate-500">
          {cell.age}
        </span>
      </div>
      <p className="pl-1.5 text-xs text-slate-600">{cell.sub}</p>
    </Link>
  );
}

function EmptyCell() {
  return <div aria-hidden="true" className="hidden sm:block" />;
}

export function DoorstroomSchema() {
  const rows: Array<1 | 2 | 3 | 4 | 5> = [1, 2, 3, 4, 5];

  return (
    <div className="not-prose overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50">
      {/* Desktop/tablet: full grid */}
      <div className="hidden sm:block">
        {/* Column headers */}
        <div className="grid grid-cols-[80px_1fr_1fr_1fr] gap-2 border-b border-slate-200 bg-white px-3 py-2">
          <div />
          {columns.map((col) => {
            const t = roleTokens[col.role];
            return (
              <div
                key={col.role}
                className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700"
              >
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${t.dot}`}
                />
                {col.label}
              </div>
            );
          })}
        </div>

        {/* Rows */}
        <div className="flex flex-col gap-2 p-3">
          {rows.map((rang) => (
            <div
              key={rang}
              className="grid grid-cols-[80px_1fr_1fr_1fr] items-stretch gap-2"
            >
              <div className="flex items-center">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Niveau {rang}
                </span>
              </div>
              {columns.map((col) => {
                const cell = grid[rang][col.role];
                if (!cell) return <EmptyCell key={col.role} />;
                return <GridCell key={col.role} cell={cell} role={col.role} />;
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile: stacked by niveau */}
      <div className="flex flex-col gap-4 p-3 sm:hidden">
        {rows.map((rang) => {
          const cells = columns
            .map((col) => ({ col, cell: grid[rang][col.role] }))
            .filter((x): x is { col: (typeof columns)[number]; cell: Cell } =>
              Boolean(x.cell),
            );
          return (
            <section key={rang} className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Niveau {rang}
              </p>
              <div className="flex flex-col gap-2">
                {cells.map(({ col, cell }) => (
                  <GridCell key={col.role} cell={cell} role={col.role} />
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {/* Footnote */}
      <div className="flex items-center gap-2 border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
        <ArrowRightIcon className="size-3.5 text-slate-400" aria-hidden="true" />
        <span>
          Klik een niveau om de kerntaken, werkprocessen en
          beoordelingscriteria te bekijken.
        </span>
      </div>
    </div>
  );
}
