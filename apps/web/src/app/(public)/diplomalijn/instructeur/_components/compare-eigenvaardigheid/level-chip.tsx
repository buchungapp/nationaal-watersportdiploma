export function LevelChip({ letter }: { letter: string }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md bg-branding-dark text-sm font-semibold text-white"
    >
      {letter}
    </span>
  );
}

export function LevelHeader({
  label,
  letter,
  variant = "column",
}: {
  label: string;
  letter: string;
  variant?: "column" | "section";
}) {
  return (
    <div className="flex items-center gap-2">
      <LevelChip letter={letter} />
      <span
        className={
          variant === "section"
            ? "text-xs font-semibold uppercase tracking-wide text-zinc-500"
            : "text-sm font-semibold text-zinc-900"
        }
      >
        {label}
      </span>
    </div>
  );
}
