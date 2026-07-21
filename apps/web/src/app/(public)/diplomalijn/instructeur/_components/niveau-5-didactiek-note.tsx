import { InformationCircleIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

const DIDACTIEK_INTRO_HREF = "/diplomalijn/instructeur/didactiek";

const toneTokens = {
  instructeur: {
    soft: "bg-branding-light/5",
    softBorder: "border-branding-light/20",
    icon: "text-branding-light",
  },
  leercoach: {
    soft: "bg-branding-orange/5",
    softBorder: "border-branding-orange/20",
    icon: "text-branding-orange",
  },
  beoordelaar: {
    soft: "bg-branding-dark/5",
    softBorder: "border-branding-dark/20",
    icon: "text-branding-dark",
  },
} as const;

export function Niveau5DidactiekNote({
  tone,
}: {
  tone: keyof typeof toneTokens;
}) {
  const t = toneTokens[tone];

  return (
    <div
      className={clsx(
        "not-prose rounded-lg border px-4 py-3",
        t.softBorder,
        t.soft,
      )}
    >
      <p className="text-sm leading-relaxed text-slate-600">
        <InformationCircleIcon
          className={clsx("mr-1.5 inline size-4 -mt-0.5", t.icon)}
          aria-hidden="true"
        />
        Niveau 5 wordt centraal aangeboden door de Watersport Academy. Meer over
        de centrale opleiding en her- en bijscholing lees je op de{" "}
        <Link
          href={DIDACTIEK_INTRO_HREF}
          className="font-semibold text-branding-light hover:underline"
        >
          KSS-structuur
        </Link>
        .
      </p>
    </div>
  );
}
