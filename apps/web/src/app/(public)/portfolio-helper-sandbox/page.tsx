import type { Metadata } from "next";
import { Shell } from "./_components/Shell";
import { listSelectableProfielen } from "./rubric";

export const metadata: Metadata = {
  title: "Portfolio helper (sandbox)",
  description:
    "Interne sandbox voor de PvB portfolio-helper. Nog niet voor publieke gebruikers.",
  robots: {
    index: false,
    follow: false,
  },
};

// Server component: loads the selectable profielen and hands them to the client shell.
export default async function PortfolioHelperSandboxPage() {
  const profielen = await listSelectableProfielen();

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10 sm:py-16">
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
          schrijven. Geen opslag, geen account, geen export — je kopieert het
          resultaat waar je het wilt plakken.
        </p>
      </header>

      <Shell profielen={profielen} />

      <footer className="mt-8 border-t border-slate-200 pt-6 text-xs text-slate-500">
        <p>
          Dit is een ontwikkel-sandbox op <code>/portfolio-helper-sandbox</code>
          . Wordt vervangen door de echte publieke route bij Phase 2.
        </p>
      </footer>
    </main>
  );
}
