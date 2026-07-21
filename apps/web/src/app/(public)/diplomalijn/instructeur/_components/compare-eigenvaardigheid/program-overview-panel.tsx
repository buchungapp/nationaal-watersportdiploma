import { LevelHeader } from "./level-chip";
import type { CompareLevel } from "./types";

export function ProgramOverviewPanel({
  level,
  canViewRequirements,
}: {
  level: CompareLevel;
  canViewRequirements: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/5">
      <div className="border-b border-zinc-200 px-3 py-2 sm:px-4">
        <LevelHeader label={level.label} letter={level.letter} />
      </div>

      <div className="space-y-5 p-3 sm:p-4">
        {level.modules.map((module) => (
          <section key={module.moduleId}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {module.title}
            </h3>
            {canViewRequirements ? (
              <div className="space-y-1.5">
                {module.competencies.map((competency) => (
                  <article
                    key={`${module.moduleId}::${competency.competencyId}`}
                    className="overflow-hidden rounded-lg border border-zinc-200"
                  >
                    <div className="bg-zinc-50 px-3 py-2">
                      <h4 className="text-sm font-semibold text-zinc-900">
                        {competency.title}
                      </h4>
                    </div>
                    <div className="px-3 py-2">
                      {competency.requirement ? (
                        <p className="text-sm leading-snug text-zinc-700">
                          {competency.requirement}
                        </p>
                      ) : (
                        <p className="text-sm text-zinc-400">—</p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 pl-0 list-none">
                {module.competencies.map((competency) => (
                  <li
                    key={`${module.moduleId}::${competency.competencyId}`}
                    className="py-1 text-sm font-medium text-zinc-900"
                  >
                    {competency.title}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
