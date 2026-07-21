import clsx from "clsx";
import type { ViewMode } from "./types";

const modes: Array<{ value: ViewMode; label: string; desktopLabel: string }> = [
  {
    value: "beschrijving",
    label: "Beschrijving",
    desktopLabel: "Beschrijving",
  },
  {
    value: "verschil",
    label: "Verschil",
    desktopLabel: "Verschil uitlichten",
  },
];

export function ModeToggle({
  value,
  onChange,
}: {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Weergavemodus"
      className="inline-flex w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1 sm:w-auto"
    >
      {modes.map((mode) => {
        const selected = value === mode.value;
        return (
          <button
            key={mode.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(mode.value)}
            className={clsx(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors sm:flex-none sm:px-4",
              selected
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            <span className="sm:hidden">{mode.label}</span>
            <span className="hidden sm:inline">{mode.desktopLabel}</span>
          </button>
        );
      })}
    </div>
  );
}
