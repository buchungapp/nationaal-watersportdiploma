import { Badge } from "./badge";

export function CompetencyTypeBadge({ type }: { type: "skill" | "knowledge" }) {
  return (
    <Badge color={type === "knowledge" ? "blue" : "orange"}>
      {type === "knowledge" ? "Kennis" : "Vaardigheid"}
    </Badge>
  );
}
