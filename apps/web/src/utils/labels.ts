export function moduleTypeLabel(type: "knowledge" | "skill") {
  const moduleTypeLabels: Record<"knowledge" | "skill", string> = {
    knowledge: "Theorie",
    skill: "Praktijk",
  };

  return moduleTypeLabels[type];
}
