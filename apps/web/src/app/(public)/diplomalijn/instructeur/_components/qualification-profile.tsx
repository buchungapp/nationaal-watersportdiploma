import {
  AcademicCapIcon,
  CheckCircleIcon,
  ClipboardDocumentCheckIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

type Role = "instructeur" | "leercoach" | "beoordelaar";

interface PvB {
  code: string;
  title: string;
  type: string;
}

interface QualificationProfileProps {
  role: Role;
  level: string;
  title: string;
  subtitle: string;
  description: string;
  minAge: number;
  prerequisites: string[];
  pvbs: PvB[];
  permissions: string[];
  skillLevel: "A" | "B" | "C" | null;
  additionalInfo?: string;
}

const roleTokens: Record<
  Role,
  {
    border: string;
    chip: string;
    chipLevel: string;
    dot: string;
    icon: string;
    soft: string;
    softBorder: string;
    permissionIcon: string;
  }
> = {
  instructeur: {
    border: "border-branding-light/30",
    chip: "bg-branding-light/10 text-branding-dark",
    chipLevel: "bg-branding-light text-white",
    dot: "bg-branding-light",
    icon: "text-branding-light",
    soft: "bg-branding-light/5",
    softBorder: "border-branding-light/20",
    permissionIcon: "text-branding-light",
  },
  leercoach: {
    border: "border-branding-orange/30",
    chip: "bg-branding-orange/10 text-branding-orange",
    chipLevel: "bg-branding-orange text-white",
    dot: "bg-branding-orange",
    icon: "text-branding-orange",
    soft: "bg-branding-orange/5",
    softBorder: "border-branding-orange/20",
    permissionIcon: "text-branding-orange",
  },
  beoordelaar: {
    border: "border-branding-dark/30",
    chip: "bg-branding-dark/10 text-branding-dark",
    chipLevel: "bg-branding-dark text-white",
    dot: "bg-branding-dark",
    icon: "text-branding-dark",
    soft: "bg-branding-dark/5",
    softBorder: "border-branding-dark/20",
    permissionIcon: "text-branding-dark",
  },
};

export function QualificationProfile({
  role,
  level,
  title,
  subtitle,
  description,
  minAge,
  prerequisites,
  pvbs,
  permissions,
  skillLevel,
  additionalInfo,
}: QualificationProfileProps) {
  const t = roleTokens[role];

  return (
    <div className="not-prose space-y-6">
      {/* Role header */}
      <div
        className={`flex flex-col gap-2 rounded-2xl border ${t.softBorder} ${t.soft} p-5 sm:flex-row sm:items-center sm:gap-4`}
      >
        <span
          className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${t.chipLevel}`}
        >
          <span className="font-mono">{level}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{title}</span>
        </span>
        <div className="sm:hidden">
          <p className="text-base font-semibold text-slate-900">{title}</p>
        </div>
        <p className="text-sm text-slate-600 sm:text-base">{subtitle}</p>
      </div>

      {/* Description */}
      <p className="text-base leading-relaxed text-slate-600">{description}</p>

      {/* Two-column grid: Instapeisen + Eigenvaardigheid */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <CheckCircleIcon className={`size-5 ${t.icon}`} />
            Instapeisen
          </h3>
          <ul className="mt-3 space-y-2">
            <li className="flex items-start gap-2 text-sm text-slate-600">
              <span
                className={`mt-2 inline-flex size-1.5 shrink-0 rounded-full ${t.dot}`}
              />
              Minimumleeftijd van {minAge} jaar
            </li>
            {prerequisites.map((req) => (
              <li
                key={req}
                className="flex items-start gap-2 text-sm text-slate-600"
              >
                <span
                  className={`mt-2 inline-flex size-1.5 shrink-0 rounded-full ${t.dot}`}
                />
                {req}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <AcademicCapIcon className={`size-5 ${t.icon}`} />
            Eigenvaardigheid
          </h3>
          {skillLevel ? (
            <div className="mt-3">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.chip}`}
              >
                NWD {skillLevel}
              </span>
              <p className="mt-2 text-sm text-slate-600">
                NWD {skillLevel} in de desbetreffende discipline. Dit wordt met
                een examen vastgesteld als onderdeel van de opleiding.
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">
              Geen aanvullende eis op het gebied van eigenvaardigheid.
            </p>
          )}
        </div>
      </div>

      {/* PvB's */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ClipboardDocumentCheckIcon className={`size-5 ${t.icon}`} />
          Proeven van Bekwaamheid (PvB)
        </h3>
        <ul className="mt-3 space-y-2">
          {pvbs.map((pvb) => (
            <li
              key={pvb.code}
              className="flex items-start gap-3 rounded-lg bg-slate-50 p-3"
            >
              <span
                className={`inline-flex shrink-0 items-center rounded-md px-2 py-0.5 font-mono text-xs font-semibold ${t.chip}`}
              >
                {pvb.code}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900">
                  {pvb.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">{pvb.type}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Bevoegdheden */}
      <div className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <ShieldCheckIcon className={`size-5 ${t.icon}`} />
          Bevoegdheden
        </h3>
        <ul className="mt-3 space-y-2">
          {permissions.map((p) => (
            <li
              key={p}
              className="flex items-start gap-2 text-sm text-slate-600"
            >
              <ShieldCheckIcon
                className={`mt-0.5 size-4 shrink-0 ${t.permissionIcon}`}
              />
              {p}
            </li>
          ))}
        </ul>
      </div>

      {additionalInfo && (
        <div
          className={`flex items-start gap-3 rounded-xl border ${t.softBorder} ${t.soft} p-4`}
        >
          <InformationCircleIcon
            className={`mt-0.5 size-5 shrink-0 ${t.icon}`}
          />
          <p className="text-sm text-slate-600">{additionalInfo}</p>
        </div>
      )}
    </div>
  );
}
