import { listPublicInstructiegroepenWithCourses } from "~/lib/kss-public";
import { listCourses } from "~/lib/nwd";
import {
  groepTitleToOverviewBlockId,
  INSTRUCTIEGROEP_OVERVIEW_BLOCKS,
  type InstructiegroepOverviewBlockId,
  overviewChipsForCourse,
  sortOverviewCategoryChips,
} from "../_data/instructiegroep-overview-blocks";

type Course = Awaited<ReturnType<typeof listCourses>>[number];

type DisciplineRow = {
  handle: string;
  name: string;
  categories: Array<{ id: string; title: string; weight: number }>;
};

function collectCoursesByBlock(
  groepen: Awaited<ReturnType<typeof listPublicInstructiegroepenWithCourses>>,
  courseById: Map<string, Course>,
): Map<InstructiegroepOverviewBlockId, Set<string>> {
  const coursesByBlock = new Map<InstructiegroepOverviewBlockId, Set<string>>(
    INSTRUCTIEGROEP_OVERVIEW_BLOCKS.map((block) => [
      block.id,
      new Set<string>(),
    ]),
  );

  for (const groep of groepen) {
    const blockId = groepTitleToOverviewBlockId(groep.title);
    if (!blockId) continue;

    for (const linked of groep.courses) {
      if (courseById.has(linked.id)) {
        coursesByBlock.get(blockId)?.add(linked.id);
      }
    }
  }

  return coursesByBlock;
}

function groupCoursesByDiscipline(courses: Course[]): DisciplineRow[] {
  const byDiscipline = new Map<
    string,
    {
      handle: string;
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
    const disciplineHandle = course.discipline.handle;

    if (!byDiscipline.has(disciplineId)) {
      byDiscipline.set(disciplineId, {
        handle: disciplineHandle,
        name: course.discipline.title ?? disciplineHandle,
        weight: course.discipline.weight,
        categories: new Map(),
      });
    }

    const row = byDiscipline.get(disciplineId);
    if (!row) continue;

    for (const chip of overviewChipsForCourse(course)) {
      if (!row.categories.has(chip.id)) {
        row.categories.set(chip.id, chip);
      }
    }
  }

  return [...byDiscipline.values()]
    .sort((a, b) => a.weight - b.weight)
    .map((row) => ({
      handle: row.handle,
      name: row.name,
      categories: sortOverviewCategoryChips([
        ...row.categories.values(),
      ]).map(({ id, title, weight }) => ({ id, title, weight })),
    }))
    .filter((row) => row.categories.length > 0);
}

function InstructiegroepCard({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: DisciplineRow[];
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
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
              <tr key={row.handle}>
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
      .filter((course): course is Course => course !== undefined);

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
        />
      ))}
    </div>
  );
}
