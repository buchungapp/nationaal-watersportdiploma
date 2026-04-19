"use client";

import { useState, useTransition } from "react";
import type { GenerateDraftResult, GenerateQuestionsResult } from "../actions";
import { generateDraft, generateQuestions, getOutline } from "../actions";
import type { OutlineTemplate, ProfielSummary } from "../types";
import { DraftView } from "./DraftView";
import { OutlinePreview } from "./OutlinePreview";
import { ProfielSelector } from "./ProfielSelector";
import { QuestionForm } from "./QuestionForm";

type Screen =
  | { kind: "idle" }
  | { kind: "loading-outline" }
  | {
      kind: "outline-preview";
      outline: OutlineTemplate;
    }
  | {
      kind: "generating-questions";
      outline: OutlineTemplate;
    }
  | {
      kind: "answering";
      outline: OutlineTemplate;
      questions: GenerateQuestionsResult;
      answers: Record<string, string>;
    }
  | {
      kind: "generating-draft";
      outline: OutlineTemplate;
      questions: GenerateQuestionsResult;
      answers: Record<string, string>;
    }
  | {
      kind: "done";
      outline: OutlineTemplate;
      questions: GenerateQuestionsResult;
      draft: GenerateDraftResult;
    }
  | { kind: "error"; message: string; previous: Screen };

type Props = {
  profielen: ProfielSummary[];
};

export function Shell({ profielen }: Props) {
  const [profielId, setProfielId] = useState<string | null>(null);
  const [screen, setScreen] = useState<Screen>({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const goIdle = () => {
    setProfielId(null);
    setScreen({ kind: "idle" });
  };

  const handleLoadOutline = () => {
    if (!profielId) return;
    const previous: Screen = { kind: "idle" };
    setScreen({ kind: "loading-outline" });
    startTransition(async () => {
      try {
        const outline = await getOutline({ profielId });
        if (!outline) {
          setScreen({
            kind: "error",
            message:
              "Er is nog geen outline-template voor dit profiel. Vraag de beheerder om corpus:build-outline-templates te draaien.",
            previous,
          });
          return;
        }
        setScreen({ kind: "outline-preview", outline });
      } catch (e) {
        setScreen({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
          previous,
        });
      }
    });
  };

  const handleGenerateQuestions = (outline: OutlineTemplate) => {
    const previous: Screen = { kind: "outline-preview", outline };
    setScreen({ kind: "generating-questions", outline });
    startTransition(async () => {
      try {
        const result = await generateQuestions({
          profielId: outline.profielId,
        });
        setScreen({
          kind: "answering",
          outline,
          questions: result,
          answers: {},
        });
      } catch (e) {
        setScreen({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
          previous,
        });
      }
    });
  };

  const handleGenerateDraft = (
    outline: OutlineTemplate,
    questions: GenerateQuestionsResult,
    answers: Record<string, string>,
  ) => {
    const previous: Screen = {
      kind: "answering",
      outline,
      questions,
      answers,
    };
    setScreen({ kind: "generating-draft", outline, questions, answers });
    startTransition(async () => {
      try {
        const result = await generateDraft({
          profielId: questions.profielId,
          questions: questions.questions,
          answers: Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer,
          })),
        });
        setScreen({ kind: "done", outline, questions, draft: result });
      } catch (e) {
        setScreen({
          kind: "error",
          message: e instanceof Error ? e.message : String(e),
          previous,
        });
      }
    });
  };

  if (screen.kind === "error") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-red-300 bg-red-50 p-6 text-red-900">
        <h2 className="text-lg font-semibold">Er ging iets mis</h2>
        <pre className="whitespace-pre-wrap font-mono text-sm">
          {screen.message}
        </pre>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setScreen(screen.previous)}
            className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-900 transition-colors hover:bg-red-100"
          >
            Terug
          </button>
          <button
            type="button"
            onClick={goIdle}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800"
          >
            Opnieuw beginnen
          </button>
        </div>
      </div>
    );
  }

  if (screen.kind === "done") {
    return (
      <DraftView
        profielTitel={screen.draft.profielTitel}
        drafts={screen.draft.drafts}
        outline={screen.outline}
        elapsedMs={screen.draft.elapsedMs}
        failedWerkprocessen={screen.draft.failedWerkprocessen}
        onRestart={goIdle}
      />
    );
  }

  if (screen.kind === "outline-preview") {
    return (
      <OutlinePreview
        outline={screen.outline}
        disabled={isPending}
        onContinue={() => handleGenerateQuestions(screen.outline)}
        onBack={goIdle}
      />
    );
  }

  if (screen.kind === "answering" || screen.kind === "generating-draft") {
    const answering = screen.kind === "answering";
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-baseline gap-2 text-sm text-slate-600">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-700">
            Stap 2 van 3 · Vragen beantwoorden
          </span>
        </div>
        <div className="flex flex-wrap items-baseline gap-2 text-sm text-slate-600">
          <span className="font-semibold text-slate-900">
            {screen.questions.profielTitel}
          </span>
          <span>
            · {screen.questions.questions.length} vragen ·{" "}
            {screen.questions.totalWerkprocessen} werkprocessen ·{" "}
            {screen.questions.totalCriteria} criteria
          </span>
          <span className="text-xs text-slate-500">
            Vragen gegenereerd in{" "}
            {(screen.questions.elapsedMs / 1000).toFixed(1)}s
          </span>
        </div>
        {screen.kind === "generating-draft" ? (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-blue-900">
            <p className="font-semibold">Schrijft concept…</p>
            <p className="mt-1 text-sm">
              Eén call per werkproces, parallel. Reken op 6 tot 15 seconden.
            </p>
          </div>
        ) : null}
        <QuestionForm
          questions={screen.questions.questions}
          answers={screen.answers}
          disabled={!answering || isPending}
          onAnswerChange={(questionId, value) => {
            if (!answering) return;
            setScreen((s) =>
              s.kind === "answering"
                ? { ...s, answers: { ...s.answers, [questionId]: value } }
                : s,
            );
          }}
          onSubmit={() => {
            if (!answering) return;
            handleGenerateDraft(
              screen.outline,
              screen.questions,
              screen.answers,
            );
          }}
          onBack={goIdle}
        />
      </div>
    );
  }

  // idle, loading-outline, or generating-questions
  const loading =
    screen.kind === "loading-outline" || screen.kind === "generating-questions";
  return (
    <div className="flex flex-col gap-6">
      <ProfielSelector
        profielen={profielen}
        value={profielId}
        onChange={setProfielId}
        disabled={loading || isPending}
      />
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleLoadOutline}
          disabled={!profielId || loading || isPending}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {screen.kind === "loading-outline"
            ? "Structuur laden…"
            : screen.kind === "generating-questions"
              ? "Vragen worden gegenereerd…"
              : "Start"}
        </button>
      </div>
      {loading ? (
        <p className="text-sm text-slate-600">
          {screen.kind === "loading-outline"
            ? "Een moment — we laden de structuur van jouw portfolio."
            : "Eén call, reken op 4 tot 10 seconden."}
        </p>
      ) : (
        <p className="text-sm text-slate-500">
          De sandbox is opzettelijk minimaal: profiel kiezen, een handvol vragen
          beantwoorden, conceptbewijs krijgen. Geen opslag, geen export; je
          kopieert het resultaat handmatig.
        </p>
      )}
    </div>
  );
}
