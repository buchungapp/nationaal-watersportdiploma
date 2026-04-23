import { ArrowRightIcon, ScaleIcon } from "@heroicons/react/24/outline";
import type { Metadata } from "next";
import {
  getPublicKssTree,
  type PublicKssProfiel,
  type PublicRichting,
} from "~/lib/kss-public";

export const metadata: Metadata = {
  title: "Vergelijken",
  description: "Vergelijk twee KSS-kwalificatieprofielen naast elkaar.",
};

export const page = {
  title: "Vergelijken",
  order: 10,
  description: "Vergelijk twee kwalificatieprofielen",
};

type Slug = string; // e.g. "instructeur-3", "leercoach-4", "pvb_beoordelaar-5"

const options: Array<{ slug: Slug; label: string; richting: PublicRichting; rang: number }> = [
  { slug: "instructeur-1", label: "Instructeur 1 (I1)", richting: "instructeur", rang: 1 },
  { slug: "instructeur-2", label: "Instructeur 2 (I2)", richting: "instructeur", rang: 2 },
  { slug: "instructeur-3", label: "Instructeur 3 (I3)", richting: "instructeur", rang: 3 },
  { slug: "instructeur-4", label: "Instructeur 4 (I4)", richting: "instructeur", rang: 4 },
  { slug: "instructeur-5", label: "Instructeur 5 (I5)", richting: "instructeur", rang: 5 },
  { slug: "leercoach-4", label: "Leercoach 4 (L4)", richting: "leercoach", rang: 4 },
  { slug: "leercoach-5", label: "Leercoach 5 (L5)", richting: "leercoach", rang: 5 },
  { slug: "pvb_beoordelaar-4", label: "PvB-beoordelaar 4 (B4)", richting: "pvb_beoordelaar", rang: 4 },
  { slug: "pvb_beoordelaar-5", label: "PvB-beoordelaar 5 (B5)", richting: "pvb_beoordelaar", rang: 5 },
];

const optionBySlug = new Map(options.map((o) => [o.slug, o]));

async function loadProfiel(slug: Slug): Promise<PublicKssProfiel | null> {
  const opt = optionBySlug.get(slug);
  if (!opt) return null;
  const profielen = await getPublicKssTree({
    rang: opt.rang,
    richting: opt.richting,
  });
  return profielen[0] ?? null;
}

function countCriteria(profiel: PublicKssProfiel): number {
  return profiel.kerntaken.reduce(
    (sum, kt) =>
      sum +
      kt.werkprocessen.reduce((s, wp) => s + wp.beoordelingscriteria.length, 0),
    0,
  );
}

function countWerkprocessen(profiel: PublicKssProfiel): number {
  return profiel.kerntaken.reduce((sum, kt) => sum + kt.werkprocessen.length, 0);
}

const richtingTokens: Record<
  PublicRichting,
  { border: string; soft: string; chip: string }
> = {
  instructeur: {
    border: "border-branding-light/30",
    soft: "bg-branding-light/5",
    chip: "bg-branding-light",
  },
  leercoach: {
    border: "border-branding-orange/30",
    soft: "bg-branding-orange/5",
    chip: "bg-branding-orange",
  },
  pvb_beoordelaar: {
    border: "border-branding-dark/30",
    soft: "bg-branding-dark/5",
    chip: "bg-branding-dark",
  },
};

function StatCell({
  label,
  value,
  diff,
}: {
  label: string;
  value: number;
  diff: number | null;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="text-xl font-semibold text-slate-900">{value}</span>
        {diff !== null && diff !== 0 && (
          <span
            className={`text-xs font-medium ${diff > 0 ? "text-emerald-700" : "text-rose-700"}`}
          >
            {diff > 0 ? "+" : ""}
            {diff}
          </span>
        )}
      </span>
    </div>
  );
}

