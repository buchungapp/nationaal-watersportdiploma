import { AiCorpus } from "@nawadi/core";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "~/lib/supabase/server";
import { PriorPortfolioList } from "./_components/PriorPortfolioList";
import { PriorPortfolioUploadForm } from "./_components/PriorPortfolioUploadForm";

export const metadata: Metadata = {
  title: "Leercoach · eerdere portfolio's",
  robots: { index: false, follow: false },
};

// Management surface for user-uploaded prior PvB portfolios. The layout
// above this page handles auth; anonymous users never reach this
// component.
export default async function PriorPortfoliosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const priors = await AiCorpus.listUserPriorSources({ userId: user.id });

  return (
    <main className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <Link
          href="/leercoach"
          className="text-sm text-slate-600 hover:text-slate-900"
        >
          ← Terug naar leercoach
        </Link>
        <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
          Jouw eerdere portfolio's
        </h1>
        <p className="max-w-2xl text-slate-700">
          Upload PvB-portfolio's die je eerder hebt geschreven (voor lagere
          niveaus). Je leercoach kan dan naar die tekst verwijzen zonder dat
          je alles opnieuw hoeft te vertellen.
        </p>
        <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <p className="font-semibold text-slate-900">
            Privacy &amp; anonimisering
          </p>
          <p className="mt-1">
            Je PDF wordt server-side verwerkt: we halen namen, locaties, dates
            en verenigingsnamen eruit voordat iets opgeslagen wordt. De
            geanonimiseerde tekst is alleen voor jouw account beschikbaar —
            geen andere kandidaat ziet deze inhoud.
          </p>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-slate-900">Nieuwe upload</h2>
        <PriorPortfolioUploadForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Geüpload ({priors.length})
        </h2>
        <PriorPortfolioList priors={priors} />
      </section>
    </main>
  );
}
