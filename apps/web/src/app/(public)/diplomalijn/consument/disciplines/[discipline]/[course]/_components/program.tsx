import { notFound } from "next/navigation";
import { Suspense } from "react";
import {
  CompetencyTypeBadge,
  ModuleRequiredBadge,
} from "~/app/(dashboard)/_components/badges";
import Disclosure from "~/app/(public)/_components/disclosure";
import { Weight } from "~/app/_components/weight";
import type { retrieveCourseByHandle } from "~/lib/nwd";
import {
  getIsActiveInstructor,
  listCurriculaByDiscipline,
  listGearTypesByCurriculum,
  listProgramsForCourse,
} from "~/lib/nwd";

async function Requirement({ requirement }: { requirement: string | null }) {
  const isActiveInstructor = await getIsActiveInstructor();

  if (!isActiveInstructor) {
    return null;
  }

  return (
    <p className="text-base/6 text-zinc-500 sm:text-sm/6">{requirement}</p>
  );
}

export default async function Program({
  course,
  disciplineId,
  programId,
}: {
  course: NonNullable<Awaited<ReturnType<typeof retrieveCourseByHandle>>>;
  disciplineId: string;
  programId: string;
}) {
  const [program, curricula] = await Promise.all([
    listProgramsForCourse(course.id).then((programs) =>
      programs.find((program) => program.id === programId),
    ),
    listCurriculaByDiscipline(disciplineId),
  ]);

  if (!program) {
    notFound();
  }

  const curriculum = curricula.find(
    (curriculum) => curriculum.programId === programId,
  );

  if (!curriculum) {
    notFound();
  }

  const gearTypes = await listGearTypesByCurriculum(curriculum.id);

  return (
    <li className="pl-0">
      <Disclosure
        button={
          <span className="font-medium text-slate-900">
            {program.title ?? `${course.title} ${program.degree.title}`}
          </span>
        }
        size="xs"
      >
        <h4 className="font-medium text-sm mt-4">Beschikbare vaartuigen</h4>
        <ul className="columns-2 list-none not-prose mt-1">
          {gearTypes.map((gearType) => (
            <li key={gearType.id}>
              <p className="text-base/6 text-zinc-500 sm:text-sm/6">
                {gearType.title}
              </p>
            </li>
          ))}
        </ul>

        <h4 className="font-medium text-sm mt-6">Opbouw programma</h4>
        <ul className="list-none pl-0 space-y-4 mt-2">
          {curriculum?.modules
            .sort((a, b) => a.weight - b.weight)
            .map((module) => (
              <div key={module.id} className="not-prose">
                <li className="py-1.5 px-0">
                  <div className="flex items-center justify-between bg-slate-100 py-1 px-1.5 rounded-lg">
                    <div className="flex items-baseline gap-x-2">
                      <div className="shrink-0 w-12">
                        <Weight weight={module.weight} />
                      </div>
                      <h3 className="font-semibold text-slate-700">
                        {module.title}
                      </h3>
                    </div>
                    <div className="flex items-center justify-end gap-x-2">
                      <ModuleRequiredBadge
                        type={module.isRequired ? "required" : "not-required"}
                      />
                      <CompetencyTypeBadge type={module.type} />
                    </div>
                  </div>

                  <dl className="mt-2 space-y-1 px-1.5">
                    {module.competencies.map((competency) => (
                      <div key={competency.id} className="flex gap-x-2">
                        <div className="shrink-0 w-12">
                          <Weight weight={competency.weight} />
                        </div>
                        <div>
                          <dt>
                            <p className="text-base/6 font-medium text-zinc-950 sm:text-sm/6">
                              {competency.title}
                            </p>
                          </dt>
                          <Suspense fallback={null}>
                            <Requirement requirement={competency.requirement} />
                          </Suspense>
                        </div>
                      </div>
                    ))}
                  </dl>
                </li>
              </div>
            ))}
        </ul>
      </Disclosure>
    </li>
  );
}
