import clsx from "clsx";
import { notFound } from "next/navigation";
import Disclosure from "~/app/(public)/_components/disclosure";
import {
  listCurriculaByDiscipline,
  listPrograms,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";

type Program = Awaited<ReturnType<typeof listPrograms>>[number];
type Category = Program["categories"][number];

const getUniqueParentCategories = (items: Program[], seen: string[]) => {
  const uniqueItems = items.reduce(
    (acc, program) => {
      program.categories.forEach(({ parent }) => {
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

const getUniqueCategories = (items: Program[]) => {
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

async function RecursivePrograms({
  programs,
  disciplineId,
  seenParentIds = [],
}: {
  programs: Program[];
  disciplineId: string;
  seenParentIds?: string[];
}) {
  const curricula = await listCurriculaByDiscipline(disciplineId);

  const filteredPrograms = programs.filter(
    (p) => p.discipline.id === disciplineId,
  );

  const uniqueParentCategories = getUniqueParentCategories(
    filteredPrograms,
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
        <table>
          <thead>
            <tr>
              <th></th>
              <th>Module</th>
              <th>Type</th>
              {filteredPrograms.map((program) => (
                <th
                  key={program.id}
                  style={{
                    writingMode: "vertical-rl",
                  }}
                  className="rotate-180 whitespace-nowrap text-center font-semibold text-gray-800 leading-none left:[calc(50%-0.5em)]"
                >
                  {program.degree.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {uniqueModules.map((module, index) => (
              <tr key={module.id}>
                <td>{`${index + 1}.`}</td>
                <td>{module.title}</td>
                <td>{module.type === "skill" ? "Praktijk" : "Theorie"}</td>
                {filteredPrograms.map((program) => {
                  const curriculum = curricula.find(
                    (curriculum) =>
                      curriculum.programId === program.id &&
                      curriculum.modules.some(
                        (curriculumModule) => curriculumModule.id === module.id,
                      ),
                  );

                  return (
                    <td
                      key={program.id}
                      className={clsx(
                        "text-center",
                        curriculum
                          ? module.isRequired
                            ? "bg-pink-100"
                            : "bg-blue-100"
                          : "transparent",
                      )}
                    >
                      {curriculum ? (module.isRequired ? "✔" : "❍") : ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        <ul className="list-none">
          {filteredPrograms.map((program) => {
            const curriculum = curricula.find(
              (curriculum) => curriculum.programId === program.id,
            );

            return (
              <li key={program.id}>
                <Disclosure
                  button={
                    <span className="font-medium text-gray-900">
                      {program.title}
                    </span>
                  }
                  size="xs"
                >
                  <ul className="list-none">
                    {curriculum?.modules.map((module) => (
                      <li
                        key={module.id}
                        className="bg-branding-light/5 border border-branding-light/25 rounded py-3.5 px-6"
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
                          {module.competencies.map((competency) => (
                            <li
                              key={competency.id}
                              className="text-base mt-0 mb-3.5"
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
      </>
    );
  }

  const relevantCategories = getUniqueCategories(filteredPrograms).filter(
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
        const relevantPrograms = filteredPrograms.filter((program) =>
          program.categories.some(
            (programCategory) => programCategory.id === category.id,
          ),
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
                <RecursivePrograms
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
  const [discipline, programs] = await Promise.all([
    retrieveDisciplineByHandle(params.discipline),
    listPrograms(),
  ]);

  if (!discipline) {
    notFound();
  }

  // const curricula = await listCurriculaByDiscipline(discipline.id);

  return (
    <div className="w-full">
      <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900">
        Programma's
      </h1>
      <p>
        Op deze pagina vind je een overzicht van de programma's die onder de
        discipline <strong>{discipline.title}</strong> vallen.
      </p>
      <RecursivePrograms programs={programs} disciplineId={discipline.id} />
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
