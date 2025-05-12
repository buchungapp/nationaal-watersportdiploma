"use client";
import clsx from "clsx";
import {
  BarChart,
  type TooltipProps,
} from "~/app/(dashboard)/_components/charts/bar-chart";
import { getColorClassName } from "~/app/(dashboard)/_components/charts/chart-utils";

export function CertificatesBarChart({
  data,
  categories,
}: {
  data: Record<string, number>[];
  categories: string[];
}) {
  return (
    <BarChart
      customTooltip={TooltipWithTotal}
      data={data}
      index="week"
      categories={categories}
      colors={["blue", "violet", "fuchsia", "cyan"]}
      yAxisWidth={60}
      showLegend={false}
      type="stacked"
      className="mt-12 h-72 antialiased"
    />
  );
}

function TooltipWithTotal({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className={clsx(
          // base
          "rounded-md border text-sm shadow-md",
          // border color
          "border-gray-200 dark:border-gray-800",
          // background color
          "bg-white dark:bg-gray-950",
        )}
      >
        <div className={clsx("px-4 py-2 border-inherit border-b")}>
          <div className="flex justify-between items-center space-x-8">
            <p
              className={clsx(
                // base
                "font-medium",
                // text color
                "text-gray-900 dark:text-gray-50",
              )}
            >
              {label}
            </p>
            <p
              className={clsx(
                // base
                "text-right font-medium whitespace-nowrap tabular-nums",
                // text color
                "text-gray-900 dark:text-gray-50",
              )}
            >
              {payload.reduce((acc, { value }) => acc + value, 0)}
            </p>
          </div>
        </div>
        <div className={clsx("space-y-1 px-4 py-2")}>
          {payload.map(({ value, category, color }, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Tremor made this
              key={`id-${index}`}
              className="flex justify-between items-center space-x-8"
            >
              <div className="flex items-center space-x-2">
                <span
                  aria-hidden="true"
                  className={clsx(
                    "rounded-xs size-2 shrink-0",
                    getColorClassName(color, "bg"),
                  )}
                />
                <p
                  className={clsx(
                    // base
                    "text-right whitespace-nowrap",
                    // text color
                    "text-gray-700 dark:text-gray-300",
                  )}
                >
                  {category}
                </p>
              </div>
              <p
                className={clsx(
                  // base
                  "text-right font-medium whitespace-nowrap tabular-nums",
                  // text color
                  "text-gray-900 dark:text-gray-50",
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
