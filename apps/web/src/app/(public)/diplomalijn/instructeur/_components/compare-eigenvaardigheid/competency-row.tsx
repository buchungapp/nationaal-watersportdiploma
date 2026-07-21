import { DiffText } from "./diff-text";
import { LevelHeader } from "./level-chip";
import type { CompareRow, ViewMode } from "./types";

function RequirementText({
  text,
  mode,
  aText,
  bText,
}: {
  text: string;
  mode: ViewMode;
  aText: string;
  bText: string;
}) {
  if (!text) {
    return <p className="text-sm text-zinc-400">—</p>;
  }

  return (
    <p className="text-sm leading-snug text-zinc-700">
      {mode === "verschil" ? <DiffText aText={aText} bText={bText} /> : text}
    </p>
  );
}

function DesktopCells({ row, mode }: { row: CompareRow; mode: ViewMode }) {
  return (
    <>
      <div className="border-t border-zinc-200 bg-white px-3 py-2">
        <p className="text-sm leading-snug text-zinc-700">
          {row.aText ? row.aText : <span className="text-zinc-400">—</span>}
        </p>
      </div>
      <div className="border-t border-l border-zinc-200 bg-[rgba(0,127,255,0.05)] px-3 py-2">
        <RequirementText
          text={row.bText}
          mode={mode}
          aText={row.aText}
          bText={row.bText}
        />
      </div>
    </>
  );
}

function MobileSections({
  row,
  mode,
  leftLabel,
  rightLabel,
  leftLetter,
  rightLetter,
}: {
  row: CompareRow;
  mode: ViewMode;
  leftLabel: string;
  rightLabel: string;
  leftLetter: string;
  rightLetter: string;
}) {
  return (
    <>
      <div className="border-t border-zinc-200 bg-white px-3 py-2">
        <LevelHeader label={leftLabel} letter={leftLetter} variant="section" />
        <div className="mt-1.5">
          <p className="text-sm leading-snug text-zinc-700">
            {row.aText ? row.aText : <span className="text-zinc-400">—</span>}
          </p>
        </div>
      </div>
      <div className="border-t border-zinc-200 bg-[rgba(0,127,255,0.06)] px-3 py-2">
        <LevelHeader
          label={rightLabel}
          letter={rightLetter}
          variant="section"
        />
        <div className="mt-1.5">
          <RequirementText
            text={row.bText}
            mode={mode}
            aText={row.aText}
            bText={row.bText}
          />
        </div>
      </div>
    </>
  );
}

export function CompetencyRow({
  row,
  mode,
  leftLabel,
  rightLabel,
  leftLetter,
  rightLetter,
  canViewRequirements,
}: {
  row: CompareRow;
  mode: ViewMode;
  leftLabel: string;
  rightLabel: string;
  leftLetter: string;
  rightLetter: string;
  canViewRequirements: boolean;
}) {
  if (!canViewRequirements) {
    return (
      <p className="py-1 text-sm font-medium text-zinc-900">{row.title}</p>
    );
  }

  return (
    <article className="overflow-hidden rounded-lg border border-zinc-200">
      <div className="bg-zinc-50 px-3 py-2">
        <h4 className="text-sm font-semibold text-zinc-900">{row.title}</h4>
      </div>

      <div className="hidden min-[900px]:grid min-[900px]:grid-cols-2">
        <DesktopCells row={row} mode={mode} />
      </div>

      <div className="min-[900px]:hidden">
        <MobileSections
          row={row}
          mode={mode}
          leftLabel={leftLabel}
          rightLabel={rightLabel}
          leftLetter={leftLetter}
          rightLetter={rightLetter}
        />
      </div>
    </article>
  );
}
