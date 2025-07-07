"use client";
import clsx from "clsx";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useTransition } from "react";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";

export type DashboardView = "instructor" | "student";

const dashboardViewParser = parseAsStringEnum<DashboardView>([
  "instructor",
  "student",
]).withDefault("instructor");

const viewLabels: Record<DashboardView, string> = {
  instructor: "Instructeur",
  student: "Consument",
};

export function DashboardToggle() {
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useQueryState(
    "view",
    dashboardViewParser.withOptions({ shallow: false, startTransition }),
  );

  const handleViewChange = (newView: DashboardView) => {
    setView(newView);
  };

  return (
    <>
      {/* Mobile: Listbox */}
      <div className="md:hidden">
        <Listbox
          value={view}
          onChange={handleViewChange}
          className={clsx(
            "transition-opacity duration-200",
            isPending && "opacity-60",
          )}
          aria-label="Kies een weergave"
        >
          {(["instructor", "student"] as const).map((viewOption) => (
            <ListboxOption key={viewOption} value={viewOption}>
              <ListboxLabel
                className={clsx(
                  "transition-colors duration-200",
                  isPending && view === viewOption && "animate-pulse",
                )}
              >
                {viewLabels[viewOption]}
              </ListboxLabel>
            </ListboxOption>
          ))}
        </Listbox>
      </div>

      {/* Desktop: Toggle */}
      <fieldset className="hidden md:block">
        <legend className="sr-only">Kies een weergave</legend>
        <div className="flex items-center gap-x-2 rounded-lg bg-gray-100 p-1">
          {(["instructor", "student"] as const).map((viewOption) => (
            <label
              key={viewOption}
              aria-label={viewOption}
              className={clsx(
                "group relative flex items-center justify-center rounded-md px-4 py-2",
                "transition-all duration-200 ease-in-out cursor-pointer",
                {
                  "bg-white shadow-sm": view === viewOption,
                  "hover:bg-gray-50": view !== viewOption,
                  "opacity-60": isPending,
                },
              )}
            >
              <input
                value={viewOption}
                checked={view === viewOption}
                onChange={() => handleViewChange(viewOption)}
                name="dashboard-view"
                type="radio"
                className="absolute inset-0 appearance-none focus:outline-none"
              />
              <span
                className={clsx(
                  "text-sm font-medium transition-colors duration-200",
                  {
                    "text-gray-900": view === viewOption,
                    "text-gray-600 group-hover:text-gray-900":
                      view !== viewOption,
                    "animate-pulse": isPending && view === viewOption,
                  },
                )}
              >
                {viewLabels[viewOption]}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
