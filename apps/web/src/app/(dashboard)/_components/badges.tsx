import { Badge } from "./badge";

export const DEGREE_COLORS = {
  "niveau-1": "red",
  "niveau-2": "yellow",
  "niveau-3": "green",
  "niveau-4": "blue",
  "niveau-a": "purple",
  "niveau-b": "orange",
  "niveau-c": "green",
} as const;

export function DegreeBadge({
  handle,
  title,
}:
  | {
      handle: keyof typeof DEGREE_COLORS;
      title: string;
    }
  | {
      handle: null;
      title: null;
    }) {
  if (!handle) return null;

  return <Badge color={DEGREE_COLORS[handle]}>{title}</Badge>;
}

export function CompetencyTypeBadge({
  type,
}: {
  type: "skill" | "knowledge" | null;
}) {
  if (!type) return null;

  return (
    <Badge color={type === "knowledge" ? "green" : "orange"}>
      {type === "knowledge" ? "Kennis" : "Vaardigheid"}
    </Badge>
  );
}

export function ModuleRequiredBadge({
  type,
}: {
  type: "required" | "not-required" | null;
}) {
  if (!type) return null;

  return (
    <Badge color={type === "required" ? "red" : "blue"}>
      {type === "required" ? "Kern" : "Keuze"}
    </Badge>
  );
}
