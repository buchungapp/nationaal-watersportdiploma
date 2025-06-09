import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Divider } from "~/app/(dashboard)/_components/divider";
import { Subheading } from "~/app/(dashboard)/_components/heading";
import { TextLink } from "~/app/(dashboard)/_components/text";
import {
  listCurriculaByPersonId,
  listCurriculaProgressByPersonId,
  retrieveCohortByHandle,
  retrieveLocationByHandle,
  retrieveStudentAllocationWithCurriculum,
} from "~/lib/nwd";

type ProgramsProps = {
  params: Promise<{
    location: string;
    cohort: string;
    "student-allocation": string;
  }>;
};

async function ProgramsContent(props: ProgramsProps) {
  const params = await props.params;

  const location = await retrieveLocationByHandle(params.location);
  const cohort = await retrieveCohortByHandle(params.cohort, location.id);

  if (!cohort) {
    notFound();
  }

  const allocation = await retrieveStudentAllocationWithCurriculum(
    cohort.id,
    params["student-allocation"],
  );

  if (!allocation) {
    notFound();
  }

  const [curricula, progress] = await Promise.all([
    listCurriculaByPersonId(allocation.person.id, true),
    listCurriculaProgressByPersonId(allocation.person.id, false, false),
  ]);

  const curriculaWithProgress = curricula.map((curriculum) => ({
    curriculum,
    progress:
      progress.find((p) => p.studentCurriculumId === curriculum.id) || null,
  }));

  if (curriculaWithProgress.length === 0) {
    return (
      <div className="text-zinc-500 text-sm">Geen opleidingen gevonden</div>
    );
  }

  return (
    <ul className="flex flex-col gap-1 mt-4">
      {curriculaWithProgress
        .sort((a, b) => {
          // TODO: sort on category instead of course
          const course =
            b.curriculum.curriculum.program.course.handle.localeCompare(
              a.curriculum.curriculum.program.course.handle,
            );
          const disciplineWeight =
            b.curriculum.curriculum.program.course.discipline.weight -
            a.curriculum.curriculum.program.course.discipline.weight;
          const degreeRank =
            b.curriculum.curriculum.program.degree.rang -
            a.curriculum.curriculum.program.degree.rang;

          return course !== 0
            ? course
            : disciplineWeight !== 0
              ? disciplineWeight
              : degreeRank;
        })
        .map((curriculum) => (
          <li key={curriculum.curriculum.id}>
            {/* https://github.com/vercel/next.js/issues/65960 */}
            <TextLink
              href={`/locatie/${location.handle}/personen/${allocation.person.id}#curriculum-${curriculum.curriculum.id}`}
              className="flex items-center gap-1.5"
              target="_blank"
            >
              <span>
                <span className="text-sm">
                  {curriculum.curriculum.curriculum.program.course.title}
                </span>{" "}
                <span className="font-medium text-sm">
                  {curriculum.curriculum.curriculum.program.degree.title}
                </span>
              </span>

              <span className="inline-block text-zinc-500 text-xs no-underline">
                ({curriculum.progress?.modules.length ?? 0}/
                {curriculum.curriculum.curriculum.modules.length})
              </span>

              <ArrowTopRightOnSquareIcon className="size-4" />
            </TextLink>
          </li>
        ))}
    </ul>
  );
}

function ProgramsFallback() {
  return (
    <div className="bg-slate-200 mt-4 rounded-lg w-full h-18 animate-pulse" />
  );
}

export function Programs(props: ProgramsProps) {
  return (
    <div className="lg:col-start-3 lg:row-start-2">
      <div className="flex justify-between items-center">
        <Subheading>Opleidingen</Subheading>
      </div>
      <Divider className="mt-4" />
      <Suspense fallback={<ProgramsFallback />}>
        <ProgramsContent params={props.params} />
      </Suspense>
    </div>
  );
}
