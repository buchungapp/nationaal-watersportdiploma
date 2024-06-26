import { Badge } from "./badge";

export function CompetencyTypeBadge({
  type,
}: {
  type: "skill" | "knowledge" | null;
}) {
  if (!type) return null;

  return (
    <Badge color={type === "knowledge" ? "blue" : "orange"}>
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
      {type === "required" ? "Verplicht" : "Optioneel"}
    </Badge>
  );
}
