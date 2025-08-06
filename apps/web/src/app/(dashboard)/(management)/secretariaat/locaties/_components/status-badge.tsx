import { Badge } from "~/app/(dashboard)/_components/badge";

const statusColors = {
  draft: "branding-orange",
  hidden: "branding-dark",
  archived: "zinc",
  active: "green",
} as const;

const statusLabels = {
  draft: "Concept",
  hidden: "Verborgen",
  archived: "Gearchiveerd",
  active: "Actief",
};

export function StatusBadge({
  status,
}: { status: "draft" | "hidden" | "archived" | "active" }) {
  return <Badge color={statusColors[status]}>{statusLabels[status]}</Badge>;
}
