import { listPublicInstructiegroepenWithCourses } from "~/lib/kss-public";
import { listCourses } from "~/lib/nwd";
import {
  INSTRUCTIEGROEP_OVERVIEW_BLOCKS,
  type InstructiegroepOverviewBlockId,
  resolveInstructiegroepOverviewBlockId,
  sortOverviewCategoryChips,
} from "../_data/instructiegroep-overview-blocks";

type InstructeurCourse = Awaited<ReturnType<typeof listCourses>>[number];

type DisciplineRow = {
  name: string;
  categories: Array<{ id: string; title: string; weight: number }>;
};

function groupCoursesByDiscipline(
  courses: InstructeurCourse[],
): DisciplineRow[] {
  const byDiscipline = new Map<
    string,
    {
      name: string;
      weight: number;
      categories: Map<
        string,
        { id: string; handle: string; title: string; weight: number }
      >;
    }
  >();

  for (const course of courses) {
    const disciplineId = course.discipline.id;

    if (!byDiscipline.has(disciplineId)) {
      byDiscipline.set(disciplineId, {
        name: course.discipline.title ?? course.discipline.handle,
        weight: course.discipline.weight,
        categories: new Map(),
      });
    }

    const row = byDiscipline.get(disciplineId);
    if (!row) continue;

    for (const category of course.categories) {
      if (!row.categories.has(category.id)) {
        row.categories.set(category.id, {
          id: category.id,
          handle: category.handle,
          title: category.title ?? category.handle,
          weight: category.weight,
        });
      }
    }
  }

  return [...byDiscipline.values()]
    .sort((a, b) => a.weight - b.weight)
    .map((row) => ({
      name: row.name,
      categories: sortOverviewCategoryChips([...row.categories.values()]),
    }));
}

function InstructiegroepCard({
  title,
  subtitle,
  rows,
  fullWidth,
}: {
  title: string;
  subtitle: string;
  rows: DisciplineRow[];
  fullWidth: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-5${fullWidth ? " md:col-span-2" : ""}`}
    >
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="text-xs text-slate-500">{subtitle}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-slate-400">
          Nog geen cursussen gekoppeld in het NWD-systeem.
        </p>
      ) : (
        <table className="mt-3 w-full">
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td className="whitespace-nowrap py-1 pr-3 text-sm font-medium text-slate-900">
                  {row.name}
                </td>
                <td className="py-1">
                  <div className="flex flex-wrap gap-1">
                    {row.categories.map((category) => (
                      <span
                        key={category.id}
                        className="rounded bg-slate-100 px-1.5 py-0 text-[10px] font-medium text-slate-600"
                      >
                        {category.title}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function collectCoursesByBlock(
  groepen: Awaited<ReturnType<typeof listPublicInstructiegroepenWithCourses>>,
  courseById: Map<string, InstructeurCourse>,
): Map<InstructiegroepOverviewBlockId, Set<string>> {
  const coursesByBlock = new Map<InstructiegroepOverviewBlockId, Set<string>>(
    INSTRUCTIEGROEP_OVERVIEW_BLOCKS.map((block) => [
      block.id,
      new Set<string>(),
    ]),
  );

  for (const groep of groepen) {
    for (const linked of groep.courses) {
      const course = courseById.get(linked.id);
      if (!course) continue;

      const blockId = resolveInstructiegroepOverviewBlockId(
        course,
        groep.title,
      );
      if (!blockId) continue;

      coursesByBlock.get(blockId)?.add(course.id);
    }
  }

  return coursesByBlock;
}

export async function InstructiegroepOverview() {
  const [groepen, allCourses] = await Promise.all([
    listPublicInstructiegroepenWithCourses("instructeur"),
    listCourses(),
  ]);

  const courseById = new Map(allCourses.map((course) => [course.id, course]));
  const coursesByBlock = collectCoursesByBlock(groepen, courseById);

  const blocks = INSTRUCTIEGROEP_OVERVIEW_BLOCKS.map((block) => {
    const courseIds = coursesByBlock.get(block.id) ?? new Set<string>();
    const courses = [...courseIds]
      .map((id) => courseById.get(id))
      .filter((course): course is InstructeurCourse => course !== undefined);

    return {
      ...block,
      rows: groupCoursesByDiscipline(courses),
    };
  });

  const hasAnyCourses = blocks.some((block) => block.rows.length > 0);

  if (!hasAnyCourses) {
    return (
      <div className="not-prose mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        De koppeling tussen cursussen en instructiegroepen wordt op dit moment
        ingericht. Zodra deze beschikbaar is verschijnt hier per instructiegroep
        een actueel overzicht van de bijbehorende disciplines.
      </div>
    );
  }

  return (
    <div className="not-prose mt-4 grid gap-4 md:grid-cols-2">
      {blocks.map((block) => (
        <InstructiegroepCard
          key={block.id}
          title={block.title}
          subtitle={block.subtitle}
          rows={block.rows}
          fullWidth={block.fullWidth}
        />
      ))}
    </div>
  );
}
