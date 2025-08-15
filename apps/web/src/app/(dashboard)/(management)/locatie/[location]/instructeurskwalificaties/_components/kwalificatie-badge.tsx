import type { KSS } from "@nawadi/core";

type Richting = Awaited<
  ReturnType<
    typeof KSS.Kwalificaties.listHighestKwalificatiePerCourseAndRichting
  >
>[number]["richting"];

const colorMap: Record<Richting, Record<number, string>> = {
  instructeur: {
    1: "bg-blue-50 text-blue-600 border-blue-200",
    2: "bg-blue-100 text-blue-700 border-blue-300",
    3: "bg-blue-200 text-blue-800 border-blue-400",
    4: "bg-blue-300 text-blue-900 border-blue-500",
    5: "bg-blue-400 text-white border-blue-600",
  },
  leercoach: {
    1: "bg-emerald-50 text-emerald-600 border-emerald-200",
    2: "bg-emerald-100 text-emerald-700 border-emerald-300",
    3: "bg-emerald-200 text-emerald-800 border-emerald-400",
    4: "bg-emerald-300 text-emerald-900 border-emerald-500",
    5: "bg-emerald-500 text-white border-emerald-700",
  },
  pvb_beoordelaar: {
    1: "bg-purple-50 text-purple-600 border-purple-200",
    2: "bg-purple-100 text-purple-700 border-purple-300",
    3: "bg-purple-200 text-purple-800 border-purple-400",
    4: "bg-purple-300 text-purple-900 border-purple-500",
    5: "bg-purple-500 text-white border-purple-700",
  },
};

const abbreviationMap: Record<Richting, string> = {
  instructeur: "I",
  leercoach: "L",
  pvb_beoordelaar: "B",
};

export function KwalificatieBadge({
  richting,
  niveau,
}: {
  richting: Richting;
  niveau: number;
}) {
  return (
    <span
      key={richting}
      className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-medium border ${colorMap[richting][niveau]}`}
    >
      {abbreviationMap[richting]}-{niveau}
    </span>
  );
}
