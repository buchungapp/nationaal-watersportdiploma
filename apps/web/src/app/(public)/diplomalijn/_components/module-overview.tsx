import clsx from "clsx";
import { Weight } from "~/app/_components/weight";
import type { listCurriculaByDiscipline, listProgramsForCourse } from "~/lib/nwd";

type Programs = Awaited<ReturnType<typeof listProgramsForCourse>>;
type Curricula = Awaited<ReturnType<typeof listCurriculaByDiscipline>>;

// Extracted from the consumenten course page so it can be reused for the
// instructor eigenvaardigheid pages. Same logic: cross-tabulate modules
// against programs with kern / keuze cell marks.
export function ModuleOverview({
  programs,
  curricula,
}: {
  programs: Programs;
  curricula: Curricula;
}) {
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

  if (uniqueModules.length === 0) {
    return null;
  }

  return (
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
                      style={{ writingMode: "vertical-rl" }}
                      className="left-[calc(50%-0.5em)] relative font-semibold text-slate-800 text-center leading-none whitespace-nowrap rotate-180"
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
                      (curriculumModule) => curriculumModule.id === module.id,
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
              ))}
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
  );
}
