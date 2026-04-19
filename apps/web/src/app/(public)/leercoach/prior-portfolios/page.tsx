import { AiCorpus } from "@nawadi/core";
import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "~/lib/supabase/server";
import { PriorPortfolioList } from "./_components/PriorPortfolioList";

export const metadata: Metadata = {
  title: "Leercoach · eerdere portfolio's",
  robots: { index: false, follow: false },
};

// Management view for previously uploaded prior-portfolio PDFs.
//
// Upload happens INSIDE a leercoach chat session (see
// _components/UploadPriorPortfolioInline.tsx) — that's the primary and
// only entry point. This page is for after-the-fact management:
// seeing what's stored, deleting what's no longer relevant.
//
// Rationale: uploading is a conversational action ("here's my N3
// portfolio, can you read it?"). Extracting it to a separate route
// broke that metaphor and forced a context switch. Management is
// a separate mental model and earns its own route.
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
          Hier zie je wat je tijdens je leercoach-sessies hebt geüpload.
          Wil je iets toevoegen? Open een chat en gebruik de knop{" "}
          <span className="font-mono text-xs">📎 Eerder portfolio uploaden</span>{" "}
          boven het invoerveld.
        </p>
      </header>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-slate-900">
          Opgeslagen ({priors.length})
        </h2>
        <PriorPortfolioList priors={priors} />
      </section>
    </main>
  );
}
