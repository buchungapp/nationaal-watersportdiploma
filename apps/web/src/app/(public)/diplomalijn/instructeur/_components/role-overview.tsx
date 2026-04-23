import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type Role = "instructeur" | "leercoach" | "beoordelaar";

interface RoleOverviewCardProps {
  role: Role;
  label: string;
  href: string;
  levels: string[];
  highlightLast?: boolean;
}

const roleTokens: Record<
  Role,
  {
    hoverBorder: string;
    groupHover: string;
    chip: string;
    chipActive: string;
    arrow: string;
    chipHoverText: string;
  }
> = {
  instructeur: {
    hoverBorder: "hover:border-branding-light/50",
    groupHover: "group-hover:text-branding-light",
    chip: "bg-branding-light/10 text-branding-dark",
    chipActive: "bg-branding-light text-white",
    arrow: "text-slate-400",
    chipHoverText: "text-branding-light",
  },
  leercoach: {
    hoverBorder: "hover:border-branding-orange/50",
    groupHover: "group-hover:text-branding-orange",
    chip: "bg-branding-orange/10 text-branding-orange",
    chipActive: "bg-branding-orange text-white",
    arrow: "text-slate-400",
    chipHoverText: "text-branding-orange",
  },
  beoordelaar: {
    hoverBorder: "hover:border-branding-dark/50",
    groupHover: "group-hover:text-branding-dark",
    chip: "bg-branding-dark/10 text-branding-dark",
    chipActive: "bg-branding-dark text-white",
    arrow: "text-slate-400",
    chipHoverText: "text-branding-dark",
  },
};

export function RoleOverviewCard({
  role,
  label,
  href,
  levels,
  highlightLast = true,
}: RoleOverviewCardProps) {
  const t = roleTokens[role];
  return (
    <Link
      href={href}
      className={`not-prose group flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 transition-colors sm:flex-row sm:items-center sm:gap-3 ${t.hoverBorder}`}
    >
      <div className="flex items-center justify-between sm:w-36 sm:shrink-0">
        <span
          className={`text-sm font-semibold text-slate-900 transition-colors ${t.groupHover}`}
        >
          {label}
        </span>
        <ArrowRightIcon
          className={`size-4 shrink-0 sm:hidden ${t.arrow} transition-colors ${t.groupHover}`}
        />
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {levels.map((lvl, i) => {
          const isLast = i === levels.length - 1;
          const cls = highlightLast && isLast ? t.chipActive : t.chip;
          return (
            <div key={lvl} className="flex items-center">
              <span
                className={`rounded px-2 py-0.5 font-mono text-xs font-semibold ${cls}`}
              >
                {lvl}
              </span>
              {i < levels.length - 1 && (
                <ArrowRightIcon className={`mx-1 size-3 ${t.arrow}`} />
              )}
            </div>
          );
        })}
      </div>
      <ArrowRightIcon
        className={`ml-auto hidden size-4 shrink-0 sm:block ${t.arrow} transition-colors ${t.groupHover}`}
      />
    </Link>
  );
}

type Chip = { label: string; role?: Role };

interface CategoryCardProps {
  title: string;
  chips: Chip[];
  defaultRole?: Role;
}

export function CategoryCard({
  title,
  chips,
  defaultRole = "instructeur",
}: CategoryCardProps) {
  return (
    <div className="not-prose rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <div className="mt-2 flex flex-wrap gap-2">
        {chips.map((c) => {
          const role = c.role ?? defaultRole;
          const cls = roleTokens[role].chip;
          return (
            <span
              key={c.label}
              className={`rounded-full px-3 py-1 text-sm ${cls}`}
            >
              {c.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
