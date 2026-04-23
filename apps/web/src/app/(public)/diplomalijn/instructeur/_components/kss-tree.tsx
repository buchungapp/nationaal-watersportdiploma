import {
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
  IdentificationIcon,
} from "@heroicons/react/24/outline";
import {
  getPublicKssTree,
  type PublicKssKerntaak,
  type PublicKssProfiel,
  type PublicKssWerkproces,
  type PublicRichting,
} from "~/lib/kss-public";

type Role = "instructeur" | "leercoach" | "beoordelaar";

const richtingToRole: Record<PublicRichting, Role> = {
  instructeur: "instructeur",
  leercoach: "leercoach",
  pvb_beoordelaar: "beoordelaar",
};

const roleTokens: Record<
  Role,
  { chip: string; chipSoft: string; dot: string; softBorder: string; soft: string; ring: string }
> = {
  instructeur: {
    chip: "bg-branding-light text-white",
    chipSoft: "bg-branding-light/10 text-branding-dark",
    dot: "bg-branding-light",
    softBorder: "border-branding-light/20",
    soft: "bg-branding-light/5",
    ring: "ring-branding-light/30",
  },
  leercoach: {
    chip: "bg-branding-orange text-white",
    chipSoft: "bg-branding-orange/10 text-branding-orange",
    dot: "bg-branding-orange",
    softBorder: "border-branding-orange/20",
    soft: "bg-branding-orange/5",
    ring: "ring-branding-orange/30",
  },
  beoordelaar: {
    chip: "bg-branding-dark text-white",
    chipSoft: "bg-branding-dark/10 text-branding-dark",
    dot: "bg-branding-dark",
    softBorder: "border-branding-dark/20",
    soft: "bg-branding-dark/5",
    ring: "ring-branding-dark/30",
  },
};

function countCriteria(werkprocessen: PublicKssWerkproces[]): number {
  return werkprocessen.reduce(
    (sum, wp) => sum + wp.beoordelingscriteria.length,
    0,
  );
}

