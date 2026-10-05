import clsx from "clsx";
import { useId } from "react";
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
  const groupName = useId();

  return (
    <fieldset className="inline-flex w-full rounded-lg border border-zinc-200 bg-zinc-50 p-1 sm:w-auto">
      <legend className="sr-only">Weergavemodus</legend>
      {modes.map((mode) => {
        const selected = value === mode.value;
        return (
          <label
            key={mode.value}
            className="flex-1 cursor-pointer sm:flex-none"
          >
            <input
              type="radio"
              name={groupName}
              value={mode.value}
              checked={selected}
              onChange={() => onChange(mode.value)}
              aria-label={mode.desktopLabel}
              className="peer sr-only"
            />
            <span
              className={clsx(
                "block rounded-md px-3 py-2 text-center text-sm font-medium transition-colors sm:px-4",
                "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-branding-light",
                selected
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900",
              )}
            >
              <span className="sm:hidden">{mode.label}</span>
              <span className="hidden sm:inline">{mode.desktopLabel}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
