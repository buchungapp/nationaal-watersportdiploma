import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "~/lib/supabase/server";
import { Shell } from "./_components/Shell";
import { listSelectableProfielen } from "./rubric";

export const metadata: Metadata = {
  title: "Portfolio helper (sandbox)",
  description:
    "Interne sandbox voor de PvB portfolio-helper. Bevroren prototype — vervangen door /leercoach.",
  robots: {
    index: false,
    follow: false,
  },
};

// Server component: loads the selectable profielen and hands them to the
// client shell. Auth-gated (P0 decision, 2026-04-19): the Phase 1 sandbox is
// frozen but kept live for internal testing. Anonymous users are sent to
// login with redirectTo pointing back here.
export default async function PortfolioHelperSandboxPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/portfolio-helper-sandbox");
  }

  const profielen = await listSelectableProfielen();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
      {/* Freeze banner — per P0 decision in leercoach-pivot.md.
         Stage B fewshot remains on; this UI is kept live so validation
         continues, but users are told a better product is in the pipeline. */}
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Bevroren prototype</p>
        <p className="mt-1">
          Dit is de eerste versie van de portfolio-helper. We hebben geleerd
          dat een gesprek-gestuurde leercoach veel beter past bij hoe
          kandidaten echt een portfolio schrijven, en daar werken we nu aan.
          Deze sandbox blijft beschikbaar voor validatie, maar krijgt geen
          nieuwe functionaliteit meer. Een volwaardige <code>/leercoach</code>
          -route komt binnenkort.
        </p>
      </div>

      <header className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">
          Sandbox · niet publiek
        </p>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Portfolio-helper
        </h1>
        <p className="max-w-2xl text-slate-700">
          Minimale validatie-slice. Kies een kwalificatieprofiel, beantwoord een
          handvol vragen, en laat de helper per criterium een conceptbewijs
          schrijven. Geen opslag, geen export — je kopieert het resultaat waar
          je het wilt plakken.
        </p>
      </header>

      <Shell profielen={profielen} />

      <footer className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p>
          Dit is een ontwikkel-sandbox op <code>/portfolio-helper-sandbox</code>
          . Wordt vervangen door <code>/leercoach</code> wanneer die route live
          gaat.
        </p>
      </footer>
    </main>
  );
}
