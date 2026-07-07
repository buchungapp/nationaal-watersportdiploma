/** Jachtzeilen is the only discipline with a vaarwater hub for instructeur EV. */
export const JACHTZEILEN_EV_HANDLE = "jachtzeilen" as const;

export const JACHTZEILEN_EV_BASE = `/diplomalijn/instructeur/eigenvaardigheid/${JACHTZEILEN_EV_HANDLE}`;

/** Sort order for vaarwater courses on the hub (matches consument discipline page). */
export const JACHTZEILEN_VAARWATER_ORDER = [
  "binnenwater",
  "ruim-binnenwater",
  "waddenzee-en-zeeuwse-stromen",
  "zee",
] as const;

export function sortJachtzeilenCourses<
  T extends { categories: Array<{ handle: string; weight: number }> },
>(courses: T[]): T[] {
  const orderIndex = new Map<string, number>(
    JACHTZEILEN_VAARWATER_ORDER.map((handle, index) => [handle, index]),
  );

  return [...courses].sort((a, b) => {
    const vaarwaterA = a.categories.find((c) => orderIndex.has(c.handle));
    const vaarwaterB = b.categories.find((c) => orderIndex.has(c.handle));
    const indexA = vaarwaterA
      ? (orderIndex.get(vaarwaterA.handle) ?? 999)
      : 999;
    const indexB = vaarwaterB
      ? (orderIndex.get(vaarwaterB.handle) ?? 999)
      : 999;
    if (indexA !== indexB) return indexA - indexB;
    return (vaarwaterA?.weight ?? 0) - (vaarwaterB?.weight ?? 0);
  });
}
