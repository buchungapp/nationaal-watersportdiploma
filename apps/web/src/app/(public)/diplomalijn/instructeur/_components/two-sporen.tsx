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
  toets,
  context,
  href,
  ctaLabel,
  tone,
}: {
  kicker: string;
  title: string;
  lede: string;
  badges: BadgeRowEntry[];
  toets: string;
  context: string;
  href: string;
  ctaLabel: string;
  tone: "blue" | "neutral";
}) {
  const shell =
    tone === "blue"
      ? "border-branding-light/30 bg-branding-light/5"
      : "border-slate-200 bg-white";
  const kickerCls =
    tone === "blue" ? "text-branding-dark" : "text-slate-600";
  return (
    <article
      className={`flex flex-col gap-5 rounded-2xl border ${shell} p-5 sm:p-6`}
    >
      <header className="flex flex-col gap-1">
        <p
          className={`text-xs font-semibold uppercase tracking-wide ${kickerCls}`}
        >
          {kicker}
        </p>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{lede}</p>
      </header>

      <BadgeRow entries={badges} />

      <dl className="flex flex-col gap-3 text-sm">
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Hoe je het aantoont
          </dt>
          <dd className="mt-0.5 text-slate-700">{toets}</dd>
        </div>
        <div>
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Raamwerk
          </dt>
          <dd className="mt-0.5 text-slate-700">{context}</dd>
        </div>
      </dl>

      <Link
        href={href}
        className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-semibold text-branding-dark hover:underline"
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
        toets="Vaardigheidsexamen (NWD A, B) of afrondingsweekend met twee Instructeurs 5 (NWD C)."
        context="Cursusgebonden — NWD A Kielboot geldt niet voor Catamaran."
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
        toets="Proef van Bekwaamheid (PvB) per kerntaak — portfolio en/of praktijk, beoordeeld volgens het vier-ogen-principe."
        context="De kaderlijn volgens de Kwalificatiestructuur Sport (KSS), geborgd door het Watersportverbond en World Sailing."
        href="/diplomalijn/instructeur/pvbs"
        ctaLabel="Meer over PvB's"
      />
    </div>
  );
}
