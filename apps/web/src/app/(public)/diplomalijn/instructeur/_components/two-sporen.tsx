import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

type BadgeRowEntry = {
  label: string;
  variant: "instructeur" | "leercoach" | "beoordelaar";
};

const variantChip: Record<BadgeRowEntry["variant"], string> = {
  instructeur: "bg-branding-light/10 text-branding-dark",
  leercoach: "bg-branding-orange/10 text-branding-orange",
  beoordelaar: "bg-branding-dark/10 text-branding-dark",
};

function BadgeRow({ entries }: { entries: BadgeRowEntry[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry) => (
        <span
          key={entry.label}
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold ${variantChip[entry.variant]}`}
        >
          {entry.label}
        </span>
      ))}
    </div>
  );
}

function SpoorCard({
  kicker,
  title,
  lede,
  badges,
  href,
  ctaLabel,
  tone,
}: {
  kicker: string;
  title: string;
  lede: string;
  badges: BadgeRowEntry[];
  href: string;
  ctaLabel: string;
  tone: "blue" | "neutral";
}) {
  const shell =
    tone === "blue"
      ? "border-branding-light/30 bg-branding-light/5"
      : "border-slate-200 bg-white";
  const kickerCls = tone === "blue" ? "text-branding-dark" : "text-slate-600";
  return (
    <article
      className={`flex flex-col gap-3 rounded-xl border ${shell} p-4 sm:p-5`}
    >
      <header className="flex flex-col gap-0.5">
        <p
          className={`text-[11px] font-semibold uppercase tracking-wide ${kickerCls}`}
        >
          {kicker}
        </p>
        <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{lede}</p>
      </header>

      <BadgeRow entries={badges} />

      <Link
        href={href}
        className="inline-flex w-fit items-center gap-1 text-sm font-semibold text-branding-dark hover:underline"
      >
        {ctaLabel}
        <ArrowRightIcon className="size-4" aria-hidden="true" />
      </Link>
    </article>
  );
}

export function TwoSporen() {
  return (
    <div className="not-prose grid gap-3 md:grid-cols-2">
      <SpoorCard
        tone="blue"
        kicker="Spoor 1"
        title="Eigenvaardigheid"
        lede="Wat je zelf kunt op het water."
        badges={[
          { label: "NWD A", variant: "instructeur" },
          { label: "NWD B", variant: "instructeur" },
          { label: "NWD C", variant: "instructeur" },
        ]}
        href="/diplomalijn/instructeur/eigenvaardigheid"
        ctaLabel="Meer over eigenvaardigheid"
      />
      <SpoorCard
        tone="neutral"
        kicker="Spoor 2"
        title="Didactiek"
        lede="Hoe je dat aan anderen overdraagt."
        badges={[
          { label: "I1 – I5", variant: "instructeur" },
          { label: "L4 – L5", variant: "leercoach" },
          { label: "B4 – B5", variant: "beoordelaar" },
        ]}
        href="/diplomalijn/instructeur/pvbs"
        ctaLabel="Meer over PvB's"
      />
    </div>
  );
}
