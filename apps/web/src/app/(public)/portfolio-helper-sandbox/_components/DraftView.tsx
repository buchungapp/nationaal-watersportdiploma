"use client";

import { useState } from "react";
import { draftWithOutlineToPlainText, werkprocesToPlainText } from "../prompts";
import type { WerkprocesDraft } from "../schemas";
import type { OutlineTemplate } from "../types";

type Props = {
  profielTitel: string;
  drafts: WerkprocesDraft[];
  outline: OutlineTemplate;
  elapsedMs: number;
  failedWerkprocessen: Array<{ werkprocesId: string; reason: string }>;
  onRestart: () => void;
};

export function DraftView({
  profielTitel,
  drafts,
  outline,
  elapsedMs,
  failedWerkprocessen,
  onRestart,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  async function copy(label: string, text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(
        () => setCopied((current) => (current === label ? null : current)),
        2000,
      );
    } catch (e) {
      console.error("Clipboard write failed", e);
      alert("Kopiëren naar klembord lukte niet. Selecteer de tekst handmatig.");
    }
  }

  const fullText = draftWithOutlineToPlainText({ outline, drafts });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => copy("all", fullText)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          {copied === "all" ? "Gekopieerd!" : "Kopieer volledig portfolio"}
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
        >
          Opnieuw beginnen
        </button>
        <span className="text-xs text-slate-500">
          Gegenereerd in {(elapsedMs / 1000).toFixed(1)}s · {drafts.length}{" "}
          werkproces
          {drafts.length === 1 ? "" : "sen"}
        </span>
      </div>

      {failedWerkprocessen.length > 0 ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">
            {failedWerkprocessen.length} werkproces
            {failedWerkprocessen.length === 1 ? "" : "sen"} faalde; de rest is
            er wel.
          </p>
          <ul className="mt-2 list-disc pl-5">
            {failedWerkprocessen.map((f) => (
              <li key={f.werkprocesId}>
                <code className="text-xs">{f.werkprocesId}</code>: {f.reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <article className="flex flex-col gap-10">
        <header>
          <h2 className="text-2xl font-bold text-slate-900">
            Portfolio {profielTitel}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Concept gegenereerd. Controleer en bewerk voordat je dit indient.
          </p>
        </header>

        {drafts
          .slice()
          .sort((a, b) => a.werkprocesTitel.localeCompare(b.werkprocesTitel))
          .map((wp) => (
            <section
              key={wp.werkprocesId}
              className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-xl font-semibold text-slate-900">
                  {wp.werkprocesTitel}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    copy(wp.werkprocesId, werkprocesToPlainText(wp))
                  }
                  className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50"
                >
                  {copied === wp.werkprocesId
                    ? "Gekopieerd!"
                    : "Kopieer dit blok"}
                </button>
              </div>

              <div className="flex flex-col gap-5">
                {wp.criteria.map((c) => (
                  <div key={c.criteriumId} className="flex flex-col gap-1">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
                      {c.criteriumTitel}
                    </h4>
                    <p className="whitespace-pre-line text-slate-800">
                      {c.bewijs}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
      </article>
    </div>
  );
}
