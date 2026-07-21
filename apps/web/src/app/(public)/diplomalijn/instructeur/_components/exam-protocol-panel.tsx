"use client";

import { ArrowDownTrayIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useMemo, useState } from "react";
import { TekstButton } from "~/app/(public)/_components/style/buttons";
import type { ExamProtocolOption } from "../_lib/resolve-exam-protocol-documents";
import { InfoCard } from "./info-card";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUpdatedAt(iso: string): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

export function ExamProtocolPanel({
  options,
  canDownload,
  loadError = false,
}: {
  options: ExamProtocolOption[];
  canDownload: boolean;
  loadError?: boolean;
}) {
  const [selectedId, setSelectedId] = useState(options[0]?.id ?? "");

  const selected = useMemo(
    () => options.find((option) => option.id === selectedId) ?? options[0],
    [options, selectedId],
  );

  const disciplineOptions = options.filter(
    (option) => option.group === "discipline",
  );
  const generalOptions = options.filter((option) => option.group === "general");

  return (
    <div className="not-prose mt-8 space-y-6">
      <div>
        <label
          htmlFor="exam-protocol-select"
          className="block text-sm font-medium text-slate-700"
        >
          Discipline of protocol
        </label>
        <select
          id="exam-protocol-select"
          value={selected?.id ?? ""}
          onChange={(event) => setSelectedId(event.target.value)}
          className={clsx(
            "mt-2 block w-full max-w-md rounded-lg border border-slate-300 bg-white px-3 py-2.5",
            "text-sm text-slate-900 shadow-sm",
            "focus:border-branding-light focus:outline-none focus:ring-2 focus:ring-branding-light/30",
          )}
        >
          <optgroup label="Disciplines">
            {disciplineOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </optgroup>
          {generalOptions.length > 0 ? (
            <optgroup label="Algemeen">
              {generalOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.title}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
      </div>

      {!canDownload ? (
        <InfoCard
          tone="instructeur"
          icon={<LockClosedIcon className="size-5" />}
          title="Inloggen vereist"
        >
          <p>
            Om het toetsprotocol te downloaden moet je ingelogd zijn als{" "}
            <strong>instructeur</strong> of <strong>locatiebeheerder</strong>.
          </p>
          <p className="mt-3">
            <TekstButton href="/login" className="text-branding-light">
              Inloggen
            </TekstButton>
          </p>
        </InfoCard>
      ) : loadError ? (
        <InfoCard
          tone="neutral"
          icon={<LockClosedIcon className="size-5" />}
          title="Documenten laden mislukt"
        >
          <p>
            De toetsprotocollen konden niet worden opgehaald. Probeer het later
            opnieuw of open de kennisbank via je vaarlocatie na inloggen.
          </p>
        </InfoCard>
      ) : selected?.document ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-base font-semibold text-slate-900">
            {selected.document.name}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            PDF · {formatFileSize(selected.document.size)} · bijgewerkt{" "}
            {formatUpdatedAt(selected.document.updatedAt)}
          </p>
          <div className="mt-4">
            <a
              href={`/kennisbank/${selected.document.id}?download=1`}
              className={clsx(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold",
                "bg-branding-dark text-white transition-colors hover:bg-branding-dark/90",
              )}
            >
              <ArrowDownTrayIcon className="size-4" aria-hidden="true" />
              Download PDF
            </a>
          </div>
        </div>
      ) : (
        <InfoCard
          tone="neutral"
          icon={<LockClosedIcon className="size-5" />}
          title="Protocol niet beschikbaar"
        >
          <p>
            Voor {selected?.title ?? "deze selectie"} is nog geen exameneisen-PDF
            gevonden in de kennisbank. Neem contact op met je vaarlocatie of
            bekijk alle documenten in de kennisbank na inloggen.
          </p>
        </InfoCard>
      )}

      <p className="text-sm text-slate-600">
        Alle toetsprotocollen staan ook in de{" "}
        <a
          href="/help/artikel/cohorten-gebruiken-als-instructeur"
          className="font-semibold text-branding-light hover:underline"
        >
          kennisbank van je vaarlocatie
        </a>
        . Zie de handleiding voor instructeurs voor de exacte plek.
      </p>
    </div>
  );
}
