"use client";

import type { Question } from "../schemas";

type Props = {
  questions: Question[];
  answers: Record<string, string>;
  onAnswerChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  disabled?: boolean;
};

export function QuestionForm({
  questions,
  answers,
  onAnswerChange,
  onSubmit,
  onBack,
  disabled,
}: Props) {
  // Group questions by werkproces, preserving the order in which the LLM emitted them.
  const groups = questions.reduce<
    Array<{ werkprocesId: string; werkprocesTitel: string; items: Question[] }>
  >((acc, q) => {
    const existing = acc.find((g) => g.werkprocesId === q.werkprocesId);
    if (existing) {
      existing.items.push(q);
    } else {
      acc.push({
        werkprocesId: q.werkprocesId,
        werkprocesTitel: q.werkprocesTitel,
        items: [q],
      });
    }
    return acc;
  }, []);

  const answered = questions.filter(
    (q) => (answers[q.id] ?? "").trim().length > 0,
  ).length;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="flex flex-col gap-8"
    >
      <div className="flex items-baseline justify-between">
        <p className="text-sm text-slate-600">
          {answered} van {questions.length} vragen beantwoord.
        </p>
        <p className="text-xs text-slate-500">
          Je hoeft niet alles in te vullen. Werkprocessen zonder antwoord slaan
          we over bij het schrijven.
        </p>
      </div>

      {groups.map((group) => (
        <fieldset
          key={group.werkprocesId}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <legend className="px-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
            {group.werkprocesTitel}
          </legend>
          <div className="flex flex-col gap-5">
            {group.items.map((q) => (
              <div key={q.id} className="flex flex-col gap-2">
                <label className="flex flex-col gap-2">
                  <span className="text-slate-900">{q.prompt}</span>
                  <textarea
                    value={answers[q.id] ?? ""}
                    onChange={(e) => onAnswerChange(q.id, e.target.value)}
                    disabled={disabled}
                    rows={4}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                    placeholder="Beschrijf een concrete situatie…"
                  />
                </label>
              </div>
            ))}
          </div>
        </fieldset>
      ))}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={disabled || answered === 0}
          className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Genereer concept
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          Ander profiel kiezen
        </button>
      </div>
    </form>
  );
}