function Selector({
  name,
  selected,
}: {
  name: "a" | "b";
  selected: Slug;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Kwalificatieprofiel {name.toUpperCase()}
      </span>
      <select
        name={name}
        defaultValue={selected}
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-branding-light focus:outline-none focus:ring-2 focus:ring-branding-light/30"
      >
        {options.map((o) => (
          <option key={o.slug} value={o.slug}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProfielSummary({
  profiel,
  other,
  label,
}: {
  profiel: PublicKssProfiel;
  other: PublicKssProfiel;
  label: string;
}) {
  const t = richtingTokens[profiel.richting];
  const k = profiel.kerntaken.length;
  const w = countWerkprocessen(profiel);
  const c = countCriteria(profiel);
  const ok = other.kerntaken.length;
  const ow = countWerkprocessen(other);
  const oc = countCriteria(other);
  return (
    <div
      className={`flex flex-col gap-4 rounded-2xl border ${t.border} ${t.soft} p-5`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
        <span
          className={`inline-flex items-center rounded-full ${t.chip} px-2.5 py-0.5 text-xs font-semibold text-white`}
        >
          Rang {profiel.niveau.rang}
        </span>
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{profiel.titel}</h2>
      <div className="grid grid-cols-3 gap-4">
        <StatCell label="Kerntaken" value={k} diff={k - ok} />
        <StatCell label="Werkprocessen" value={w} diff={w - ow} />
        <StatCell label="Criteria" value={c} diff={c - oc} />
      </div>
    </div>
  );
}

type KerntaakRow = {
  key: string;
  a?: { titel: string; werkprocessen: number; criteria: number };
  b?: { titel: string; werkprocessen: number; criteria: number };
};

function kerntaakKey(titel: string): string {
  // Strip the leading "PvB N.N - " prefix so we can compare by plain title.
  return titel.replace(/^PvB\s+\d+\.\d+\s*-\s*/, "").trim().toLowerCase();
}

function buildKerntaakMatrix(
  a: PublicKssProfiel,
  b: PublicKssProfiel,
): KerntaakRow[] {
  const map = new Map<string, KerntaakRow>();
  for (const kt of a.kerntaken) {
    const key = kerntaakKey(kt.titel);
    const criteria = kt.werkprocessen.reduce(
      (s, wp) => s + wp.beoordelingscriteria.length,
      0,
    );
    map.set(key, {
      key,
      a: { titel: kt.titel, werkprocessen: kt.werkprocessen.length, criteria },
    });
  }
  for (const kt of b.kerntaken) {
    const key = kerntaakKey(kt.titel);
    const existing = map.get(key) ?? { key };
    const criteria = kt.werkprocessen.reduce(
      (s, wp) => s + wp.beoordelingscriteria.length,
      0,
    );
    existing.b = { titel: kt.titel, werkprocessen: kt.werkprocessen.length, criteria };
    map.set(key, existing);
  }
  return Array.from(map.values()).sort((x, y) => x.key.localeCompare(y.key));
}

function KerntaakMatrix({
  a,
  b,
}: {
  a: PublicKssProfiel;
  b: PublicKssProfiel;
}) {
  const rows = buildKerntaakMatrix(a, b);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-2 text-left font-semibold text-slate-700">
              Kerntaak
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-700">
              {a.titel}
            </th>
            <th className="px-4 py-2 text-left font-semibold text-slate-700">
              {b.titel}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const only = row.a && !row.b ? "a" : !row.a && row.b ? "b" : null;
            return (
              <tr
                key={row.key}
                className="border-t border-slate-100 align-top"
              >
                <td className="px-4 py-3 font-medium text-slate-900">
                  {row.a?.titel ?? row.b?.titel ?? row.key}
                  {only && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                      alleen {only.toUpperCase()}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {row.a ? (
                    <span>
                      <span className="font-mono text-xs text-slate-500">
                        {row.a.werkprocessen} wp · {row.a.criteria} cr
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {row.b ? (
                    <span>
                      <span className="font-mono text-xs text-slate-500">
                        {row.b.werkprocessen} wp · {row.b.criteria} cr
                      </span>
                    </span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default async function VergelijkenPage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const sp = await searchParams;
  const aSlug: Slug =
    sp.a && optionBySlug.has(sp.a) ? sp.a : "instructeur-3";
  const bSlug: Slug =
    sp.b && optionBySlug.has(sp.b) ? sp.b : "instructeur-4";

  const [a, b] = await Promise.all([loadProfiel(aSlug), loadProfiel(bSlug)]);

  return (
    <div className="not-prose flex flex-col gap-6">
      <div className="flex items-start gap-3">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-branding-light/10">
          <ScaleIcon className="size-5 text-branding-light" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">Vergelijken</h1>
          <p className="mt-1 text-sm text-slate-600">
            Zet twee kwalificatieprofielen naast elkaar om te zien welke kerntaken,
            werkprocessen en beoordelingscriteria ze delen en verschillen.
          </p>
        </div>
      </div>

      <form
        method="get"
        className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end"
      >
        <Selector name="a" selected={aSlug} />
        <ArrowRightIcon className="hidden size-5 shrink-0 text-slate-400 sm:mb-2 sm:block" />
        <Selector name="b" selected={bSlug} />
        <button
          type="submit"
          className="mt-1 inline-flex items-center justify-center gap-1 rounded-lg bg-branding-light px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-branding-dark sm:mb-0 sm:ml-auto"
        >
          Vergelijken
        </button>
      </form>

      {a && b ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <ProfielSummary profiel={a} other={b} label="Kwalificatieprofiel A" />
            <ProfielSummary profiel={b} other={a} label="Kwalificatieprofiel B" />
          </div>

          <section className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-slate-900">
              Kerntaken naast elkaar
            </h2>
            <p className="text-sm text-slate-600">
              Een kerntaak wordt als &ldquo;gedeeld&rdquo; beschouwd als de titel
              (na het PvB-prefix) overeenkomt. &ldquo;wp&rdquo; = werkprocessen,
              &ldquo;cr&rdquo; = beoordelingscriteria.
            </p>
            <KerntaakMatrix a={a} b={b} />
          </section>
        </>
      ) : (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Een of beide kwalificatieprofielen zijn niet gevonden. Kies een andere
          combinatie.
        </div>
      )}
    </div>
  );
}
