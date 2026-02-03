import clsx from "clsx";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Weight } from "~/app/_components/weight";
import Breadcrumb from "~/app/(public)/_components/breadcrumb";
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
      <h1 className="mt-4 font-semibold text-slate-900 text-xl">
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
              <table className="mt-6 w-auto min-w-full border-collapse table-fixed">
                <thead>
                  <tr>
                    <th className="w-8 text-right whitespace-nowrap" />
                    <th className="w-auto whitespace-nowrap grow">Module</th>
                    {programs.map((program) => (
                      <th
                        key={program.id}
                        className="border-slate-200 border-l w-12 min-w-10"
                      >
                        <div
                          style={{
                            writingMode: "vertical-rl",
                          }}
                          className="left-[calc(50%-0.5em)] relative font-semibold text-slate-800 text-center leading-none whitespace-nowrap rotate-180"
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
                        <td className="border-slate-20 border-t text-slate-900 whitespace-nowrap">
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
                                "border-slate-200 border-t border-l text-center",
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
              <div className="flex justify-end gap-x-4 mt-4 text-right">
                <div className="mt-2 text-slate-700 text-sm">
                  <span className="inline-block bg-pink-100 mr-2 rounded-sm size-6 text-sm text-center leading-6">
                    ✔
                  </span>
                  Kern
                </div>
                <div className="mt-2 text-slate-700 text-sm">
                  <span className="inline-block bg-blue-100 mr-2 rounded-sm size-6 text-sm text-center leading-6">
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
        <div className="pt-2 border-slate-300 border-t">
          <h2 className="text-slate-700">Programmaoverzicht</h2>
          <p className="text-sm">
            Een overzicht van de verschillende niveaus (programma's) voor deze
            cursus, met de bijbehorende competenties die per module worden
            aangeboden. Als ingelogd instructeur kun je ook de eisomschrijvingen
            voor deze competenties inzien.
          </p>
        </div>

        <ul className="space-y-6 pl-0 divide-y divide-zinc-950/5 list-none">
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
