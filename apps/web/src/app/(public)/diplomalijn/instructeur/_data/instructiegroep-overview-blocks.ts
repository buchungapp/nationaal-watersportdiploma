import {
  findJachtzeilenVaarwaterCategory,
  JACHTZEILEN_EV_HANDLE,
  JACHTZEILEN_VAARWATER_ORDER,
  jachtzeilenVaarwaterDisplayBlock,
} from "./jachtzeilen-ev";

/** Chip order for leeftijd categories in the instructiegroep overview. */
export const LEEFTIJD_CATEGORY_ORDER = [
  "jeugd",
  "jongeren",
  "volwassenen",
] as const;

export type InstructiegroepOverviewBlockId =
  | "afstand"
  | "aan-boord"
  | "getijden";

type CourseForDisplay = {
  discipline: { handle: string };
  categories: Array<{ handle: string }>;
};

/**
 * Public UI blocks mapped to KSS instructiegroep titles in the database.
 * Titles must match `kss.instructie_groep.title` (matching is case-insensitive).
 *
 * Jachtzeilen is routed by vaarwater category — see jachtzeilen-ev.ts — not by
 * instructiegroep membership alone.
 */
export const INSTRUCTIEGROEP_OVERVIEW_BLOCKS = [
  {
    id: "afstand",
    title: "Afstandsinstructie",
    subtitle: "Les geven vanaf de wal of volgboot",
    instructiegroepTitles: ["Afstandinstructie", "Jeugdzeilen"],
    fullWidth: false,
  },
  {
    id: "aan-boord",
    title: "Aan boord instructie",
    subtitle: "Les geven aan boord van hetzelfde vaartuig",
    instructiegroepTitles: ["Aan boord"],
    fullWidth: false,
  },
  {
    id: "getijden",
    title: "Getijdenwater",
    subtitle: "Specialisatie voor getijdengebieden",
    instructiegroepTitles: [] as const,
    fullWidth: true,
  },
] as const satisfies ReadonlyArray<{
  id: InstructiegroepOverviewBlockId;
  title: string;
  subtitle: string;
  instructiegroepTitles: readonly string[];
  fullWidth: boolean;
}>;

export function normalizeInstructiegroepTitle(title: string): string {
  return title.trim().toLowerCase();
}

export function instructiegroepTitleMatches(
  dbTitle: string,
  configuredTitles: readonly string[],
): boolean {
  const normalized = normalizeInstructiegroepTitle(dbTitle);
  return configuredTitles.some(
    (configured) => normalizeInstructiegroepTitle(configured) === normalized,
  );
}

/** Which overview block a course appears in (display-only; KSS links unchanged). */
export function resolveInstructiegroepOverviewBlockId(
  course: CourseForDisplay,
  instructiegroepTitle: string,
): InstructiegroepOverviewBlockId | null {
  if (course.discipline.handle === JACHTZEILEN_EV_HANDLE) {
    const vaarwater = findJachtzeilenVaarwaterCategory(course.categories);
    if (!vaarwater) return null;
    return jachtzeilenVaarwaterDisplayBlock(vaarwater.handle);
  }

  for (const block of INSTRUCTIEGROEP_OVERVIEW_BLOCKS) {
    if (
      instructiegroepTitleMatches(
        instructiegroepTitle,
        block.instructiegroepTitles,
      )
    ) {
      return block.id;
    }
  }

  return null;
}

type CategoryChip = {
  id: string;
  handle: string;
  title: string;
  weight: number;
};

export function sortOverviewCategoryChips(
  categories: CategoryChip[],
): CategoryChip[] {
  const leeftijdOrder = new Map<string, number>(
    LEEFTIJD_CATEGORY_ORDER.map((handle, index) => [handle, index]),
  );
  const vaarwaterOrder = new Map<string, number>(
    JACHTZEILEN_VAARWATER_ORDER.map((handle, index) => [handle, index]),
  );

  return [...categories].sort((a, b) => {
    const indexA = leeftijdOrder.get(a.handle) ?? vaarwaterOrder.get(a.handle);
    const indexB = leeftijdOrder.get(b.handle) ?? vaarwaterOrder.get(b.handle);

    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }
    if (indexA !== undefined) return -1;
    if (indexB !== undefined) return 1;

    return a.weight - b.weight;
  });
}
