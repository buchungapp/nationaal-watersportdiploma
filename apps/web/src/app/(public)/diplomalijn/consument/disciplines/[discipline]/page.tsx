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
    return (
      <ul>
        {filteredPrograms.map((program) => {
          const curriculum = curricula.find(
            (curriculum) => curriculum.programId === program.id,
          );

          return (
            <li key={program.id}>
              {program.title}
              <ul>
                {curriculum?.modules.map((module) => (
                  <li key={module.id}>
                    {module.title}
                    <ul>
                      {module.competencies.map((competency) => (
                        <li key={competency.id}>{competency.title}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ul>
    );
  }

  const relevantCategories = getUniqueCategories(filteredPrograms).filter(
    (category) => category.parent?.id === groupingCategory.id,
  );

  return (
    <ul className="list-none w-full">
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
                <div className="w-full text-left">
                  {`${groupingCategory.title}: ${category.title}`}
                </div>
              }
            >
              <RecursivePrograms
                programs={relevantPrograms}
                disciplineId={disciplineId}
                seenParentIds={[...seenParentIds, groupingCategory.id]}
              />
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
      <h1>Programma's</h1>
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
