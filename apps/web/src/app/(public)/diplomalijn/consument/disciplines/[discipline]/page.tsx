import clsx from "clsx";
import { notFound } from "next/navigation";
import Disclosure from "~/app/(public)/_components/disclosure";
import {
  listCourses,
  listCurriculaByDiscipline,
  listPrograms,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";

type Course = Awaited<ReturnType<typeof listCourses>>[number];
type Program = Awaited<ReturnType<typeof listPrograms>>[number];
type Category = Course["categories"][number];

const getUniqueParentCategories = (items: Course[], seen: string[]) => {
  const uniqueItems = items.reduce(
    (acc, course) => {
      course.categories.forEach(({ parent }) => {
        if (!parent || seen.includes(parent.id)) {
          return;
        }

        if (!acc[parent.id]) {
          acc[parent.id] = parent;
        }
      });
      return acc;
    },
    {} as Record<string, NonNullable<Category["parent"]>>,
  );

  // Return an array of values from the unique items object
  return Object.values(uniqueItems).sort((a, b) => a.weight - b.weight);
};

const getUniqueCategories = (items: Course[]) => {
  const uniqueItems = items.reduce(
    (acc, program) => {
      program.categories.forEach((category) => {
        if (!acc[category.id]) {
          acc[category.id] = category;
        }
      });
      return acc;
    },
    {} as Record<string, Category>,
  );

  // Return an array of values from the unique items object
  return Object.values(uniqueItems).sort((a, b) => a.weight - b.weight);
};

async function RecursiveCourses({
  courses,
  programs,
  disciplineId,
  seenParentIds = [],
}: {
  courses: Course[];
  programs: Program[];
  disciplineId: string;
  seenParentIds?: string[];
}) {
  const curricula = await listCurriculaByDiscipline(disciplineId);

  const filteredCourses = courses.filter(
    (c) => c.discipline.id === disciplineId,
  );

  const filteredPrograms = programs.filter((p) =>
    filteredCourses.some((c) => c.id === p.course.id),
  );

  const uniqueParentCategories = getUniqueParentCategories(
    filteredCourses,
    seenParentIds,
  );

  const groupingCategory = uniqueParentCategories.at(0);

  if (!groupingCategory) {
    const uniqueModules = curricula
      .filter((curriculum) =>
        filteredPrograms.some((program) => program.id === curriculum.programId),
      )
      .flatMap((curriculum) => curriculum.modules)
      .filter(
        (module, index, self) =>
          self.findIndex((m) => m.id === module.id) === index,
      )
      .sort((a, b) => a.weight - b.weight);

    return (
      <>
        <div className="pl-6 md:pl-10 mt-8">
          <div>
            <h3 className="text-gray-700">Moduleoverzicht</h3>
            <p className="text-sm">
              Een overzicht van modules die op verschillende niveaus worden
              aangeboden, en of deze verplicht of optioneel zijn om het
              eindniveau te bereiken.
            </p>
          </div>

          <div className="flow-root">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full align-middle">
                <table className="mt-6 min-w-full w-auto table-fixed border-collapse">
                  <thead>
                    <tr>
                      <th className="whitespace-nowrap text-right w-8" />
                      <th className="flex-grow w-auto whitespace-nowrap">
                        Module
                      </th>
                      {filteredPrograms.map((program) => (
                        <th
                          key={program.id}
                          className="w-12 min-w-10 border-l border-slate-200"
                        >
                          <div
                            style={{
                              writingMode: "vertical-rl",
                            }}
                            className="rotate-180 relative whitespace-nowrap text-center font-semibold text-gray-800 leading-none left-[calc(50%-0.5em)]"
                          >
                            {program.degree.title}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {uniqueModules.map((module, index) => (
                      <tr key={module.id}>
                        <td className="whitespace-nowrap text-right tabular-nums border-t border-slate-200">{`${index + 1}.`}</td>
                        <td className="text-gray-900 border-t border-slate-20 whitespace-nowrap">
                          {module.title}
                        </td>
                        {filteredPrograms.map((program) => {
                          const curriculum = curricula.find(
                            (curriculum) =>
                              curriculum.programId === program.id &&
                              curriculum.modules.some(
                                (curriculumModule) =>
                                  curriculumModule.id === module.id,
                              ),
                          );

                          return (
                            <td
                              key={program.id}
                              className={clsx(
                                "text-center border-l border-t border-slate-200",
                                curriculum
                                  ? module.isRequired
                                    ? "bg-pink-100"
                                    : "bg-blue-100"
                                  : "bg-slate-100",
                              )}
                            >
                              {curriculum
                                ? module.isRequired
                                  ? "✔"
                                  : "❍"
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="text-right flex justify-end mt-4 gap-x-4">
                  <div className="text-sm text-gray-700 mt-2">
                    <span className="bg-pink-100 inline-block size-6 text-sm leading-6 text-center rounded mr-2">
                      ✔
                    </span>
                    Verplicht
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    <span className="bg-blue-100 inline-block size-6 text-sm leading-6 text-center rounded mr-2">
                      ❍
                    </span>
                    Optioneel
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pb-4">
          <div className="ml-10 border-t border-gray-300 pt-2">
            <h3 className="text-gray-700">Cursusoverzicht</h3>
            <p className="text-sm">
              Een overzicht van de cursussen, met de bijbehorende competenties
              die per module worden aangeboden. De eisomschrijvingen zijn voor
              instructeurs via de eigen vaarlocatie te verkrijgen.
            </p>
          </div>

          <ul className="list-none space-y-6">
            {filteredPrograms.map((program) => {
              const course = filteredCourses.find(
                (course) => course.id === program.course.id,
              )!;

              const curriculum = curricula.find(
                (curriculum) => curriculum.programId === program.id,
              );

              return (
                <li key={program.id}>
                  <Disclosure
                    button={
                      <span className="font-medium text-gray-900">
                        {program.title ??
                          `${course.title} ${program.degree.title}`}
                      </span>
                    }
                    size="xs"
                  >
                    <ul className="list-none">
                      {curriculum?.modules
                        .sort((a, b) => a.weight - b.weight)
                        .map((module) => (
                          <li
                            key={module.id}
                            className="bg-branding-light/5 border border-branding-light/25 rounded py-1.5 px-6"
                          >
                            <p className="flex items-center justify-between">
                              <span className="font-semibold text-gray-700">
                                {module.title}
                              </span>
                              <span
                                className={clsx(
                                  "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset",
                                  module.isRequired
                                    ? "bg-pink-50 text-pink-600 ring-pink-500/20"
                                    : "bg-blue-50 text-blue-600 ring-blue-500/20",
                                )}
                              >
                                {module.isRequired ? "Verplicht" : "Optioneel"}
                              </span>
                            </p>
                            <ul className="mt-6 columns-1 lg:columns-2 gap-x-10 px-3.5">
                              {module.competencies
                                .sort((a, b) => a.weight - b.weight)
                                .map((competency) => (
                                  <li
                                    key={competency.id}
                                    className="text-sm mt-0 mb-2.5 break-inside-avoid"
                                  >
                                    {competency.title}
                                  </li>
                                ))}
                            </ul>
                          </li>
                        ))}
                    </ul>
                  </Disclosure>
                </li>
              );
            })}
          </ul>
        </div>
      </>
    );
  }

  const relevantCategories = getUniqueCategories(filteredCourses).filter(
    (category) => category.parent?.id === groupingCategory.id,
  );

  return (
    <ul
      className={clsx(
        "list-none w-full",
        seenParentIds.length < 1 && "pl-0 *:pl-0",
      )}
    >
      {relevantCategories.map((category) => {
        const relevantCourses = filteredCourses.filter((course) =>
          course.categories.some(
            (courseCategory) => courseCategory.id === category.id,
          ),
        );

        const relevantPrograms = filteredPrograms.filter((program) =>
          relevantCourses.some((course) => course.id === program.course.id),
        );

        return (
          <li key={category.id} className="w-full">
            <Disclosure
              button={
                <div className="w-full text-left font-semibold text-gray-800">
                  {`${groupingCategory.title}: ${category.title}`}
                </div>
              }
              size={seenParentIds.length < 1 ? "base" : "sm"}
            >
              <div className="border-l border-gray-300">
                <RecursiveCourses
                  courses={relevantCourses}
                  programs={relevantPrograms}
                  disciplineId={disciplineId}
                  seenParentIds={[...seenParentIds, groupingCategory.id]}
                />
              </div>
            </Disclosure>
          </li>
        );
      })}
    </ul>
  );
}

export default async function Page({
  params,
}: {
  params: {
    discipline: string;
  };
}) {
  const [discipline, courses, programs] = await Promise.all([
    retrieveDisciplineByHandle(params.discipline),
    listCourses(),
    listPrograms(),
  ]);

  if (!discipline) {
    notFound();
  }

  // const curricula = await listCurriculaByDiscipline(discipline.id);

  return (
    <div className="w-full">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
        Cursussen
      </h1>
      <p>
        Op deze pagina vind je een overzicht van de cursussen die onder de
        discipline <strong>{discipline.title}</strong> vallen.
      </p>
      <RecursiveCourses
        courses={courses}
        programs={programs}
        disciplineId={discipline.id}
      />
    </div>
  );
}

// ## Jachtzeilen

// De diplomalijn voor het jachtzeilen is zo ingedeeld zodat het optimaal aansluit
// bij het vaargebied. Daarom is de discipline jachtzeilen opgedeeld in 4
// diplomalijnen:

// - Binnenwater
// - Ruim Binnenwater
// - Waddenzee en Zeeuwse Stromen
// - Kustwater en Open Zee

// Verder zijn er modules zodat je je verder kunt specialiseren. Denk hierbij aan
// de modules:

// - Platbodem varen
// - Middenlandse Zee voorbereiding
// - Stromende vaarwateren / rivieren
// - Varen met Spinaker/Genaker
