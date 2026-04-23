import {
  AcademicCapIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

type Role = "instructeur" | "leercoach" | "beoordelaar";

const roleTokens: Record<
  Role,
  { chip: string; ring: string; icon: string; soft: string; softBorder: string }
> = {
  instructeur: {
    chip: "bg-branding-light text-white",
    ring: "ring-branding-light/40",
    icon: "text-branding-light",
    soft: "bg-branding-light/5",
    softBorder: "border-branding-light/30",
  },
  leercoach: {
    chip: "bg-branding-orange text-white",
    ring: "ring-branding-orange/40",
    icon: "text-branding-orange",
    soft: "bg-branding-orange/5",
    softBorder: "border-branding-orange/30",
  },
  beoordelaar: {
    chip: "bg-branding-dark text-white",
    ring: "ring-branding-dark/40",
    icon: "text-branding-dark",
    soft: "bg-branding-dark/5",
    softBorder: "border-branding-dark/30",
  },
};

type Track = {
  role: Role;
  icon: React.ComponentType<{ className?: string }>;
  headline: string;
  lede: string;
  startLabel: string;
  startHref: string;
  steps: Array<{ label: string; href: string; sublabel: string }>;
  cta: { label: string; href: string };
};

const tracks: Track[] = [
  {
    role: "instructeur",
    icon: AcademicCapIcon,
    headline: "Ik wil lesgeven",
    lede: "Je leert zelf lesgeven aan beginnende of gevorderde sporters. Van assisteren tot het opleiden van andere instructeurs.",
    startLabel: "Start bij I1 of I2",
    startHref: "/diplomalijn/instructeur/niveau-2",
    steps: [
      {
        label: "I1",
        href: "/diplomalijn/instructeur/niveau-1",
        sublabel: "Wal/Waterhulp",
      },
      {
        label: "I2",
        href: "/diplomalijn/instructeur/niveau-2",
        sublabel: "Beginnend",
      },
      {
        label: "I3",
        href: "/diplomalijn/instructeur/niveau-3",
        sublabel: "Zelfstandig",
      },
      {
        label: "I4",
        href: "/diplomalijn/instructeur/niveau-4",
        sublabel: "Opleider",
      },
      {
        label: "I5",
        href: "/diplomalijn/instructeur/niveau-5",
        sublabel: "Expert",
      },
    ],
    cta: {
      label: "Bekijk het volledige pad",
      href: "/diplomalijn/instructeur/niveau-2",
    },
  },
  {
    role: "leercoach",
    icon: UsersIcon,
    headline: "Ik wil instructeurs opleiden",
    lede: "Je begeleidt en coacht aspirant-instructeurs op de eigen opleidingslocatie. Verantwoordelijk voor portfolio-opbouw en didactiek.",
    startLabel: "Begin bij L4 (vereist: I3)",
    startHref: "/diplomalijn/instructeur/leercoach/niveau-4",
    steps: [
      {
        label: "L4",
        href: "/diplomalijn/instructeur/leercoach/niveau-4",
        sublabel: "Opleider I1-I3",
      },
      {
        label: "L5",
        href: "/diplomalijn/instructeur/leercoach/niveau-5",
        sublabel: "Eindverantwoordelijk",
      },
    ],
    cta: {
      label: "Naar de leercoach-lijn",
      href: "/diplomalijn/instructeur/leercoach/niveau-4",
    },
  },
  {
    role: "beoordelaar",
    icon: ClipboardDocumentCheckIcon,
    headline: "Ik wil examens afnemen",
    lede: "Je beoordeelt PvB's volgens het vier-ogen principe, samen met een leercoach. De externe B5 werkt namens de Watersport Academy.",
    startLabel: "Begin bij B4 (vereist: L4)",
    startHref: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-4",
    steps: [
      {
        label: "B4",
        href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-4",
        sublabel: "Eigen locatie",
      },
      {
        label: "B5",
        href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-5",
        sublabel: "Extern",
      },
    ],
    cta: {
      label: "Naar de beoordelaarslijn",
      href: "/diplomalijn/instructeur/pvb-beoordelaar/niveau-4",
    },
  },
];

function TrackCard({ track }: { track: Track }) {
  const t = roleTokens[track.role];
  const Icon = track.icon;
  return (
    <article
      className={`flex flex-col gap-4 rounded-2xl border ${t.softBorder} ${t.soft} p-5 ring-1 ${t.ring} sm:p-6`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-white ring-1 ${t.ring}`}
        >
          <Icon className={`size-5 ${t.icon}`} />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold text-slate-900">
            {track.headline}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{track.lede}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {track.steps.map((step, i) => (
          <div key={step.label} className="flex items-center gap-1.5">
            <Link
              href={step.href}
              className="group flex flex-col items-center gap-0.5 rounded-lg bg-white px-2.5 py-1.5 text-center ring-1 ring-slate-200 transition-colors hover:ring-slate-400"
            >
              <span
                className={`inline-flex items-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold ${t.chip}`}
              >
                {step.label}
              </span>
              <span className="text-[10px] text-slate-500 group-hover:text-slate-700">
                {step.sublabel}
              </span>
            </Link>
            {i < track.steps.length - 1 && (
              <ChevronRightIcon className="size-3 shrink-0 text-slate-300" />
            )}
          </div>
        ))}
      </div>

      <Link
        href={track.cta.href}
        className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-semibold text-slate-900 hover:underline"
      >
        {track.cta.label}
        <ChevronRightIcon className="size-4" />
      </Link>
    </article>
  );
}

export function RoleNavigator() {
  return (
    <div className="not-prose">
      <div className="grid gap-3 md:grid-cols-3">
        {tracks.map((track) => (
          <TrackCard key={track.role} track={track} />
        ))}
      </div>
    </div>
  );
}
