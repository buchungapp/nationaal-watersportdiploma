"use client";
import clsx from "clsx";
import { redirect } from "next/navigation";
import { parseAsStringEnum, useQueryState } from "nuqs";
import { useTransition } from "react";
import {
  Listbox,
  ListboxLabel,
  ListboxOption,
} from "~/app/(dashboard)/_components/listbox";

const dashboardViews = ["instructor", "student"] as const;
const redirectViews = { secretariaat: "/secretariaat" } as const;

export type DashboardView = (typeof dashboardViews)[number];
export type RedirectView = keyof typeof redirectViews;

const dashboardViewParser = parseAsStringEnum<DashboardView>([
  "instructor",
  "student",
]);

const viewLabels: Record<DashboardView | RedirectView, string> = {
  instructor: "Instructeur",
  student: "Consument",
  secretariaat: "Secretariaat",
};

export function DashboardToggle({
  views,
}: {
  views: (DashboardView | RedirectView)[];
}) {
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useQueryState(
    "view",
    dashboardViewParser
      .withDefault(
        views.find((v) =>
          dashboardViews.includes(v as DashboardView),
        ) as DashboardView,
      )
      .withOptions({
        shallow: false,
        startTransition,
      }),
  );

  const handleViewChange = (newView: DashboardView | RedirectView) => {
    if (newView in redirectViews) {
      redirect(redirectViews[newView as RedirectView]);
    }

    setView(newView as DashboardView);
  };

  return (
    <>
      {/* Mobile: Listbox */}
      <div className="md:hidden">
        <Listbox
          value={view as DashboardView | RedirectView}
          onChange={handleViewChange}
          className={clsx(
            "transition-opacity duration-200",
            isPending && "opacity-60",
          )}
          aria-label="Kies een weergave"
        >
          {views.map((viewOption) => (
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
      <fieldset className="hidden md:block -my-1">
        <legend className="sr-only">Kies een weergave</legend>
        <div className="flex items-center gap-x-2 bg-gray-100 p-1 rounded-lg">
          {views.map((viewOption) => (
            <label
              key={viewOption}
              aria-label={viewOption}
              className={clsx(
                "group relative flex justify-center items-center px-4 py-2 rounded-md",
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
                className="absolute inset-0 focus:outline-none appearance-none"
              />
              <span
                className={clsx(
                  "font-medium text-sm transition-colors duration-200",
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
