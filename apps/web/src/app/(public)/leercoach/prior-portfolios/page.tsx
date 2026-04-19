import { AiCorpus } from "@nawadi/core";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "~/lib/supabase/server";
import { PriorPortfolioDropZone } from "./_components/PriorPortfolioDropZone";
import { PriorPortfolioList } from "./_components/PriorPortfolioList";

export const metadata: Metadata = {
  title: "Leercoach · eerdere portfolio's",
  robots: { index: false, follow: false },
};

// Management view for previously uploaded prior-portfolio PDFs.
//
// Two upload entry points, both going through the same server pipeline
// + the same shared dialog component:
//   1. Primary: inline 📎 button inside a leercoach chat session
//      (UploadPriorPortfolioInline). Conversational metaphor.
//   2. Secondary (this page): drag-and-drop or click-to-select on the
//      management view. For users who want to audit + add without
//      starting a chat.
export default async function PriorPortfoliosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const priors = await AiCorpus.listUserPriorSources({ userId: user.id });
  const hasExistingUploads = priors.length > 0;

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
          Hier zie je wat je eerder hebt geüpload. Voeg een nieuwe toe door
          een PDF op het drop-veld hieronder te slepen, of upload tijdens
          een leercoach-sessie via de{" "}
          <span className="font-mono text-xs">📎 Eerder portfolio uploaden</span>
          -knop boven het invoerveld.
        </p>
      </header>

      {hasExistingUploads ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-slate-900">
            Opgeslagen ({priors.length})
          </h2>
          <PriorPortfolioList priors={priors} />
          <PriorPortfolioDropZone hasExistingUploads={true} />
        </section>
      ) : (
        <section className="flex flex-col gap-4">
          <PriorPortfolioDropZone hasExistingUploads={false} />
        </section>
      )}
    </main>
  );
}
