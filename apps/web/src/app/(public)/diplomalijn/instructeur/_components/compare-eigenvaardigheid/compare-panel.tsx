import { CompetencyRow } from "./competency-row";
import { LevelHeader } from "./level-chip";
import type { CompareModuleGroup, ViewMode } from "./types";

export function ComparePanel({
  groups,
  mode,
  leftLabel,
  rightLabel,
  leftLetter,
  rightLetter,
  canViewRequirements,
}: {
  groups: CompareModuleGroup[];
  mode: ViewMode;
  leftLabel: string;
  rightLabel: string;
  leftLetter: string;
  rightLetter: string;
  canViewRequirements: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm shadow-zinc-900/5">
      <div className="sticky top-0 z-10 hidden border-b border-zinc-200 bg-white min-[900px]:grid min-[900px]:grid-cols-2">
        <div className="px-3 py-2">
          <LevelHeader label={leftLabel} letter={leftLetter} />
        </div>
        <div className="border-l border-zinc-200 bg-[rgba(0,127,255,0.10)] px-3 py-2">
          <LevelHeader label={rightLabel} letter={rightLetter} />
        </div>
      </div>

      <div className="space-y-5 p-3 sm:p-4">
        {groups.map((group) => (
          <section key={group.moduleId}>
            <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-zinc-400">
              {group.moduleTitle}
            </h3>
            {canViewRequirements ? (
              <div className="space-y-1.5">
                {group.competencies.map((row) => (
                  <CompetencyRow
                    key={row.rowKey}
                    row={row}
                    mode={mode}
                    leftLabel={leftLabel}
                    rightLabel={rightLabel}
                    leftLetter={leftLetter}
                    rightLetter={rightLetter}
                    canViewRequirements={canViewRequirements}
                  />
                ))}
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100 pl-0 list-none">
                {group.competencies.map((row) => (
                  <li key={row.rowKey}>
                    <CompetencyRow
                      row={row}
                      mode={mode}
                      leftLabel={leftLabel}
                      rightLabel={rightLabel}
                      leftLetter={leftLetter}
                      rightLetter={rightLetter}
                      canViewRequirements={canViewRequirements}
                    />
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
