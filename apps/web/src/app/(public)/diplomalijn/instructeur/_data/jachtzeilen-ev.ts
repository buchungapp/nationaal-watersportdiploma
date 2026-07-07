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

export type JachtzeilenVaarwaterHandle =
  (typeof JACHTZEILEN_VAARWATER_ORDER)[number];

/** Display-only: shown under aan boord instructie on the instructiegroepen page. */
export const JACHTZEILEN_VAARWATER_AAN_BOORD: readonly JachtzeilenVaarwaterHandle[] =
  JACHTZEILEN_VAARWATER_ORDER.slice(0, 2);

/** Display-only: shown under getijdenwater on the instructiegroepen page. */
export const JACHTZEILEN_VAARWATER_GETIJDEN: readonly JachtzeilenVaarwaterHandle[] =
  JACHTZEILEN_VAARWATER_ORDER.slice(2);

const vaarwaterHandleSet = new Set<string>(JACHTZEILEN_VAARWATER_ORDER);

export function findJachtzeilenVaarwaterCategory<T extends { handle: string }>(
  categories: T[],
): T | undefined {
  return categories.find((category) => vaarwaterHandleSet.has(category.handle));
}

export function jachtzeilenVaarwaterDisplayBlock(
  vaarwaterHandle: string,
): "aan-boord" | "getijden" | null {
  if (
    (JACHTZEILEN_VAARWATER_AAN_BOORD as readonly string[]).includes(
      vaarwaterHandle,
    )
  ) {
    return "aan-boord";
  }
  if (
    (JACHTZEILEN_VAARWATER_GETIJDEN as readonly string[]).includes(
      vaarwaterHandle,
    )
  ) {
    return "getijden";
  }
  return null;
}

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