function WerkprocesCard({
  werkproces,
  role,
}: {
  werkproces: PublicKssWerkproces;
  role: Role;
}) {
  const t = roleTokens[role];
  const criteriaCount = werkproces.beoordelingscriteria.length;
  return (
    <details className="group rounded-lg border border-slate-200 bg-white">
      <summary className="flex cursor-pointer list-none items-start gap-3 p-4 hover:bg-slate-50 [&::-webkit-details-marker]:hidden">
        <span
          className={`mt-1 inline-flex size-1.5 shrink-0 rounded-full ${t.dot}`}
        />
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-semibold text-slate-900">
            {werkproces.titel}
          </h4>
          {werkproces.resultaat && (
            <p className="mt-1 text-sm text-slate-600">
              <span className="font-medium text-slate-700">Resultaat:</span>{" "}
              {werkproces.resultaat}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {werkproces.onderdeelTypes.map((type) => (
              <span
                key={type}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${t.chipSoft}`}
              >
                {type === "portfolio" ? (
                  <DocumentTextIcon className="size-3" />
                ) : (
                  <ClipboardDocumentCheckIcon className="size-3" />
                )}
                {type === "portfolio" ? "Portfolio" : "Praktijk"}
              </span>
            ))}
            <span className="text-xs text-slate-500">
              {criteriaCount} beoordelingscriteria
            </span>
          </div>
        </div>
        <svg
          aria-hidden="true"
          className="mt-1 size-4 shrink-0 text-slate-400 transition-transform group-open:rotate-90"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <title>Uitklappen</title>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </summary>
      {criteriaCount > 0 && (
        <ol className="divide-y divide-slate-100 border-t border-slate-100">
          {werkproces.beoordelingscriteria.map((criterium) => (
            <li key={criterium.id} className="flex gap-3 p-4">
              <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-slate-100 font-mono text-xs font-semibold text-slate-600">
                {criterium.rang}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900">
                  {criterium.title}
                </p>
                {criterium.omschrijving && (
                  <p className="mt-1 text-sm text-slate-600">
                    {criterium.omschrijving}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </details>
  );
}

function OnderdeelSummary({
  type,
  werkprocessen,
}: {
  type: "portfolio" | "praktijk";
  werkprocessen: PublicKssWerkproces[];
}) {
  const scoped = werkprocessen.filter((wp) => wp.onderdeelTypes.includes(type));
  const criteria = countCriteria(scoped);
  const Icon = type === "portfolio" ? DocumentTextIcon : ClipboardDocumentCheckIcon;
  const label = type === "portfolio" ? "Portfoliobeoordeling" : "Praktijkbeoordeling";
  const helper =
    type === "portfolio"
      ? "Schriftelijk bewijs, vooraf ingediend en beoordeeld."
      : "Live observatie tijdens een les of activiteit.";
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 size-4 shrink-0 text-slate-500" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900">{label}</p>
          <p className="text-xs text-slate-500">{helper}</p>
        </div>
      </div>
      <div className="shrink-0 text-xs text-slate-600 sm:text-right">
        <span className="font-semibold">{scoped.length}</span> werkprocessen ·{" "}
        <span className="font-semibold">{criteria}</span> criteria
      </div>
    </div>
  );
}

function KerntaakBlock({
  kerntaak,
  role,
}: {
  kerntaak: PublicKssKerntaak;
  role: Role;
}) {
  const t = roleTokens[role];
  const hasPortfolio = kerntaak.onderdelen.some((o) => o.type === "portfolio");
  const hasPraktijk = kerntaak.onderdelen.some((o) => o.type === "praktijk");
  const totalCriteria = countCriteria(kerntaak.werkprocessen);

  return (
    <section
      className={`rounded-2xl border ${t.softBorder} ${t.soft} p-5 sm:p-6`}
    >
      <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900">
            {kerntaak.titel}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {kerntaak.type === "verplicht" ? (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.chip}`}
              >
                Verplicht
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                Facultatief
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-xs text-slate-500">
          {kerntaak.werkprocessen.length} werkprocessen · {totalCriteria}{" "}
          criteria
        </div>
      </header>

      {(hasPortfolio || hasPraktijk) && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {hasPortfolio && (
            <OnderdeelSummary
              type="portfolio"
              werkprocessen={kerntaak.werkprocessen}
            />
          )}
          {hasPraktijk && (
            <OnderdeelSummary
              type="praktijk"
              werkprocessen={kerntaak.werkprocessen}
            />
          )}
        </div>
      )}

      {kerntaak.werkprocessen.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {kerntaak.werkprocessen.map((wp) => (
            <WerkprocesCard key={wp.id} werkproces={wp} role={role} />
          ))}
        </div>
      )}
    </section>
  );
}

function ProfielBlock({ profiel }: { profiel: PublicKssProfiel }) {
  const role = richtingToRole[profiel.richting];
  const t = roleTokens[role];
  const totalKerntaken = profiel.kerntaken.length;
  const totalWerkprocessen = profiel.kerntaken.reduce(
    (sum, kt) => sum + kt.werkprocessen.length,
    0,
  );
  const totalCriteria = profiel.kerntaken.reduce(
    (sum, kt) => sum + countCriteria(kt.werkprocessen),
    0,
  );

  return (
    <div className="flex flex-col gap-4">
      <div
        className={`flex flex-col gap-2 rounded-xl border ${t.softBorder} bg-white p-5 ring-1 ${t.ring}`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <IdentificationIcon className="size-5 text-slate-500" />
          <h2 className="text-base font-semibold text-slate-900">
            Kwalificatieprofiel {profiel.titel}
          </h2>
        </div>
        <p className="text-sm text-slate-600">
          {totalKerntaken} kerntaak{totalKerntaken === 1 ? "" : "en"} ·{" "}
          {totalWerkprocessen} werkprocessen · {totalCriteria} beoordelingscriteria
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {profiel.kerntaken.map((kerntaak) => (
          <KerntaakBlock key={kerntaak.id} kerntaak={kerntaak} role={role} />
        ))}
      </div>
    </div>
  );
}

export async function KssCompetentieTree({
  rang,
  richting,
}: {
  rang: number;
  richting: PublicRichting;
}) {
  const profielen = await getPublicKssTree({ rang, richting });
  if (profielen.length === 0) {
    return (
      <div className="not-prose rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
        Geen kwalificatieprofiel gevonden voor dit niveau.
      </div>
    );
  }
  return (
    <div className="not-prose flex flex-col gap-8">
      {profielen.map((profiel) => (
        <ProfielBlock key={profiel.id} profiel={profiel} />
      ))}
    </div>
  );
}
