import {
  JACHTZEILEN_EV_HANDLE,
  JACHTZEILEN_VAARWATER_ORDER,
} from "./jachtzeilen-ev";

/** Chip order for leeftijd categories in the instructiegroep overview. */
export const LEEFTIJD_CATEGORY_ORDER = [
  "jeugd",
  "jongeren",
  "volwassenen",
] as const;

const leeftijdCategoryHandles = new Set<string>(LEEFTIJD_CATEGORY_ORDER);
const vaarwaterCategoryHandles = new Set<string>(JACHTZEILEN_VAARWATER_ORDER);

export type InstructiegroepOverviewBlockId =
  | "afstand"
  | "aan-boord"
  | "getijden";

type CategoryChip = {
  id: string;
  handle: string;
  title: string;
  weight: number;
};

/**
 * Public UI blocks mapped to KSS instructiegroep titles in the database.
 * Titles must match `kss.instructie_groep.title` (matching is case-insensitive).
 */
export const INSTRUCTIEGROEP_OVERVIEW_BLOCKS = [
  {
    id: "afstand",
    title: "Afstandsinstructie",
    subtitle: "Les geven vanaf de wal of volgboot",
    instructiegroepTitles: [
      "Jeugdzeilen",
      "Afstandsinstructie",
      "Afstandinstructie",
    ],
  },
  {
    id: "aan-boord",
    title: "Aan boord instructie",
    subtitle: "Les geven aan boord van hetzelfde vaartuig",
    instructiegroepTitles: ["Aan boord instructie"],
  },
  {
    id: "getijden",
    title: "Getijdenwater",
    subtitle: "Specialisatie voor getijdengebieden",
    instructiegroepTitles: ["Getijdenwater", "Jachtzeilen"],
  },
] as const satisfies ReadonlyArray<{
  id: InstructiegroepOverviewBlockId;
  title: string;
  subtitle: string;
  instructiegroepTitles: readonly string[];
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

export function groepTitleToOverviewBlockId(
  title: string,
): InstructiegroepOverviewBlockId | null {
  for (const block of INSTRUCTIEGROEP_OVERVIEW_BLOCKS) {
    if (instructiegroepTitleMatches(title, block.instructiegroepTitles)) {
      return block.id;
    }
  }
  return null;
}

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

/** Categories shown per discipline row on the public instructiegroep overview. */
export function filterOverviewCategoryChips(
  disciplineHandle: string,
  categories: CategoryChip[],
): CategoryChip[] {
  const filtered =
    disciplineHandle === JACHTZEILEN_EV_HANDLE
      ? categories.filter((category) =>
          vaarwaterCategoryHandles.has(category.handle),
        )
      : categories.filter((category) =>
          leeftijdCategoryHandles.has(category.handle),
        );

  return sortOverviewCategoryChips(filtered);
}

type CourseWithCategories = {
  discipline: { handle: string };
  categories: Array<{
    id: string;
    handle: string;
    title: string | null;
    weight: number;
  }>;
};

/** Leeftijd or vaarwater chips for one linked course in the overview table. */
export function overviewChipsForCourse(course: CourseWithCategories): CategoryChip[] {
  return filterOverviewCategoryChips(
    course.discipline.handle,
    course.categories.map((category) => ({
      id: category.id,
      handle: category.handle,
      title: category.title ?? category.handle,
      weight: category.weight,
    })),
  );
}
