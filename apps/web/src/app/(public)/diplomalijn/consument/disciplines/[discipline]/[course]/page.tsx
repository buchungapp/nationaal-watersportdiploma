import clsx from "clsx";
import { notFound } from "next/navigation";
import { Weight } from "~/app/_components/weight";
import {
  listCurriculaByDiscipline,
  listProgramsForCourse,
  retrieveCourseByHandle,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";
import Program from "./_components/program";

export default async function Page({
  params,
}: {
  params: {
    discipline: string;
    course: string;
  };
}) {
  const [discipline, course] = await Promise.all([
    retrieveDisciplineByHandle(params.discipline),
    retrieveCourseByHandle(params.course),
  ]);

  if (!discipline || !course) {
    notFound();
  }

  const [programs, curricula] = await Promise.all([
    listProgramsForCourse(course.id),
    listCurriculaByDiscipline(discipline.id),
  ]);

  const relevantCurricula = curricula.filter((curriculum) =>
    programs.some((program) => program.id === curriculum.programId),
  );

  const uniqueModules = relevantCurricula
    .flatMap((curriculum) => curriculum.modules)
    .filter(
      (module, index, self) =>
        self.findIndex((m) => m.id === module.id) === index,
    )
    .sort((a, b) => a.weight - b.weight);

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900">{course.title}</h1>

      <div className="mt-8">
        <div>
          <h2 className="text-gray-700">Moduleoverzicht</h2>
          <p className="text-sm">
            Een overzicht van modules die op verschillende niveaus worden
            aangeboden, en of deze standaard worden aangeboden, of optioneel
            zijn voor een vaarlocatie om aan te bieden.
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
                    {programs.map((program) => (
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
                  {uniqueModules.map((module) => (
                    <tr key={module.id}>
                      <td>
                        <Weight weight={module.weight} />
                      </td>
                      <td className="text-gray-900 border-t border-slate-20 whitespace-nowrap">
                        {module.title}
                      </td>
                      {programs.map((program) => {
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
                            {curriculum ? (module.isRequired ? "✔" : "❍") : ""}
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
                  Standaard
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
        <div className="border-t border-gray-300 pt-2">
          <h2 className="text-gray-700">Programmaoverzicht</h2>
          <p className="text-sm">
            Een overzicht van de verschillende niveaus (programma's) voor deze
            cursus, met de bijbehorende competenties die per module worden
            aangeboden. Als ingelogd instructeur kun je ook de eisomschrijvingen
            voor deze competenties inzien.
          </p>
        </div>

        <ul className="list-none pl-0 space-y-6 divide-y divide-zinc-950/5">
          {programs.map((program) => {
            return (
              <Program
                key={program.id}
                course={course}
                disciplineId={discipline.id}
                programId={program.id}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
}
