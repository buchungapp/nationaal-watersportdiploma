"use cache";

import clsx from "clsx";
import { unstable_cacheLife } from "next/cache";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
import { Weight } from "~/app/_components/weight";
import {
  listCurriculaByDiscipline,
  listProgramsForCourse,
  retrieveCourseByHandle,
  retrieveDisciplineByHandle,
} from "~/lib/nwd";
import Program from "./_components/program";

export default async function Page(props: {
  params: Promise<{
    discipline: string;
    course: string;
  }>;
}) {
  unstable_cacheLife("days");

  const params = await props.params;
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
      <Breadcrumb
        items={[
          {
            label: discipline.title ?? "",
            href: `/diplomalijn/consument/disciplines/${params.discipline}`,
          },
          {
            label: course.title ?? "",
            href: `/diplomalijn/consument/disciplines/${params.discipline}/${params.course}`,
          },
        ]}
      />
      <h1 className="mt-4 text-xl font-semibold text-slate-900">
        {course.title}
      </h1>

      <div className="mt-8">
        <div>
          <h2 className="text-slate-700">Moduleoverzicht</h2>
          <p className="text-sm">
            Een overzicht van modules die op verschillende niveaus worden
            aangeboden, en of deze tot de kern behoren, of een keuze zijn voor
            extra verdieping en/of verbreding. Voor meer informatie lees je{" "}
            <Link href="/help/artikel/hoe-is-de-diplomalijn-van-het-nwd-opgebouwd">
              Hoe is de diplomalijn van het NWD opgebouwd?
            </Link>
          </p>
        </div>

        <div className="flow-root">
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <table className="mt-6 min-w-full w-auto table-fixed border-collapse">
                <thead>
                  <tr>
                    <th className="whitespace-nowrap text-right w-8" />
                    <th className="grow w-auto whitespace-nowrap">Module</th>
                    {programs.map((program) => (
                      <th
                        key={program.id}
                        className="w-12 min-w-10 border-l border-slate-200"
                      >
                        <div
                          style={{
                            writingMode: "vertical-rl",
                          }}
                          className="rotate-180 relative whitespace-nowrap text-center font-semibold text-slate-800 leading-none left-[calc(50%-0.5em)]"
                        >
                          {program.degree.title}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {uniqueModules.map((module) => {
                    return (
                      <tr key={module.id}>
                        <td>
                          <Weight weight={module.weight} />
                        </td>
                        <td className="text-slate-900 border-t border-slate-20 whitespace-nowrap">
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

                          const programModule = curriculum?.modules.find(
                            (curriculumModule) =>
                              curriculumModule.id === module.id,
                          );

                          return (
                            <td
                              key={program.id}
                              className={clsx(
                                "text-center border-l border-t border-slate-200",
                                programModule
                                  ? programModule.isRequired
                                    ? "bg-pink-100"
                                    : "bg-blue-100"
                                  : "bg-slate-100",
                              )}
                            >
                              {programModule
                                ? programModule.isRequired
                                  ? "✔"
                                  : "❍"
                                : ""}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="text-right flex justify-end mt-4 gap-x-4">
                <div className="text-sm text-slate-700 mt-2">
                  <span className="bg-pink-100 inline-block size-6 text-sm leading-6 text-center rounded-sm mr-2">
                    ✔
                  </span>
                  Kern
                </div>
                <div className="text-sm text-slate-700 mt-2">
                  <span className="bg-blue-100 inline-block size-6 text-sm leading-6 text-center rounded-sm mr-2">
                    ❍
                  </span>
                  Keuze
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 pb-4">
        <div className="border-t border-slate-300 pt-2">
          <h2 className="text-slate-700">Programmaoverzicht</h2>
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
